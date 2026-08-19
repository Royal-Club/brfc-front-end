import React, { useEffect, useState } from "react";
import { Image, Skeleton } from "antd";
import { FileOutlined } from "@ant-design/icons";
import { ITeamChatAttachment } from "../../state/features/teamChat/teamChatSlice";
import {
    formatBytes,
    isPreviewableImage,
    loadTeamChatImageUrl,
} from "../../utils/teamChatUpload";

interface TeamChatAttachmentProps {
    attachment: ITeamChatAttachment;
    /** Used for anything that cannot be shown inline, and as the fallback when a preview fails. */
    onDownload: (attachment: ITeamChatAttachment) => void;
}

/**
 * One shared file inside a message bubble.
 *
 * <p>Photos are the common case - a team photo or a pitch location shared before a match - so they
 * are rendered in place rather than made to be downloaded first. Everything else stays a download
 * row, as does an image whose fetch failed: showing a broken frame would be worse than the row that
 * at least says what the file is.
 */
export default function TeamChatAttachment({
    attachment,
    onDownload,
}: TeamChatAttachmentProps) {
    const previewable = isPreviewableImage(attachment.contentType);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!previewable) {
            return;
        }

        // Guarded because a bubble can unmount while its image is still in flight - the list
        // re-renders on every socket frame.
        let active = true;
        loadTeamChatImageUrl(attachment.id, attachment.downloadUrl)
            .then((url) => {
                if (active) {
                    setImageUrl(url);
                }
            })
            .catch(() => {
                if (active) {
                    setFailed(true);
                }
            });

        return () => {
            active = false;
        };
    }, [previewable, attachment.id, attachment.downloadUrl]);

    if (previewable && !failed) {
        if (!imageUrl) {
            return (
                <Skeleton.Image active className="team-chat__image-loading" />
            );
        }
        return (
            <Image
                src={imageUrl}
                alt={attachment.fileName}
                className="team-chat__image"
                // The lightbox is antd's own, so full-size viewing costs nothing to build and the
                // blob is already in memory by the time it opens.
                preview={{ mask: "View" }}
            />
        );
    }

    return (
        <button
            type="button"
            className="team-chat__file"
            onClick={() => onDownload(attachment)}
        >
            <FileOutlined />
            <span className="team-chat__file-name">{attachment.fileName}</span>
            <span className="team-chat__file-size">
                {formatBytes(attachment.sizeBytes)}
            </span>
        </button>
    );
}
