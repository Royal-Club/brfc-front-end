import { message } from "antd";
import { API_URL as SETTINGS_API_URL } from "../../settings";
import type {
    IResourceAttachment,
    ResourceContentType,
    ResourceStatus,
} from "../../state/features/resources/resourcesSlice";

const API_URL = (process.env.REACT_APP_API_URL || SETTINGS_API_URL || "").replace(/\/$/, "");

export const MAX_RESOURCE_FILE_MB = 25;

export const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
];

/** Mirrors the allowlist enforced by ResourceFileController. */
export const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, "application/pdf"];

export type ContentLanguage = "en" | "bn";

export interface ResourceTypeMeta {
    label: string;
    color: string;
}

export const RESOURCE_TYPE_META: Record<ResourceContentType, ResourceTypeMeta> = {
    ARTICLE: { label: "Guide", color: "blue" },
    FORMATION: { label: "Formation", color: "green" },
    VIDEO: { label: "Video", color: "red" },
    DOCUMENT: { label: "Document", color: "orange" },
    LINK: { label: "Link", color: "purple" },
};

export const RESOURCE_STATUS_META: Record<ResourceStatus, ResourceTypeMeta> = {
    DRAFT: { label: "Draft", color: "default" },
    PUBLISHED: { label: "Published", color: "success" },
    ARCHIVED: { label: "Archived", color: "warning" },
};

/**
 * The API returns storage paths relative to the API host so the same payload
 * works against local and R2 storage.
 */
export function toAbsoluteResourceUrl(url?: string | null): string | undefined {
    if (!url) return undefined;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return API_URL + url;
}

/**
 * Picks the Bangla text when the reader asked for Bangla and a translation
 * exists, otherwise falls back to English. Resources are often only partly
 * translated, so this runs per field rather than per resource.
 */
export function pickLocalized(
    english?: string | null,
    bangla?: string | null,
    language: ContentLanguage = "en"
): string {
    if (language === "bn" && bangla && bangla.trim()) return bangla;
    return english ?? "";
}

export function validateResourceFile(file: File, imagesOnly = false): string | null {
    const allowed = imagesOnly ? ALLOWED_IMAGE_TYPES : ALLOWED_FILE_TYPES;
    if (!allowed.includes(file.type)) {
        return imagesOnly
            ? "Only JPG, PNG, WEBP, GIF and SVG images are allowed."
            : "Only images and PDF documents are allowed.";
    }
    if (file.size > MAX_RESOURCE_FILE_MB * 1024 * 1024) {
        return `File must be smaller than ${MAX_RESOURCE_FILE_MB}MB.`;
    }
    return null;
}

/**
 * Presign, then PUT the bytes straight at the returned target. The upload URL
 * is either this API (local storage) or R2, so it must not carry our bearer
 * token — the same flow player photos use.
 */
export async function uploadResourceFile(
    file: File,
    presignFn: (params: { fileName: string; contentType: string }) => Promise<any>,
    imagesOnly = false
): Promise<IResourceAttachment | null> {
    const validationError = validateResourceFile(file, imagesOnly);
    if (validationError) {
        message.error(validationError);
        return null;
    }

    try {
        const presignResult = await presignFn({
            fileName: file.name,
            contentType: file.type,
        });
        const { key, uploadUrl } =
            presignResult?.content ?? presignResult?.data?.content ?? {};

        if (!uploadUrl || !key) throw new Error("No presigned URL returned");

        const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
        });

        if (!uploadResponse.ok) throw new Error("Upload to storage failed");

        return {
            storageKey: key,
            fileName: file.name,
            contentType: file.type,
            sizeBytes: file.size,
            kind: file.type.startsWith("image/") ? "IMAGE" : "DOCUMENT",
        };
    } catch (err: any) {
        message.error(err?.message || "Failed to upload file");
        return null;
    }
}

/**
 * Accepts the usual youtube.com/watch, youtu.be and /embed/ shapes.
 */
export function youTubeVideoId(url?: string | null): string | null {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/,
        /(?:youtu\.be\/)([\w-]{11})/,
        /(?:youtube\.com\/embed\/)([\w-]{11})/,
        /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

export function formatFileSize(bytes?: number | null): string {
    if (!bytes || bytes <= 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
