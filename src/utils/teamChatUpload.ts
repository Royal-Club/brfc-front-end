import store from "../state/store";
import { selectLoginInfo } from "../state/slices/loginInfoSlice";
import { ITeamChatPresign } from "../state/features/teamChat/teamChatSlice";
import { compressImage } from "./imageUploadUtils";
import { API_URL } from "../settings";

/** Mirrors the server's per-file cap, so an oversized file is refused before it is uploaded. */
export const MAX_TEAM_CHAT_FILE_BYTES = 3 * 1024 * 1024;

/**
 * Longest edge a shared photo is reduced to before upload.
 *
 * <p>A phone camera picture is often 4-6MB and would fail the 3MB cap outright, which would make sharing a
 * team photo — the single most common thing anyone wants to do here — the one thing that never
 * works. Downscaled to 1600px it lands around 200-400KB and still looks right on any screen.
 */
const IMAGE_MAX_DIMENSION = 1600;

/** Kept in step with the allow-list in TeamChatServiceImpl. */
export const ALLOWED_TEAM_CHAT_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
];

/** Formats are re-encoded losslessly enough to be worth shrinking; GIF would lose its animation. */
const COMPRESSIBLE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface UploadedTeamChatFile {
    key: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
}

export const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Uploads one file into a team room and returns the descriptor to attach to a message.
 *
 * <p>The bytes go straight to storage over the presigned URL — they never pass through the API. That
 * is why the returned key, not the file, is what gets posted.
 *
 * @param remainingBytes space left in the room's shared budget, used only to fail early with a
 *                       clearer message; the server re-checks and is the authority.
 */
export async function uploadTeamChatFile(
    file: File,
    presign: (params: {
        fileName: string;
        contentType: string;
        sizeBytes: number;
    }) => Promise<ITeamChatPresign>,
    remainingBytes?: number
): Promise<UploadedTeamChatFile> {
    if (!ALLOWED_TEAM_CHAT_TYPES.includes(file.type)) {
        throw new Error("Only images, PDFs, Office documents and plain text can be shared");
    }

    // Shrunk before the size check, not after, so a large photo is fixed rather than rejected.
    let payload = file;
    if (COMPRESSIBLE_IMAGE_TYPES.includes(file.type) && file.size > MAX_TEAM_CHAT_FILE_BYTES) {
        payload = await compressImage(file, IMAGE_MAX_DIMENSION);
    }

    if (payload.size > MAX_TEAM_CHAT_FILE_BYTES) {
        throw new Error(
            `Files must be ${formatBytes(MAX_TEAM_CHAT_FILE_BYTES)} or smaller — this one is ${formatBytes(
                payload.size
            )}`
        );
    }

    if (remainingBytes !== undefined && payload.size > remainingBytes) {
        throw new Error(
            `Not enough space left in this team chat — ${formatBytes(remainingBytes)} free`
        );
    }

    const contentType = payload.type || "application/octet-stream";
    const slot = await presign({
        fileName: payload.name,
        contentType,
        sizeBytes: payload.size,
    });

    const headers: Record<string, string> = { "Content-Type": contentType };

    // Only when the upload is going back to our own API. Against R2 the URL is already signed, and
    // an extra Authorization header would invalidate that signature rather than add to it.
    if (slot.uploadUrl.includes("/files/team-chat/local/")) {
        const token = selectLoginInfo(store.getState()).token;
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
    }

    const response = await fetch(slot.uploadUrl, {
        method: "PUT",
        headers,
        body: payload,
    });

    if (!response.ok) {
        throw new Error("Failed to upload the file");
    }

    return {
        key: slot.key,
        fileName: payload.name,
        contentType,
        sizeBytes: payload.size,
    };
}

/**
 * Fetches one shared file and hands it to the browser as a download.
 *
 * <p>The attachment route is authenticated and the token lives in the store rather than in a
 * cookie, so a plain link cannot reach it: a navigation carries no Authorization header and the
 * server rejects the request as anonymous before it ever gets as far as checking squad membership.
 * The bytes therefore have to be fetched here, where the header can be set, and then handed over as
 * an object URL.
 *
 * @throws Error carrying the server's own message, so a closed or purged room still explains itself
 */
export async function downloadTeamChatAttachment(
    downloadUrl: string,
    fileName: string
): Promise<void> {
    const blobUrl = URL.createObjectURL(await fetchTeamChatAttachment(downloadUrl));
    try {
        // A synthetic anchor rather than window.open: this runs after an await, and popup blockers
        // treat a window opened there as unrequested, whereas a download click is always honoured.
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
    } finally {
        // Deferred: revoking straight away can cancel the download in Safari before it starts.
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    }
}

/** The subset of the allow-list a browser can render inline, so a photo need not be downloaded. */
const PREVIEWABLE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function isPreviewableImage(contentType: string): boolean {
    return PREVIEWABLE_TYPES.includes(contentType);
}

/**
 * Object URLs for images already fetched, keyed by attachment id.
 *
 * <p>The promise is cached rather than the URL, so several bubbles mounting at once share one
 * request instead of racing. Nothing is ever revoked: a room holds at most 10MB in total (the
 * server's own cap), the same photo is usually on screen repeatedly as the list re-renders, and
 * leaving the page discards the whole map anyway. Revoking eagerly would only mean re-downloading
 * an image the moment it scrolls back into view.
 */
const imageUrlCache = new Map<number, Promise<string>>();

/** The object URL for an image attachment, fetched with the caller's token exactly once. */
export function loadTeamChatImageUrl(
    attachmentId: number,
    downloadUrl: string
): Promise<string> {
    const cached = imageUrlCache.get(attachmentId);
    if (cached) {
        return cached;
    }

    const pending = fetchTeamChatAttachment(downloadUrl)
        .then((blob) => URL.createObjectURL(blob))
        .catch((error) => {
            // Dropped so a failure is retried on the next render rather than cached forever.
            imageUrlCache.delete(attachmentId);
            throw error;
        });

    imageUrlCache.set(attachmentId, pending);
    return pending;
}

/**
 * The bytes of one attachment.
 *
 * <p>The route is authenticated and the token lives in the store rather than in a cookie, so a
 * plain link or a bare <img src> cannot reach it: neither carries an Authorization header, and the
 * server rejects the request as anonymous before it ever gets as far as checking squad membership.
 *
 * @throws Error carrying the server's own message, so a closed or purged room still explains itself
 */
async function fetchTeamChatAttachment(downloadUrl: string): Promise<Blob> {
    const token = selectLoginInfo(store.getState()).token;

    const response = await fetch(`${API_URL}${downloadUrl}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
        // The error body is the usual envelope; fall back to a generic line when it is not JSON,
        // which is what a proxy or a dropped backend returns.
        const message = await response
            .json()
            .then((body) => body?.message as string | undefined)
            .catch(() => undefined);
        throw new Error(message || "Could not open that file");
    }

    return response.blob();
}
