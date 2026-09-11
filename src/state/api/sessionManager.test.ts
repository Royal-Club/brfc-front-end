import type axiosModule from "axios";

jest.mock("axios");

/**
 * Re-read after every `resetModules`. The manager is required fresh in each test, which hands it a
 * new axios mock; a reference captured at file scope would belong to an earlier registry and see
 * none of the calls.
 */
let mockedAxios: jest.Mocked<typeof axiosModule>;

/** A JWT whose payload carries the given expiry. Only the middle segment is ever read. */
const tokenExpiringIn = (ms: number): string => {
    const payload = { exp: Math.floor((Date.now() + ms) / 1000) };
    const encoded = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_");
    return `header.${encoded}.signature`;
};

/** No response at all: the call never reached the server. */
const transportFailure = () => Object.assign(new Error("Network Error"), { isAxiosError: true });

/** The server looked at the refresh token and turned it down. */
const rejected = () =>
    Object.assign(new Error("Unauthorized"), {
        isAxiosError: true,
        response: { status: 401, data: {} },
    });

const renewedPair = (accessLifetimeMs = 60 * 60 * 1000) => ({
    data: {
        content: {
            token: tokenExpiringIn(accessLifetimeMs),
            refreshToken: "refresh-2",
        },
    },
});

/**
 * Fresh module state per test. The manager deliberately holds the in-flight renewal and the pending
 * timer at module scope, so tests would otherwise leak into one another.
 */
const loadManager = () => require("./sessionManager") as typeof import("./sessionManager");

/** Lets queued promise callbacks run. This jest predates the async timer helpers. */
const flush = async () => {
    for (let i = 0; i < 12; i += 1) {
        await Promise.resolve();
    }
};

/** Moves the clock without firing anything that was scheduled beyond the window. */
const tick = async (ms: number) => {
    await flush();
    jest.advanceTimersByTime(ms);
    await flush();
};

/**
 * Drives a renewal that sleeps between attempts, stopping the moment it settles.
 *
 * Retries are awaited timers, so the chain only advances if the clock moves between them. It stops
 * at settlement rather than draining everything, because a successful renewal books the next one and
 * running that too would renew again.
 */
const settle = async <T,>(promise: Promise<T>): Promise<T> => {
    let done = false;
    const tracked = promise.then(
        (value) => {
            done = true;
            return value;
        },
        (err) => {
            done = true;
            throw err;
        }
    );

    for (let round = 0; round < 25 && !done; round += 1) {
        await flush();
        if (done) break;
        if (jest.getTimerCount() > 0) {
            jest.runOnlyPendingTimers();
        }
    }

    await flush();
    return tracked;
};

describe("session renewal", () => {
    let sessionEnded: jest.Mock;
    let tokensRenewed: jest.Mock;

    beforeEach(() => {
        jest.resetModules();
        jest.useFakeTimers();

        mockedAxios = require("axios");

        localStorage.setItem(
            "tokenContent",
            JSON.stringify({ token: tokenExpiringIn(60 * 60 * 1000), refreshToken: "refresh-1" })
        );

        sessionEnded = jest.fn();
        tokensRenewed = jest.fn();

        (mockedAxios.isAxiosError as unknown as jest.Mock).mockImplementation(
            (err: unknown) => !!(err as { isAxiosError?: boolean })?.isAxiosError
        );
    });

    afterEach(() => {
        jest.useRealTimers();
        localStorage.clear();
    });

    const configured = () => {
        const manager = loadManager();
        manager.configureSession({
            onTokensRenewed: tokensRenewed,
            onSessionEnded: sessionEnded,
        });
        return manager;
    };

    /**
     * The bug this covers: the renewal was the one call in the app with no retry, so an API that had
     * gone cold would fail it, strand the tab on a dead token and leave the member stuck until they
     * reloaded the page themselves.
     */
    it("retries a renewal that never reached the server, and succeeds", async () => {
        mockedAxios.post
            .mockRejectedValueOnce(transportFailure())
            .mockResolvedValueOnce(renewedPair());

        const manager = configured();
        const token = await settle(manager.refreshSession());

        expect(token).toEqual(expect.any(String));

        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        expect(tokensRenewed).toHaveBeenCalledWith(
            expect.objectContaining({ refreshToken: "refresh-2" })
        );
        expect(sessionEnded).not.toHaveBeenCalled();
    });

    it("keeps the session when every attempt fails to reach the server", async () => {
        mockedAxios.post.mockRejectedValue(transportFailure());

        const manager = configured();
        await expect(settle(manager.refreshSession())).resolves.toBeNull();

        // Three attempts: the first, then one per configured backoff step.
        expect(mockedAxios.post).toHaveBeenCalledTimes(3);
        // A blip must not cost the member their session.
        expect(sessionEnded).not.toHaveBeenCalled();
        expect(localStorage.getItem("tokenContent")).not.toBeNull();
    });

    /**
     * A response means the refresh token was actually evaluated and turned down. Asking again would
     * only get the same answer, and the session really is over.
     */
    it("does not retry when the server rejects the refresh token, and ends the session", async () => {
        mockedAxios.post.mockRejectedValue(rejected());

        const manager = configured();

        await expect(settle(manager.refreshSession())).resolves.toBeNull();
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(sessionEnded).toHaveBeenCalled();
        expect(localStorage.getItem("tokenContent")).toBeNull();
    });

    it("ends the session when the server answers without a usable pair", async () => {
        mockedAxios.post.mockResolvedValue({ data: { content: { token: "only-half" } } });

        const manager = configured();

        await expect(settle(manager.refreshSession())).resolves.toBeNull();
        expect(sessionEnded).toHaveBeenCalled();
    });

    /**
     * Refresh tokens are single-use on the server. Two renewals in flight at once would have the
     * second present an already-spent token and trip the server's reuse detection, revoking every
     * session the member has.
     */
    it("shares one renewal between everything that asks at the same time", async () => {
        mockedAxios.post.mockResolvedValue(renewedPair());

        const manager = configured();
        const [first, second, third] = await Promise.all([
            manager.refreshSession(),
            manager.refreshSession(),
            manager.refreshSession(),
        ]);

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(first).toBe(second);
        expect(second).toBe(third);
    });

    it("gives up renewing once there is no refresh token to spend", async () => {
        localStorage.setItem(
            "tokenContent",
            JSON.stringify({ token: tokenExpiringIn(60 * 1000) })
        );

        const manager = configured();

        await expect(settle(manager.refreshSession())).resolves.toBeNull();
        expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    describe("renewing ahead of expiry", () => {
        /**
         * Without this the app only learned a token had expired by sending a request that failed, so
         * every hour of an open tab opened with a guaranteed 401.
         */
        it("renews before the token expires rather than waiting for a failure", async () => {
            mockedAxios.post.mockResolvedValue(renewedPair());

            const manager = configured();
            manager.startSessionRenewal();

            // Still well inside the token's hour, so nothing should have been asked for yet.
            await tick(50 * 60 * 1000);
            expect(mockedAxios.post).not.toHaveBeenCalled();

            // Past the point where only the lead time remains.
            await tick(9 * 60 * 1000);
            expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        });

        it("renews immediately when the stored token is already inside the lead window", async () => {
            localStorage.setItem(
                "tokenContent",
                JSON.stringify({ token: tokenExpiringIn(30 * 1000), refreshToken: "refresh-1" })
            );
            mockedAxios.post.mockResolvedValue(renewedPair());

            const manager = configured();
            manager.startSessionRenewal();

            await tick(0);
            expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        });

        it("books the next renewal after each successful one, so an open tab keeps going", async () => {
            mockedAxios.post.mockResolvedValue(renewedPair());

            const manager = configured();
            manager.startSessionRenewal();

            await tick(59 * 60 * 1000);
            expect(mockedAxios.post).toHaveBeenCalledTimes(1);

            // The renewed token carries its own hour, and the schedule re-arms from it.
            await tick(59 * 60 * 1000);
            expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        });

        it("stops renewing once the session is cleared", async () => {
            mockedAxios.post.mockResolvedValue(renewedPair());

            const manager = configured();
            manager.startSessionRenewal();
            manager.clearScheduledRenewal();

            await tick(2 * 60 * 60 * 1000);
            expect(mockedAxios.post).not.toHaveBeenCalled();
        });
    });
});
