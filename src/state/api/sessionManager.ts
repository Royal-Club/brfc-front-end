import axios from "axios";
import { API_URL } from "../../settings";

/**
 * Owns the exchange of an expired access token for a fresh one.
 *
 * Both transports route their 401s through here - RTK Query in `apiSlice` and the axios instance in
 * `axiosBase` - because the single-flight guard below is only worth anything if it covers the whole
 * app. Refresh tokens are single-use on the server, so two concurrent renewals would have the
 * second one present an already-spent token, trip the server's reuse detection and revoke every
 * session the member has: a worse outcome than the expiry we set out to hide.
 */

const TOKEN_CONTENT_KEY = "tokenContent";

export interface SessionTokens {
    token: string;
    refreshToken: string;
}

/**
 * Pages reachable without signing in. A 401 raised while the user is on one of these must not drag
 * them to the login screen - the emailed RSVP and password-reset links are followed precisely by
 * people who cannot sign in, and bouncing them would break the only route they have.
 */
const PUBLIC_PATHS = ["/login", "/rsvp", "/forgot-password", "/password-reset", "/auction/register/"];

export const isOnPublicPage = () =>
    PUBLIC_PATHS.some((path) => window.location.pathname.startsWith(path));

/**
 * Endpoints that carry their own credential in the body. A 401 from one of them is final: answering
 * a failed refresh by refreshing again is an infinite loop.
 */
const AUTH_FREE_PATHS = ["auth/login", "auth/refresh", "auth/logout"];

/** Callers pass anything from `auth/login` to a fully qualified URL, so match on the segment. */
export function isAuthFree(url: string | undefined): boolean {
    return !!url && AUTH_FREE_PATHS.some((path) => url.includes(path));
}

// Injected by the store once it exists, so this module stays free of a cycle back through it.
let onTokensRenewed: (tokens: SessionTokens) => void = () => {};
let onSessionEnded: () => void = () => {};

export function configureSession(options: {
    /** Publishes renewed tokens to the store, so the next request picks them up. */
    onTokensRenewed: (tokens: SessionTokens) => void;
    /** Called once the session is beyond saving and the member has to sign in again. */
    onSessionEnded: () => void;
}) {
    onTokensRenewed = options.onTokensRenewed;
    onSessionEnded = options.onSessionEnded;
}

function readStoredContent(): Record<string, unknown> | null {
    try {
        const raw = localStorage.getItem(TOKEN_CONTENT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        // Truncated or written by an older version of the app. Unreadable is the same as absent.
        return null;
    }
}

export function getStoredRefreshToken(): string | null {
    const refreshToken = readStoredContent()?.refreshToken;
    return typeof refreshToken === "string" && refreshToken ? refreshToken : null;
}

/**
 * Whether an expired access token is worth renewing rather than bouncing to the login page. Used by
 * the screens that gate on token validity during render.
 */
export function hasRecoverableSession(): boolean {
    return getStoredRefreshToken() !== null;
}

/**
 * Writes the renewed pair to both places the app reads a session from: `localStorage` under
 * `tokenContent`, which survives a reload and is what the bootstrap check reads, and the store,
 * which is what outgoing requests read. Leaving either behind ends the session at the next reload.
 */
function persist(tokens: SessionTokens) {
    const content = readStoredContent();
    if (content) {
        localStorage.setItem(TOKEN_CONTENT_KEY, JSON.stringify({ ...content, ...tokens }));
    }
    onTokensRenewed(tokens);
}

/** In-flight renewal, shared by every request that 401s while it runs. */
let renewalInFlight: Promise<string | null> | null = null;

/** Renews the session, returning the new access token, or null when it can no longer be renewed. */
export function refreshSession(): Promise<string | null> {
    if (!renewalInFlight) {
        renewalInFlight = requestRenewal().finally(() => {
            renewalInFlight = null;
        });
    }
    return renewalInFlight;
}

async function requestRenewal(): Promise<string | null> {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
        return null;
    }

    try {
        // Bare axios rather than the app's instance: this call must not pass back through the
        // interceptor that is waiting on it.
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const content = response.data?.content;
        if (!content?.token || !content?.refreshToken) {
            // The server answered but didn't hand back a usable pair - it looked at the token and
            // had nothing to renew it with, which is as final as an explicit rejection.
            endSession();
            return null;
        }

        // The server rotates on every exchange, so the token we just sent is already dead. Storing
        // its replacement before returning is what keeps the session alive past this renewal.
        persist({ token: content.token, refreshToken: content.refreshToken });
        return content.token;
    } catch (err) {
        // A response means the server actually looked at the refresh token and turned it down -
        // gone, expired or revoked - so the session really is over.
        if (axios.isAxiosError(err) && err.response) {
            endSession();
            return null;
        }

        // No response at all (network failure, DNS blip, the API waking back up after sitting idle
        // for hours) means the refresh token was never evaluated. Failing soft here - returning null
        // without touching the stored session - leaves it intact for the next attempt instead of
        // forcing a needless re-login over what might be a few seconds of bad timing.
        return null;
    }
}

/**
 * Best-effort revocation of the refresh token held by this device, for a deliberate sign-out.
 *
 * Without it the member's session lives on the server for its full window, spendable by any copy of
 * the token, however thoroughly the browser was cleared.
 */
export async function revokeRefreshToken(): Promise<void> {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
        return;
    }

    try {
        await axios.post(`${API_URL}/auth/logout`, { refreshToken });
    } catch {
        // A sign-out has to clear this device whether or not the server can be reached; the row
        // expires on its own.
    }
}

/**
 * Ends a session that can no longer be renewed and sends the member back to sign in.
 *
 * The clearing half is idempotent, because a screen with several requests in flight has all of them
 * fail the same renewal and arrive here one after another. It keys off stored state rather than a
 * flag, so signing in again during the same page load re-arms it.
 */
export function endSession() {
    if (localStorage.getItem(TOKEN_CONTENT_KEY) !== null) {
        // Clear before redirecting. The session is persisted and survives the page load, so a bare
        // redirect would land on an app that still believes it is signed in, fire the same request,
        // 401 again and reload forever.
        localStorage.removeItem(TOKEN_CONTENT_KEY);
        onSessionEnded();
    }

    if (!isOnPublicPage()) {
        window.location.href = "/login";
    }
}
