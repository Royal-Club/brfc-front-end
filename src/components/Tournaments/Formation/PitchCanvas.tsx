import React from "react";
import { club } from "../../../theme/clubTheme";

interface PitchCanvasProps {
    /** Tokens are positioned absolutely inside the box using x/y percentages. */
    children?: React.ReactNode;
    /** `width / height`. Taller on phones so tokens keep breathing room. */
    aspectRatio?: string;
    maxWidth?: number;
    /**
     * Caps the pitch at a share of the viewport height so the whole field is
     * visible without scrolling. Omit to size on width alone.
     */
    maxHeightVh?: number;
    /** Forwarded so a drag handler can measure the box. */
    innerRef?: React.Ref<HTMLDivElement>;
    onPointerDown?: React.PointerEventHandler<HTMLDivElement>;
    style?: React.CSSProperties;
}

/**
 * Turns a height budget into a width budget. `aspect-ratio` gives way to an
 * explicit `max-height`, which would squash the pitch — capping the *width*
 * instead keeps the shape and still bounds the height.
 */
const widthCap = (aspectRatio: string, maxWidth: number, maxHeightVh?: number): string => {
    if (!maxHeightVh) return `${maxWidth}px`;
    const [w, h] = aspectRatio.split("/").map((part) => Number(part.trim()));
    if (!w || !h) return `${maxWidth}px`;
    return `min(${maxWidth}px, ${((maxHeightVh * w) / h).toFixed(2)}vh)`;
};

const marking = "2px solid rgba(255,255,255,0.45)";

/**
 * The vertical pitch every line-up view draws on: markings only, no players.
 *
 * Children position themselves with `left: x%` / `top: y%`, where `y = 0` is
 * the far goal and `y = 100` the team's own goal — the same co-ordinate space
 * the formation presets and the stored slots use.
 */
const PitchCanvas: React.FC<PitchCanvasProps> = ({
    children,
    aspectRatio = "4 / 5",
    maxWidth = 620,
    maxHeightVh,
    innerRef,
    onPointerDown,
    style,
}) => (
    <div
        ref={innerRef}
        onPointerDown={onPointerDown}
        style={{
            position: "relative",
            width: "100%",
            maxWidth: widthCap(aspectRatio, maxWidth, maxHeightVh),
            margin: "0 auto",
            aspectRatio,
            borderRadius: 14,
            overflow: "hidden",
            background:
                "repeating-linear-gradient(0deg, #2E9E5B 0 8%, #2A9153 8% 16%)",
            border: `2px solid ${club.panelBorder}`,
            boxShadow: "inset 0 0 60px rgba(0,0,0,0.35)",
            touchAction: "none",
            ...style,
        }}
    >
        {/* Touchlines */}
        <div
            style={{
                position: "absolute",
                inset: "2.5%",
                border: marking,
                borderRadius: 6,
                pointerEvents: "none",
            }}
        />
        {/* Halfway line */}
        <div
            style={{
                position: "absolute",
                top: "50%",
                left: "2.5%",
                right: "2.5%",
                height: 2,
                background: "rgba(255,255,255,0.45)",
                pointerEvents: "none",
            }}
        />
        {/* Centre circle */}
        <div
            style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "22%",
                aspectRatio: "1",
                transform: "translate(-50%, -50%)",
                border: marking,
                borderRadius: "50%",
                pointerEvents: "none",
            }}
        />
        {/* Own penalty area */}
        <div
            style={{
                position: "absolute",
                bottom: "2.5%",
                left: "22%",
                right: "22%",
                height: "14%",
                border: marking,
                borderBottom: "none",
                pointerEvents: "none",
            }}
        />
        {/* Far penalty area */}
        <div
            style={{
                position: "absolute",
                top: "2.5%",
                left: "22%",
                right: "22%",
                height: "14%",
                border: marking,
                borderTop: "none",
                pointerEvents: "none",
            }}
        />
        {children}
    </div>
);

export default PitchCanvas;
