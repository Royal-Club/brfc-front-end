import React, { useMemo, useState } from "react";
import { Avatar, Empty, Segmented, Spin, Tag, Tooltip, Typography } from "antd";
import useIsMobile from "../../../hooks/useIsMobile";
import usePlayerPhotos from "../../../hooks/usePlayerPhotos";
import type { IPlayerStatisticsData } from "../../../state/features/statistics/statisticsTypes";
import {
    FORMATIONS,
    GROUP_LABEL,
    pickBestXi,
    positionLabel,
} from "../../../utils/playerStatsUtils";
import { club, kicker, scoreNum } from "../../../theme/clubTheme";
import PitchCanvas from "../Formation/PitchCanvas";

const { Text } = Typography;

interface BestXiPitchProps {
    /** Aggregated player rows the XI is chosen from. */
    rows?: IPlayerStatisticsData[];
    loading?: boolean;
    /** Appearances required before a player can be selected. */
    minMatches?: number;
    /** Hides the bench strip when false. */
    showBench?: boolean;
}

/**
 * Renders the highest-rated XI from a set of aggregated player statistics onto
 * a pitch. Used for both "Team of the Tournament" and the all-time XI on the
 * Hall of Fame — the caller just supplies a different set of rows.
 */
const BestXiPitch: React.FC<BestXiPitchProps> = ({
    rows,
    loading = false,
    minMatches = 1,
    showBench = true,
}) => {
    const isMobile = useIsMobile(768);
    const photoById = usePlayerPhotos();
    const [formationName, setFormationName] = useState(FORMATIONS[0].name);

    const formation =
        FORMATIONS.find((f) => f.name === formationName) || FORMATIONS[0];

    const { picks, bench } = useMemo(
        () => pickBestXi(rows || [], formation, minMatches),
        [rows, formation, minMatches]
    );

    const selectedCount = picks.filter((pick) => pick.player).length;

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
                <Spin />
            </div>
        );
    }

    if (selectedCount === 0) {
        return (
            <Empty description="No player statistics available to build an XI yet" />
        );
    }

    const tokenSize = isMobile ? 38 : 52;

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
                <Text type="secondary" style={{ fontSize: 12 }}>
                    Picked on goals, assists and discipline per appearance, weighted by
                    position.
                </Text>
                <Segmented
                    size="small"
                    value={formationName}
                    onChange={(value) => setFormationName(String(value))}
                    options={FORMATIONS.map((f) => f.name)}
                />
            </div>

            {selectedCount < picks.length && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                    Only {selectedCount} of {picks.length} slots could be filled from the
                    available squad.
                </Text>
            )}

            {/* Pitch — vertical, own goal at the bottom. */}
            <PitchCanvas aspectRatio={isMobile ? "3 / 4" : "4 / 5"}>
                {picks.map((pick) => {
                    if (!pick.player) return null;
                    const s = pick.player.statistics;
                    return (
                        <Tooltip
                            key={pick.slot.id}
                            title={
                                <div style={{ fontSize: 12 }}>
                                    <div style={{ fontWeight: 700 }}>
                                        {pick.player.playerName}
                                    </div>
                                    <div>{positionLabel(pick.player.position)}</div>
                                    <div>
                                        {s.matchesPlayed} apps · {s.goalsScored} goals ·{" "}
                                        {s.assists} assists
                                    </div>
                                    <div>
                                        {s.yellowCards} yellow · {s.redCards} red
                                    </div>
                                    {pick.outOfPosition && (
                                        <div style={{ marginTop: 4, opacity: 0.8 }}>
                                            Filling in at {GROUP_LABEL[pick.slot.group]}
                                        </div>
                                    )}
                                </div>
                            }
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    left: `${pick.slot.x}%`,
                                    top: `${pick.slot.y}%`,
                                    transform: "translate(-50%, -50%)",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    width: isMobile ? 74 : 96,
                                    textAlign: "center",
                                }}
                            >
                                <Avatar
                                    size={tokenSize}
                                    src={photoById[pick.player.playerId]}
                                    style={{
                                        backgroundColor: club.navy,
                                        color: club.goldSoft,
                                        border: `2px solid ${
                                            pick.outOfPosition ? "#ffffff" : club.gold
                                        }`,
                                        fontWeight: 700,
                                        boxShadow: "0 3px 10px rgba(0,0,0,0.45)",
                                    }}
                                >
                                    {pick.player.playerName?.charAt(0)?.toUpperCase() || "?"}
                                </Avatar>
                                <div
                                    style={{
                                        marginTop: 4,
                                        padding: "1px 6px",
                                        borderRadius: 6,
                                        background: "rgba(14, 24, 48, 0.82)",
                                        border: `1px solid ${club.panelBorder}`,
                                        maxWidth: "100%",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: isMobile ? 9 : 11,
                                            fontWeight: 700,
                                            color: club.textPrimary,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {pick.player.playerName}
                                    </div>
                                    <div
                                        style={{
                                            ...scoreNum,
                                            fontSize: isMobile ? 9 : 10,
                                            color: club.goldSoft,
                                        }}
                                    >
                                        {s.goalsScored}G · {s.assists}A
                                    </div>
                                </div>
                            </div>
                        </Tooltip>
                    );
                })}
            </PitchCanvas>

            {showBench && bench.length > 0 && (
                <div style={{ marginTop: 18 }}>
                    <div
                        style={{
                            ...kicker,
                            color: club.goldSoft,
                            marginBottom: 8,
                        }}
                    >
                        Bench
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {bench.map((player) => (
                            <Tag
                                key={player.playerId}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "3px 8px",
                                    borderRadius: 20,
                                    margin: 0,
                                }}
                            >
                                <Avatar size={20} src={photoById[player.playerId]}>
                                    {player.playerName?.charAt(0)?.toUpperCase() || "?"}
                                </Avatar>
                                <span style={{ fontSize: 12 }}>{player.playerName}</span>
                                <span style={{ ...scoreNum, fontSize: 11, opacity: 0.7 }}>
                                    {player.statistics.goalsScored}G ·{" "}
                                    {player.statistics.assists}A
                                </span>
                            </Tag>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BestXiPitch;
