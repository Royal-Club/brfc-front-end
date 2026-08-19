import store from "../state/store";
import { selectLoginInfo } from "../state/slices/loginInfoSlice";
import { ITeamChatPresign } from "../state/features/teamChat/teamChatSlice";
import { compressImage } from "./imageUploadUtils";

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
