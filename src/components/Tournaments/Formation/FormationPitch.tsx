import React, { useCallback, useRef } from "react";
import { Avatar, Tooltip } from "antd";
import useIsMobile from "../../../hooks/useIsMobile";
import { club, scoreNum } from "../../../theme/clubTheme";
import { toAbsolutePlayerPhotoUrl } from "../../../utils/playerPhotoUtils";
import type { ITeamFormationSlot } from "../../../state/features/tournaments/teamFormationSlice";
import PitchCanvas from "./PitchCanvas";

/** Keeps a token from being dragged half off the pitch. */
const MIN_COORDINATE = 4;
const MAX_COORDINATE = 96;
/** Pointer travel under this is a tap, not a drag. */
const DRAG_THRESHOLD_PX = 4;

interface FormationPitchProps {
    slots: ITeamFormationSlot[];
    /** Enables dragging and taps; off for everyone but the captain and admins. */
    editable?: boolean;
    selectedSlotIndex?: number | null;
    /** Lit up while a bench player is being dragged over it. */
    dropTargetSlotIndex?: number | null;
    onSelectSlot?: (slotIndex: number) => void;
    onMoveSlot?: (slotIndex: number, x: number, y: number) => void;
    /** Shared with the parent so a bench drop can measure the pitch. */
    pitchRef?: React.MutableRefObject<HTMLDivElement | null>;
    aspectRatio?: string;
    maxWidth?: number;
    maxHeightVh?: number;
}

const clamp = (value: number): number =>
    Math.min(MAX_COORDINATE, Math.max(MIN_COORDINATE, value));

/**
 * Draws a line-up's starters on the pitch. When editable, tokens can be nudged
 * by dragging and picked by tapping; the parent owns the slot state either way.
 */
const FormationPitch: React.FC<FormationPitchProps> = ({
    slots,
    editable = false,
    selectedSlotIndex = null,
    dropTargetSlotIndex = null,
    onSelectSlot,
    onMoveSlot,
    pitchRef,
    aspectRatio,
    maxWidth = 460,
    maxHeightVh = 58,
}) => {
    const isMobile = useIsMobile(768);
    const fallbackRef = useRef<HTMLDivElement | null>(null);
    const boxRef = pitchRef ?? fallbackRef;
    // Held in a ref rather than state: a drag must not re-render on every move.
    const dragRef = useRef<{ slotIndex: number; startX: number; startY: number; moved: boolean } | null>(null);

    const tokenSize = isMobile ? 34 : 44;

    const handlePointerDown = useCallback(
        (event: React.PointerEvent<HTMLDivElement>, slotIndex: number) => {
            if (!editable) return;
            event.preventDefault();
            event.stopPropagation();
            (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
            dragRef.current = {
                slotIndex,
                startX: event.clientX,
                startY: event.clientY,
                moved: false,
            };
        },
        [editable]
    );

    const handlePointerMove = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            const drag = dragRef.current;
            const pitch = boxRef.current;
            if (!drag || !pitch || !onMoveSlot) return;

            if (
                Math.abs(event.clientX - drag.startX) > DRAG_THRESHOLD_PX ||
                Math.abs(event.clientY - drag.startY) > DRAG_THRESHOLD_PX
            ) {
                drag.moved = true;
            }
            if (!drag.moved) return;

            const bounds = pitch.getBoundingClientRect();
            onMoveSlot(
                drag.slotIndex,
                clamp(((event.clientX - bounds.left) / bounds.width) * 100),
                clamp(((event.clientY - bounds.top) / bounds.height) * 100)
            );
        },
        [boxRef, onMoveSlot]
    );

    const handlePointerUp = useCallback(() => {
        const drag = dragRef.current;
        dragRef.current = null;
        // A tap opens the picker; a drag has already done its work.
        if (drag && !drag.moved) {
            onSelectSlot?.(drag.slotIndex);
        }
    }, [onSelectSlot]);

    return (
        <PitchCanvas
            innerRef={boxRef}
            aspectRatio={aspectRatio ?? (isMobile ? "3 / 4" : "4 / 5")}
            maxWidth={maxWidth}
            maxHeightVh={maxHeightVh}
        >
            {/* One overlay catches the whole drag, so a fast pointer cannot outrun a token. */}
            <div
                style={{ position: "absolute", inset: 0 }}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                {slots
                    .filter((slot) => slot.isStarter)
                    .map((slot) => {
                        const selected = selectedSlotIndex === slot.slotIndex;
                        const isDropTarget = dropTargetSlotIndex === slot.slotIndex;
                        const filled = slot.teamPlayerId != null;
                        const highlight = selected || isDropTarget;
                        const label = slot.playerName || slot.slotLabel || slot.positionGroup;

                        return (
                            <Tooltip
                                key={slot.slotIndex}
                                title={
                                    <div style={{ fontSize: 12 }}>
                                        <div style={{ fontWeight: 700 }}>
                                            {slot.playerName || "Empty position"}
                                        </div>
                                        <div>{slot.slotLabel || slot.positionGroup}</div>
                                        {slot.jerseyNumber != null && <div>#{slot.jerseyNumber}</div>}
                                        {editable && (
                                            <div style={{ marginTop: 4, opacity: 0.8 }}>
                                                Tap to assign · drag to reposition
                                            </div>
                                        )}
                                    </div>
                                }
                            >
                                <div
                                    onPointerDown={(event) => handlePointerDown(event, slot.slotIndex)}
                                    style={{
                                        position: "absolute",
                                        left: `${slot.x}%`,
                                        top: `${slot.y}%`,
                                        transform: "translate(-50%, -50%)",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        width: isMobile ? 66 : 84,
                                        textAlign: "center",
                                        cursor: editable ? "grab" : "default",
                                        touchAction: "none",
                                        zIndex: highlight ? 3 : 2,
                                    }}
                                >
                                    {/* Empty places are a plain marker: an icon here
                                        reads as a button and crowds the pitch. */}
                                    <Avatar
                                        size={tokenSize}
                                        src={filled ? toAbsolutePlayerPhotoUrl(slot.photoUrl) : undefined}
                                        style={{
                                            backgroundColor: filled ? club.navy : "rgba(14, 24, 48, 0.35)",
                                            color: club.goldSoft,
                                            border: `2px ${filled ? "solid" : "dashed"} ${
                                                highlight ? "#ffffff" : club.gold
                                            }`,
                                            opacity: filled || highlight ? 1 : 0.75,
                                            fontWeight: 700,
                                            boxShadow: highlight
                                                ? "0 0 0 3px rgba(255,255,255,0.35)"
                                                : "0 3px 10px rgba(0,0,0,0.45)",
                                        }}
                                    >
                                        {filled ? slot.playerName?.charAt(0)?.toUpperCase() : ""}
                                    </Avatar>
                                    <div
                                        style={{
                                            marginTop: 3,
                                            padding: "1px 5px",
                                            borderRadius: 6,
                                            background: "rgba(14, 24, 48, 0.82)",
                                            border: `1px solid ${club.panelBorder}`,
                                            maxWidth: "100%",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: isMobile ? 9 : 10,
                                                fontWeight: 700,
                                                color: club.textPrimary,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {label}
                                        </div>
                                        {/* Only worth a second line once someone is in the slot. */}
                                        {filled && (
                                            <div
                                                style={{
                                                    ...scoreNum,
                                                    fontSize: isMobile ? 8 : 9,
                                                    color: club.goldSoft,
                                                }}
                                            >
                                                {slot.jerseyNumber != null
                                                    ? `#${slot.jerseyNumber}`
                                                    : slot.slotLabel || slot.positionGroup}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Tooltip>
                        );
                    })}
            </div>
        </PitchCanvas>
    );
};

export default FormationPitch;
