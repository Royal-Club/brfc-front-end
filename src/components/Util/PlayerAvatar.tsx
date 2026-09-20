import { CSSProperties, ReactNode, useState } from "react";
import { Avatar, Image, Tooltip } from "antd";
import { UserOutlined } from "@ant-design/icons";

type AvatarSize = number | "small" | "default" | "large" | Record<string, number>;

interface PlayerAvatarProps {
    /** Absolute photo URL. When absent the fallback icon shows and nothing is clickable. */
    src?: string;
    size?: AvatarSize;
    /** Name of the person in the photo — used for the alt text and the hover hint. */
    name?: string;
    /** Shown when there is no photo. Defaults to the generic user icon. */
    icon?: ReactNode;
    style?: CSSProperties;
    className?: string;
    /** Avatar content (e.g. initials) — antd only shows it when there is no photo. */
    children?: ReactNode;
}

/**
 * Avatar that opens the full-size photo in antd's lightbox when clicked.
 *
 * The thumbnail stays an <Avatar> so every existing ring/border style keeps working;
 * the <Image> next to it renders nothing and exists only to host the preview portal,
 * which is how antd exposes a lightbox for an image it doesn't render itself.
 */
export default function PlayerAvatar({
    src,
    size,
    name,
    icon,
    style,
    className,
    children,
}: PlayerAvatarProps) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const hasPhoto = Boolean(src);

    const avatar = (
        <Avatar
            size={size}
            src={src}
            icon={!src && !children ? (icon ?? <UserOutlined />) : undefined}
            className={className}
            style={{ ...style, cursor: hasPhoto ? "zoom-in" : style?.cursor }}
            onClick={hasPhoto ? () => setPreviewOpen(true) : undefined}
        >
            {children}
        </Avatar>
    );

    return (
        <>
            {/* Tooltip rather than a title attribute: AvatarProps has no `title`, and
                Tooltip clones the avatar instead of wrapping it, so the flex layouts
                these avatars sit in are unaffected. */}
            {hasPhoto ? (
                <Tooltip title={name ? `View ${name}'s photo` : "View photo"}>{avatar}</Tooltip>
            ) : (
                avatar
            )}
            {hasPhoto && (
                <Image
                    src={src}
                    alt={name}
                    wrapperStyle={{ display: "none" }}
                    preview={{
                        visible: previewOpen,
                        src,
                        onVisibleChange: value => setPreviewOpen(value),
                    }}
                />
            )}
        </>
    );
}
