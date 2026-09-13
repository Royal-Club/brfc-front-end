import store from "../store";
import { selectLoginInfo } from "../slices/loginInfoSlice";
import { API_URL } from "../../settings";
import { refreshSession } from "./sessionManager";

/**
 * `fetch` for the handful of calls that cannot go through RTK Query or the axios instance.
 *
 * <p>Uploads and downloads stream a `Blob` to or from a URL handed out by a presign call, which
 * neither transport is shaped for — so each of those callers wrote its own `fetch`, and each one
 * reimplemented the credential while quietly leaving out the renewal that goes with it. The result
 * was a set of features that worked for fifty-nine minutes and then failed permanently: opening a
 * shared photo, uploading one, changing a profile picture. Every one of them a single round trip
 * away from being fine.
 *
 * <p>Two rules, in one place, so the next upload inherits them:
 *
 * <ul>
 *   <li><b>The header goes on our own API and nowhere else.</b> A presigned R2 URL already carries
 *       its authorisation in the query string, and an extra `Authorization` header does not add to
 *       that signature — it invalidates it, and the upload is rejected by the bucket.</li>
 *   <li><b>A 401 is renewed once and replayed</b>, exactly as both other transports do. A second
 *       401 is final: the token was fresh and still refused, so the problem is not expiry.</li>
 * </ul>
 */

/**
 * Whether a URL points back at our own API, and so should carry the member's token.
 *
 * <p>Decided by the shape of the path rather than by comparing hosts. The local storage providers
 * build their upload URLs from their own base-url setting, which is a different environment variable
 * from the one the front end calls the API by — same host in development, not necessarily so in
 * production behind a proxy or a separate file domain. Matching on origin would then quietly stop
 * sending the token and turn every upload into a 401.
 *
 * <p>A presigned R2 URL carries its authorisation in the query string and must be left alone, and
 * one never looks like these: the `/local/` segment exists precisely to mark the uploads our own API
 * serves in place of a bucket.
 */
const OWN_API_UPLOAD_PATHS = [
    "/files/local/",
    "/files/player-photos/local/",
    "/files/team-logos/local/",
    "/files/resources/local/",
    "/files/team-chat/local/",
];

function isOwnApi(url: string): boolean {
    // A relative URL can only be ours, and covers the authenticated download routes.
    if (url.startsWith("/")) {
        return true;
    }

    if (OWN_API_UPLOAD_PATHS.some((path) => url.includes(path))) {
        return true;
    }

    try {
        return (
            new URL(url).origin === new URL(API_URL, window.location.origin).origin
        );
    } catch {
        // Unparseable means it is not a URL we issued, so err towards sending nothing: an
        // unnecessary header breaks a presigned upload, while a missing one merely fails it.
        return false;
    }
}

function withAuthorization(init: RequestInit, token: string | null): RequestInit {
    if (!token) {
        return init;
    }
    return { ...init, headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${token}` } };
}

/**
 * Sends the request with the member's token when it is ours to send, renewing once on a 401.
 *
 * @param url  absolute, or a path relative to the API
 * @param init standard `fetch` options; any headers given are preserved
 */
export async function authorizedFetch(url: string, init: RequestInit = {}): Promise<Response> {
    const target = url.startsWith("http") ? url : `${API_URL}${url}`;

    if (!isOwnApi(url)) {
        return fetch(target, init);
    }

    const response = await fetch(target, withAuthorization(init, selectLoginInfo(store.getState()).token));
    if (response.status !== 401) {
        return response;
    }

    const renewed = await refreshSession();
    if (!renewed) {
        // `refreshSession` has already ended the session if the refresh token was genuinely gone;
        // a null with the session intact means the renewal call could not be reached. Either way
        // there is nothing to retry with, so the caller sees the original refusal.
        return response;
    }

    return fetch(target, withAuthorization(init, renewed));
}
