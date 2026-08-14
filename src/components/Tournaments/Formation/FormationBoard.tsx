import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Avatar,
    Button,
    Empty,
    List,
    Modal,
    Segmented,
    Space,
    Tag,
    Typography,
    message,
} from "antd";
import { CrownOutlined, NotificationOutlined, UndoOutlined } from "@ant-design/icons";
import useIsMobile from "../../../hooks/useIsMobile";
import { club, kicker, scoreNum } from "../../../theme/clubTheme";
import { positionLabel } from "../../../utils/playerStatsUtils";
import { toAbsolutePlayerPhotoUrl } from "../../../utils/playerPhotoUtils";
import type {
    ITeamFormation,
    ITeamFormationPayload,
    ITeamFormationSlot,
    ITeamSquadPlayer,
} from "../../../state/features/tournaments/teamFormationSlice";
import {
    useTeamFormationPublishStatusQuery,
    usePublishTeamFormationMutation,
} from "../../../state/features/tournaments/teamFormationSlice";
import { normalizeErrorMessage } from "../../../utils/normalizeErrorMessage";
import { presetSlots } from "./formationPresets";
import FormationPitch from "./FormationPitch";

const { Text } = Typography;

interface FormationBoardProps {
    formation: ITeamFormation;
    saving?: boolean;
    onSave: (payload: ITeamFormationPayload) => void;
    /** Offered on match line-ups only — drops back to the team default. */
    onResetToDefault?: () => void;
    resetting?: boolean;
    title?: React.ReactNode;
}

/** How far, in pitch percent, a dropped player can land from a slot and still take it. */
const DROP_RADIUS = 22;

/**
 * The starting places, with any the sheet is missing filled in from the preset.
 *
 * A line-up saved before the server stopped deleting a place along with the
 * player who left the squad can be a position or two short of its shape. Slot
 * indices survive that, so the preset says which ones went; everything stored
 * is kept exactly as it is.
 */
const starterSlotsOf = (formation: ITeamFormation): ITeamFormationSlot[] => {
    const stored = formation.slots.filter((slot) => slot.isStarter);
    const layout = presetSlots(formation.teamSize, formation.presetName);
    const byIndex = new Map(stored.map((slot) => [slot.slotIndex, slot]));
    if (!layout.length || layout.every((preset) => byIndex.has(preset.slotIndex))) {
        return stored;
    }

    const inLayout = new Set(layout.map((preset) => preset.slotIndex));
    return [
        ...layout.map(
            (preset) =>
                byIndex.get(preset.slotIndex) ?? {
                    slotIndex: preset.slotIndex,
                    positionGroup: preset.positionGroup,
                    slotLabel: preset.slotLabel,
                    x: preset.x,
                    y: preset.y,
                    isStarter: true,
                    teamPlayerId: null,
                }
        ),
        // Kept rather than dropped: a captain may have places beyond the shape.
        ...stored.filter((slot) => !inLayout.has(slot.slotIndex)),
    ];
};

/** Copies a squad member's display fields onto a slot, or clears them. */
const withPlayer = (
    slot: ITeamFormationSlot,
    player?: ITeamSquadPlayer
): ITeamFormationSlot => ({
    ...slot,
    teamPlayerId: player?.id ?? null,
    playerId: player?.playerId ?? null,
    playerName: player?.playerName ?? null,
    jerseyNumber: player?.jerseyNumber ?? null,
    playingPosition: player?.playingPosition ?? null,
    isCaptain: player?.isCaptain ?? null,
    photoKey: player?.photoKey ?? null,
    photoUrl: player?.photoUrl ?? null,
});

/**
 * The line-up editor: preset picker, draggable pitch, and the bench. Read-only
 * for anyone who is not the team captain or a tournament admin — the server
 * decides that and says so via `formation.editable`.
 */
const FormationBoard: React.FC<FormationBoardProps> = ({
    formation,
    saving = false,
    onSave,
    onResetToDefault,
    resetting = false,
    title,
}) => {
    const isMobile = useIsMobile(768);
    const editable = formation.editable;

    const [starters, setStarters] = useState<ITeamFormationSlot[]>(() => starterSlotsOf(formation));
    const [presetName, setPresetName] = useState(formation.presetName);
    const [pickerSlotIndex, setPickerSlotIndex] = useState<number | null>(null);
    const [dirty, setDirty] = useState(false);

    // Re-seed whenever the server hands us a different sheet — switching match,
    // or a save coming back — but never while the captain has unsaved edits.
    const formationKey = `${formation.teamId}:${formation.matchId ?? "default"}:${formation.id ?? "new"}`;

    // Publishing applies to the team's default line-up. Match line-ups are a separate sheet and
    // have no announcement of their own yet, so the controls stay hidden there rather than
    // implying a match squad has been told something.
    const showPublishState = editable && formation.saved === true && formation.matchId == null;
    const { data: publishStatusResponse } = useTeamFormationPublishStatusQuery(
        { teamId: formation.teamId },
        { skip: !showPublishState }
    );
    const publishStatus = publishStatusResponse?.content;
    const pendingCount = publishStatus?.pendingPlayers ?? 0;
    const [publishFormation, { isLoading: publishing }] = usePublishTeamFormationMutation();

    const handlePublish = async () => {
        try {
            const result = await publishFormation({ teamId: formation.teamId }).unwrap();
            const notified = result?.content?.notifiedNow ?? 0;
            message.success(
                notified > 0
                    ? `Line-up published — ${notified} player${notified === 1 ? "" : "s"} notified.`
                    : "Everyone in this line-up has already been notified."
            );
        } catch (err) {
            message.error(normalizeErrorMessage(err, "Could not publish the line-up."));
        }
    };
    useEffect(() => {
        setStarters(starterSlotsOf(formation));
        setPresetName(formation.presetName);
        setDirty(false);
        setPickerSlotIndex(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formationKey]);

    const squadById = useMemo(() => {
        const map = new Map<number, ITeamSquadPlayer>();
        formation.squad?.forEach((player) => map.set(player.id, player));
        return map;
    }, [formation.squad]);

    const startingIds = useMemo(
        () => new Set(starters.map((slot) => slot.teamPlayerId).filter((id): id is number => id != null)),
        [starters]
    );

    /**
     * The bench is whoever is left over, ordered by the bench the server has
     * stored so a captain's arrangement survives, with newcomers appended.
     */
    const bench = useMemo(() => {
        const storedOrder = formation.slots
            .filter((slot) => !slot.isStarter && slot.teamPlayerId != null)
            .map((slot) => slot.teamPlayerId as number);

        const available = (formation.squad || []).filter((player) => !startingIds.has(player.id));
        const ranked = new Map(storedOrder.map((id, index) => [id, index]));
        return [...available].sort(
            (a, b) => (ranked.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (ranked.get(b.id) ?? Number.MAX_SAFE_INTEGER)
        );
    }, [formation.slots, formation.squad, startingIds]);

    const filledCount = startingIds.size;

    const handlePresetChange = useCallback(
        (value: string) => {
            const layout = presetSlots(formation.teamSize, value);
            if (!layout.length) return;

            // Keep whoever is already picked, in the order they were picked, so
            // switching shape does not throw the sheet away.
            const picked = starters.map((slot) => slot.teamPlayerId ?? null);
            setStarters(
                layout.map((preset, index) =>
                    withPlayer(
                        {
                            slotIndex: preset.slotIndex,
                            positionGroup: preset.positionGroup,
                            slotLabel: preset.slotLabel,
                            x: preset.x,
                            y: preset.y,
                            isStarter: true,
                        },
                        squadById.get(picked[index] ?? -1)
                    )
                )
            );
            setPresetName(value);
            setDirty(true);
        },
        [formation.teamSize, starters, squadById]
    );

    const handleMoveSlot = useCallback((slotIndex: number, x: number, y: number) => {
        setStarters((current) =>
            current.map((slot) => (slot.slotIndex === slotIndex ? { ...slot, x, y } : slot))
        );
        setDirty(true);
    }, []);

    const assignToSlot = useCallback(
        (slotIndex: number, player?: ITeamSquadPlayer) => {
            setStarters((current) => {
                // Picking someone already on the pitch swaps the two places
                // rather than cloning them into both.
                const previousSlot = player
                    ? current.find((slot) => slot.teamPlayerId === player.id)
                    : undefined;
                const target = current.find((slot) => slot.slotIndex === slotIndex);
                const displaced = target?.teamPlayerId
                    ? squadById.get(target.teamPlayerId)
                    : undefined;

                return current.map((slot) => {
                    if (slot.slotIndex === slotIndex) return withPlayer(slot, player);
                    if (previousSlot && slot.slotIndex === previousSlot.slotIndex) {
                        return withPlayer(slot, displaced);
                    }
                    return slot;
                });
            });
            setDirty(true);
        },
        [squadById]
    );

    const handleAssign = useCallback(
        (player?: ITeamSquadPlayer) => {
            if (pickerSlotIndex == null) return;
            assignToSlot(pickerSlotIndex, player);
            setPickerSlotIndex(null);
        },
        [assignToSlot, pickerSlotIndex]
    );

    /* -------------------------------------------------------------- */
    /* Dragging a substitute onto the pitch                            */
    /* -------------------------------------------------------------- */

    const pitchRef = useRef<HTMLDivElement | null>(null);
    // Read inside window listeners, which are registered once per drag and so
    // would otherwise close over a stale line-up.
    const startersRef = useRef(starters);
    startersRef.current = starters;

    const [benchDrag, setBenchDrag] = useState<{
        player: ITeamSquadPlayer;
        clientX: number;
        clientY: number;
        overSlotIndex: number | null;
    } | null>(null);

    /** The starting place nearest the pointer, or null if it is not over one. */
    const slotAtPointer = useCallback((clientX: number, clientY: number): number | null => {
        const box = pitchRef.current?.getBoundingClientRect();
        if (!box || !box.width || !box.height) return null;

        const x = ((clientX - box.left) / box.width) * 100;
        const y = ((clientY - box.top) / box.height) * 100;
        if (x < 0 || x > 100 || y < 0 || y > 100) return null;

        let nearest: number | null = null;
        let nearestDistance = Number.POSITIVE_INFINITY;
        startersRef.current.forEach((slot) => {
            const distance = Math.hypot(slot.x - x, slot.y - y);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearest = slot.slotIndex;
            }
        });
        return nearestDistance <= DROP_RADIUS ? nearest : null;
    }, []);

    const startBenchDrag = useCallback(
        (event: React.PointerEvent<HTMLDivElement>, player: ITeamSquadPlayer) => {
            if (!editable) return;
            event.preventDefault();
            setBenchDrag({
                player,
                clientX: event.clientX,
                clientY: event.clientY,
                overSlotIndex: null,
            });
        },
        [editable]
    );

    const draggingPlayerId = benchDrag?.player.id;
    useEffect(() => {
        if (draggingPlayerId == null) return undefined;

        const handleMove = (event: PointerEvent) => {
            event.preventDefault();
            setBenchDrag((current) =>
                current
                    ? {
                          ...current,
                          clientX: event.clientX,
                          clientY: event.clientY,
                          overSlotIndex: slotAtPointer(event.clientX, event.clientY),
                      }
                    : current
            );
        };

        const handleUp = (event: PointerEvent) => {
            const slotIndex = slotAtPointer(event.clientX, event.clientY);
            setBenchDrag((current) => {
                if (current && slotIndex != null) {
                    // The player already in that place drops to the bench, which
                    // is derived from whoever is not starting.
                    assignToSlot(slotIndex, current.player);
                }
                return null;
            });
        };

        // Non-passive so a touch drag does not scroll the page underneath.
        window.addEventListener("pointermove", handleMove, { passive: false });
        window.addEventListener("pointerup", handleUp);
        window.addEventListener("pointercancel", handleUp);
        return () => {
            window.removeEventListener("pointermove", handleMove);
            window.removeEventListener("pointerup", handleUp);
            window.removeEventListener("pointercancel", handleUp);
        };
    }, [assignToSlot, draggingPlayerId, slotAtPointer]);

    const handleSave = useCallback(() => {
        onSave({
            presetName,
            notes: formation.notes ?? null,
            slots: [
                ...starters.map((slot) => ({
                    teamPlayerId: slot.teamPlayerId ?? null,
                    positionGroup: slot.positionGroup,
                    slotLabel: slot.slotLabel ?? null,
                    x: slot.x,
                    y: slot.y,
                    isStarter: true,
                })),
                // The bench is stored too, so the sheet records who was available.
                ...bench.map((player) => ({
                    teamPlayerId: player.id,
                    positionGroup: "MID" as const,
                    slotLabel: "Bench",
                    x: 50,
                    y: 50,
                    isStarter: false,
                })),
            ],
        });
        setDirty(false);
    }, [bench, formation.notes, onSave, presetName, starters]);

    const pickerSlot = starters.find((slot) => slot.slotIndex === pickerSlotIndex);

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                }}
            >
                <div>
                    {title}
                    <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                        {formation.teamSize} a side · {filledCount} of {starters.length} places filled
                        {formation.saved ? "" : " · not saved yet"}
                    </Text>
                    {/* Saving is a draft and tells nobody, so the board has to say plainly whether
                        the squad has actually heard — otherwise a captain reasonably assumes it has. */}
                    {showPublishState && (
                        <div style={{ marginTop: 6 }}>
                            <Tag color={publishStatus?.published ? "green" : "default"}>
                                {publishStatus?.published ? "Published" : "Draft"}
                            </Tag>
                            {pendingCount > 0 ? (
                                <Text type="warning" style={{ fontSize: 12 }}>
                                    {pendingCount} player{pendingCount === 1 ? "" : "s"} not notified yet
                                </Text>
                            ) : (
                                publishStatus?.published && (
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        All {publishStatus.notifiedPlayers} players notified
                                    </Text>
                                )
                            )}
                        </div>
                    )}
                </div>
                {/* Scrolls rather than squeezing the header once a squad size
                    offers more shapes than fit across a phone. */}
                <div style={{ maxWidth: "100%", overflowX: "auto" }}>
                    <Segmented
                        size="small"
                        value={presetName}
                        disabled={!editable}
                        onChange={(value) => handlePresetChange(String(value))}
                        options={formation.availablePresets}
                    />
                </div>
            </div>

            {!editable && formation.lockedReason && (
                <Alert
                    type="info"
                    showIcon
                    message={formation.lockedReason}
                    style={{ marginBottom: 12 }}
                />
            )}

            <FormationPitch
                slots={starters}
                editable={editable}
                selectedSlotIndex={pickerSlotIndex}
                dropTargetSlotIndex={benchDrag?.overSlotIndex ?? null}
                onSelectSlot={setPickerSlotIndex}
                onMoveSlot={handleMoveSlot}
                pitchRef={pitchRef}
            />

            <div style={{ marginTop: 18 }}>
                <div style={{ ...kicker, color: club.goldSoft, marginBottom: 8 }}>
                    Bench ({bench.length})
                </div>
                {bench.length === 0 ? (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Everyone in the squad is in the starting line-up.
                    </Text>
                ) : (
                    <>
                        {editable && (
                            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
                                Drag a substitute onto a place on the pitch to bring them on.
                            </Text>
                        )}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {bench.map((player) => (
                                <div
                                    key={player.id}
                                    onPointerDown={(event) => startBenchDrag(event, player)}
                                    style={{
                                        cursor: editable ? "grab" : "default",
                                        touchAction: editable ? "none" : undefined,
                                        opacity: benchDrag?.player.id === player.id ? 0.4 : 1,
                                    }}
                                >
                                    <Tag
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                            padding: "3px 8px",
                                            borderRadius: 20,
                                            margin: 0,
                                        }}
                                    >
                                        <Avatar size={20} src={toAbsolutePlayerPhotoUrl(player.photoUrl)}>
                                            {player.playerName?.charAt(0)?.toUpperCase() || "?"}
                                        </Avatar>
                                        <span style={{ fontSize: 12 }}>{player.playerName}</span>
                                        {player.jerseyNumber != null && (
                                            <span style={{ ...scoreNum, fontSize: 11, opacity: 0.7 }}>
                                                #{player.jerseyNumber}
                                            </span>
                                        )}
                                    </Tag>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {editable && (
                <Space style={{ marginTop: 18 }} wrap>
                    <Button type="primary" loading={saving} disabled={!dirty} onClick={handleSave}>
                        Save line-up
                    </Button>
                    {showPublishState && (
                        <Button
                            icon={<NotificationOutlined />}
                            loading={publishing}
                            // Nothing to announce, or unsaved edits that would be announced wrongly.
                            disabled={pendingCount === 0 || dirty}
                            onClick={handlePublish}
                        >
                            {publishStatus?.published ? "Notify new players" : "Publish line-up"}
                        </Button>
                    )}
                    {onResetToDefault && formation.saved && (
                        <Button
                            icon={<UndoOutlined />}
                            loading={resetting}
                            onClick={onResetToDefault}
                        >
                            Use team default
                        </Button>
                    )}
                    {dirty && (
                        <Text type="warning" style={{ fontSize: 12 }}>
                            Unsaved changes
                        </Text>
                    )}
                </Space>
            )}

            {/* Follows the pointer during a bench drag. Fixed to the viewport so
                it is not clipped by the modal or the card it sits in. */}
            {benchDrag && (
                <div
                    style={{
                        position: "fixed",
                        left: benchDrag.clientX,
                        top: benchDrag.clientY,
                        transform: "translate(-50%, -50%)",
                        pointerEvents: "none",
                        zIndex: 2000,
                        textAlign: "center",
                    }}
                >
                    <Avatar
                        size={44}
                        src={toAbsolutePlayerPhotoUrl(benchDrag.player.photoUrl)}
                        style={{
                            backgroundColor: club.navy,
                            color: club.goldSoft,
                            border: `2px solid ${benchDrag.overSlotIndex != null ? "#ffffff" : club.gold}`,
                            fontWeight: 700,
                            boxShadow: "0 6px 18px rgba(0,0,0,0.55)",
                        }}
                    >
                        {benchDrag.player.playerName?.charAt(0)?.toUpperCase() || "?"}
                    </Avatar>
                </div>
            )}

            <Modal
                open={pickerSlotIndex != null}
                onCancel={() => setPickerSlotIndex(null)}
                footer={null}
                width={isMobile ? "92vw" : 480}
                title={`Pick a player for ${pickerSlot?.slotLabel || pickerSlot?.positionGroup || "this position"}`}
            >
                {(formation.squad || []).length === 0 ? (
                    <Empty description="No players have been added to this team yet" />
                ) : (
                    <>
                        <List
                            dataSource={formation.squad}
                            style={{ maxHeight: "50vh", overflowY: "auto" }}
                            renderItem={(player) => {
                                const alreadyOnPitch = startingIds.has(player.id);
                                const inThisSlot = pickerSlot?.teamPlayerId === player.id;
                                return (
                                    <List.Item
                                        onClick={() => handleAssign(player)}
                                        style={{
                                            cursor: "pointer",
                                            padding: "8px 4px",
                                            background: inThisSlot ? "rgba(198, 161, 91, 0.12)" : undefined,
                                        }}
                                    >
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar src={toAbsolutePlayerPhotoUrl(player.photoUrl)}>
                                                    {player.playerName?.charAt(0)?.toUpperCase() || "?"}
                                                </Avatar>
                                            }
                                            title={
                                                <Space size={6}>
                                                    <span>{player.playerName}</span>
                                                    {player.isCaptain && <CrownOutlined style={{ color: club.gold }} />}
                                                    {player.jerseyNumber != null && (
                                                        <Tag style={{ margin: 0 }}>#{player.jerseyNumber}</Tag>
                                                    )}
                                                </Space>
                                            }
                                            description={
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {positionLabel(player.playingPosition)}
                                                    {alreadyOnPitch && !inThisSlot && " · already on the pitch — picking swaps them"}
                                                </Text>
                                            }
                                        />
                                    </List.Item>
                                );
                            }}
                        />
                        {pickerSlot?.teamPlayerId != null && (
                            <Button block danger style={{ marginTop: 12 }} onClick={() => handleAssign(undefined)}>
                                Leave this position empty
                            </Button>
                        )}
                    </>
                )}
            </Modal>
        </div>
    );
};

export default FormationBoard;
