import React, { useMemo, useState } from "react";
import {
    Avatar,
    Card,
    Empty,
    Select,
    Spin,
    Tag,
    Typography,
    theme,
} from "antd";
import { SwapOutlined } from "@ant-design/icons";
import { Radar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    RadarController,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip as ChartTooltip,
    Legend,
} from "chart.js";
import useIsMobile from "../../hooks/useIsMobile";
import usePlayerPhotos from "../../hooks/usePlayerPhotos";
import {
    useGetPlayerMatchHistoryQuery,
    useGetPlayerStatisticsQuery,
} from "../../state/features/statistics/statisticsSlice";
import type {
    IPlayerMatchHistory,
    IPlayerStatisticsData,
} from "../../state/features/statistics/statisticsTypes";
import {
    headToHead,
    perMatch,
    positionLabel,
    summariseForm,
    type FormSummary,
} from "../../utils/playerStatsUtils";
import { club, kicker, scoreNum } from "../../theme/clubTheme";
import { showBdLocalTime } from "../../utils/utils";

ChartJS.register(
    RadarController,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    ChartTooltip,
    Legend
);

const { Title, Text } = Typography;

/** Up to three players can be compared at once. */
const MAX_PLAYERS = 3;
const SERIES_COLORS = ["#C6A15B", "#4C9AFF", "#F2545B"];

const RESULT_COLOR: Record<string, string> = {
    WIN: "#52c41a",
    DRAW: "#faad14",
    LOSS: "#ff4d4f",
};

interface RadarMetric {
    label: string;
    /** Raw value for a player; higher is always better. */
    value: (player: IPlayerStatisticsData) => number;
}

const RADAR_METRICS: RadarMetric[] = [
    { label: "Goals / match", value: (p) => perMatch(p.statistics.goalsScored, p.statistics.matchesPlayed) },
    { label: "Assists / match", value: (p) => perMatch(p.statistics.assists, p.statistics.matchesPlayed) },
    { label: "G+A / match", value: (p) => perMatch(p.statistics.goalsAndAssists, p.statistics.matchesPlayed) },
    { label: "Appearances", value: (p) => p.statistics.matchesPlayed },
    { label: "Total goals", value: (p) => p.statistics.goalsScored },
    {
        // Inverted so a clean record scores high like every other axis.
        label: "Discipline",
        value: (p) =>
            1 /
            (1 +
                perMatch(
                    p.statistics.yellowCards + p.statistics.redCards * 2,
                    p.statistics.matchesPlayed
                )),
    },
];

/**
 * Side-by-side player comparison. Career totals come from `/player-statistics`
 * and the form/streak numbers from each player's match history, both of which
 * the API already exposes.
 */
const PlayerComparison: React.FC = () => {
    const isMobile = useIsMobile(768);
    const photoById = usePlayerPhotos();
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const {
        token: { colorBorderSecondary, colorFillTertiary, colorText, colorTextSecondary },
    } = theme.useToken();

    const { data, isLoading } = useGetPlayerStatisticsQuery({ limit: 500 });
    const rows = useMemo(() => data?.content || [], [data]);

    // RTK Query hooks can't be called in a loop, so the three possible slots are
    // queried explicitly and skipped when unused.
    const history0 = useGetPlayerMatchHistoryQuery(
        { playerId: selectedIds[0] ?? 0 },
        { skip: !selectedIds[0] }
    );
    const history1 = useGetPlayerMatchHistoryQuery(
        { playerId: selectedIds[1] ?? 0 },
        { skip: !selectedIds[1] }
    );
    const history2 = useGetPlayerMatchHistoryQuery(
        { playerId: selectedIds[2] ?? 0 },
        { skip: !selectedIds[2] }
    );
    const historyQueries = [history0, history1, history2];

    const selected = useMemo(
        () =>
            selectedIds
                .map((id) => rows.find((row) => row.playerId === id))
                .filter((row): row is IPlayerStatisticsData => Boolean(row)),
        [selectedIds, rows]
    );

    const histories: IPlayerMatchHistory[][] = selectedIds.map(
        (_, index) => historyQueries[index]?.data?.content || []
    );
    const forms: FormSummary[] = histories.map((history) => summariseForm(history));
    const historyLoading = selectedIds.some(
        (_, index) => historyQueries[index]?.isFetching
    );

    // Radar axes are scaled against the best value in the whole club so the
    // shape means the same thing regardless of who is being compared.
    const clubMax = useMemo(() => {
        const max: number[] = RADAR_METRICS.map(() => 0);
        rows.forEach((player) => {
            RADAR_METRICS.forEach((metric, index) => {
                max[index] = Math.max(max[index], metric.value(player));
            });
        });
        return max;
    }, [rows]);

    const radarData = {
        labels: RADAR_METRICS.map((metric) => metric.label),
        datasets: selected.map((player, index) => ({
            label: player.playerName,
            data: RADAR_METRICS.map((metric, metricIndex) =>
                clubMax[metricIndex] > 0
                    ? Math.round((metric.value(player) / clubMax[metricIndex]) * 100)
                    : 0
            ),
            fill: true,
            backgroundColor: `${SERIES_COLORS[index]}33`,
            borderColor: SERIES_COLORS[index],
            pointBackgroundColor: SERIES_COLORS[index],
            borderWidth: 2,
        })),
    };

    const radarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                beginAtZero: true,
                max: 100,
                ticks: { display: false, stepSize: 25 },
                grid: { color: "rgba(128,128,128,0.25)" },
                angleLines: { color: "rgba(128,128,128,0.25)" },
                pointLabels: { color: colorTextSecondary, font: { size: 11 } },
            },
        },
        plugins: {
            legend: { labels: { color: colorText } },
            tooltip: {
                callbacks: {
                    // Values are percentages of the club best on that axis.
                    label: (context: any) =>
                        `${context.dataset.label}: ${context.parsed.r}% of club best`,
                },
            },
        },
    };

    /** One comparison row: label plus a bar per selected player. */
    const comparisonRow = (
        label: string,
        values: number[],
        format: (value: number) => string = (value) => String(value)
    ) => {
        const max = Math.max(...values, 0);
        const best = max > 0 ? values.indexOf(max) : -1;

        return (
            <div key={label} style={{ marginBottom: 14 }}>
                <div
                    style={{
                        ...kicker,
                        fontSize: 10,
                        color: colorTextSecondary,
                        marginBottom: 6,
                    }}
                >
                    {label}
                </div>
                {values.map((value, index) => (
                    <div
                        key={index}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 4,
                        }}
                    >
                        <div style={{ flex: 1, height: 8, borderRadius: 4, background: colorFillTertiary }}>
                            <div
                                style={{
                                    width: max > 0 ? `${(value / max) * 100}%` : "0%",
                                    height: "100%",
                                    borderRadius: 4,
                                    background: SERIES_COLORS[index],
                                    transition: "width 240ms ease",
                                }}
                            />
                        </div>
                        <div
                            style={{
                                ...scoreNum,
                                width: 62,
                                textAlign: "right",
                                fontWeight: index === best ? 800 : 500,
                                color: index === best ? SERIES_COLORS[index] : colorText,
                            }}
                        >
                            {format(value)}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const h2h =
        selected.length === 2
            ? headToHead(histories[0], histories[1])
            : undefined;

    return (
        <Card style={{ margin: 16 }}>
            <div style={{ marginBottom: 16 }}>
                <Title level={3} style={{ margin: 0, lineHeight: 1.1 }}>
                    <SwapOutlined style={{ color: club.gold, marginRight: 10 }} />
                    Compare Players
                </Title>
                <Text type="secondary">
                    Put up to {MAX_PLAYERS} players side by side on career output, form and
                    head-to-head record
                </Text>
            </div>

            <div
                style={{
                    height: 2,
                    borderRadius: 2,
                    marginBottom: 18,
                    background: `linear-gradient(90deg, ${club.gold} 0%, rgba(198,161,91,0) 60%)`,
                }}
            />

            <Select
                mode="multiple"
                style={{ width: "100%", marginBottom: 20 }}
                placeholder="Select players to compare"
                value={selectedIds}
                loading={isLoading}
                maxCount={MAX_PLAYERS}
                onChange={(values: number[]) => setSelectedIds(values.slice(0, MAX_PLAYERS))}
                optionFilterProp="label"
                options={rows.map((row) => ({
                    value: row.playerId,
                    label: `${row.playerName} — ${positionLabel(row.position)}`,
                }))}
            />

            {isLoading ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <Spin />
                </div>
            ) : selected.length === 0 ? (
                <Empty description="Pick at least two players to compare" />
            ) : (
                <>
                    {/* Player headers */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: isMobile
                                ? "1fr"
                                : `repeat(${selected.length}, minmax(0, 1fr))`,
                            gap: 12,
                            marginBottom: 24,
                        }}
                    >
                        {selected.map((player, index) => {
                            const form = forms[index];
                            return (
                                <div
                                    key={player.playerId}
                                    style={{
                                        background: club.panel,
                                        border: `1px solid ${club.panelBorder}`,
                                        borderTop: `3px solid ${SERIES_COLORS[index]}`,
                                        borderRadius: 12,
                                        padding: 14,
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <Avatar
                                            size={52}
                                            src={photoById[player.playerId]}
                                            style={{
                                                backgroundColor: club.navySoft,
                                                color: club.goldSoft,
                                                border: `2px solid ${SERIES_COLORS[index]}`,
                                                fontWeight: 700,
                                            }}
                                        >
                                            {player.playerName?.charAt(0)?.toUpperCase()}
                                        </Avatar>
                                        <div style={{ minWidth: 0 }}>
                                            <div
                                                style={{
                                                    color: club.textPrimary,
                                                    fontWeight: 700,
                                                    fontSize: 15,
                                                }}
                                            >
                                                {player.playerName}
                                            </div>
                                            <div style={{ color: club.textMuted, fontSize: 12 }}>
                                                {positionLabel(player.position)}
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 6,
                                            marginTop: 12,
                                            alignItems: "center",
                                        }}
                                    >
                                        <span
                                            style={{
                                                ...kicker,
                                                fontSize: 10,
                                                color: club.textMuted,
                                            }}
                                        >
                                            Form
                                        </span>
                                        {historyLoading && form.recent.length === 0 ? (
                                            <Spin size="small" />
                                        ) : form.recent.length === 0 ? (
                                            <span style={{ color: club.textMuted, fontSize: 12 }}>
                                                No matches
                                            </span>
                                        ) : (
                                            form.recent.map((result, resultIndex) => (
                                                <span
                                                    key={resultIndex}
                                                    title={result}
                                                    style={{
                                                        width: 20,
                                                        height: 20,
                                                        borderRadius: 4,
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontSize: 10,
                                                        fontWeight: 800,
                                                        color: "#0E1830",
                                                        background: RESULT_COLOR[result],
                                                    }}
                                                >
                                                    {result.charAt(0)}
                                                </span>
                                            ))
                                        )}
                                    </div>

                                    <div style={{ color: club.textMuted, fontSize: 11, marginTop: 8 }}>
                                        {form.wins}W · {form.draws}D · {form.losses}L
                                        {form.recent.length > 0 &&
                                            ` · ${form.winRate.toFixed(0)}% win rate`}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Radar */}
                    <div
                        style={{
                            border: `1px solid ${colorBorderSecondary}`,
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 24,
                        }}
                    >
                        <Title level={5} style={{ marginTop: 0 }}>
                            Profile
                        </Title>
                        <div style={{ height: isMobile ? 300 : 380 }}>
                            <Radar data={radarData} options={radarOptions} />
                        </div>
                    </div>

                    {/* Stat-by-stat */}
                    <div
                        style={{
                            border: `1px solid ${colorBorderSecondary}`,
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 24,
                        }}
                    >
                        <Title level={5} style={{ marginTop: 0 }}>
                            Career numbers
                        </Title>
                        {comparisonRow(
                            "Appearances",
                            selected.map((p) => p.statistics.matchesPlayed)
                        )}
                        {comparisonRow(
                            "Goals",
                            selected.map((p) => p.statistics.goalsScored)
                        )}
                        {comparisonRow(
                            "Assists",
                            selected.map((p) => p.statistics.assists)
                        )}
                        {comparisonRow(
                            "Goals + assists",
                            selected.map((p) => p.statistics.goalsAndAssists)
                        )}
                        {comparisonRow(
                            "Goals per match",
                            selected.map((p) =>
                                perMatch(p.statistics.goalsScored, p.statistics.matchesPlayed)
                            ),
                            (value) => value.toFixed(2)
                        )}
                        {comparisonRow(
                            "Win rate",
                            forms.map((form) => form.winRate),
                            (value) => `${value.toFixed(0)}%`
                        )}
                        {comparisonRow(
                            "Longest win streak",
                            forms.map((form) => form.longestWinStreak)
                        )}
                        {comparisonRow(
                            "Longest scoring run",
                            forms.map((form) => form.longestScoringStreak)
                        )}
                        {comparisonRow(
                            "Yellow cards",
                            selected.map((p) => p.statistics.yellowCards)
                        )}
                        {comparisonRow(
                            "Red cards",
                            selected.map((p) => p.statistics.redCards)
                        )}
                    </div>

                    {/* Head to head — only meaningful for a straight pair */}
                    {h2h && (
                        <div
                            style={{
                                border: `1px solid ${colorBorderSecondary}`,
                                borderRadius: 12,
                                padding: 16,
                            }}
                        >
                            <Title level={5} style={{ marginTop: 0 }}>
                                Head to head
                            </Title>
                            {h2h.played === 0 ? (
                                <Text type="secondary">
                                    These two have never lined up on opposite sides.
                                </Text>
                            ) : (
                                <>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {h2h.played} match{h2h.played === 1 ? "" : "es"} against each
                                        other
                                    </Text>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            marginTop: 12,
                                        }}
                                    >
                                        <div style={{ ...scoreNum, fontSize: 30, fontWeight: 800, color: SERIES_COLORS[0] }}>
                                            {h2h.leftWins}
                                        </div>
                                        <div style={{ flex: 1, display: "flex", height: 12, borderRadius: 6, overflow: "hidden" }}>
                                            <div style={{ flex: h2h.leftWins || 0.001, background: SERIES_COLORS[0] }} />
                                            <div style={{ flex: h2h.draws || 0.001, background: colorFillTertiary }} />
                                            <div style={{ flex: h2h.rightWins || 0.001, background: SERIES_COLORS[1] }} />
                                        </div>
                                        <div style={{ ...scoreNum, fontSize: 30, fontWeight: 800, color: SERIES_COLORS[1] }}>
                                            {h2h.rightWins}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "center", marginTop: 8 }}>
                                        <Tag>{h2h.draws} drawn</Tag>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Standout performances */}
                    {forms.some((form) => form.bestMatch) && (
                        <div style={{ marginTop: 24 }}>
                            <Title level={5}>Standout performance</Title>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: isMobile
                                        ? "1fr"
                                        : `repeat(${selected.length}, minmax(0, 1fr))`,
                                    gap: 12,
                                }}
                            >
                                {selected.map((player, index) => {
                                    const best = forms[index]?.bestMatch;
                                    return (
                                        <div
                                            key={player.playerId}
                                            style={{
                                                background: colorFillTertiary,
                                                border: `1px solid ${colorBorderSecondary}`,
                                                borderLeft: `3px solid ${SERIES_COLORS[index]}`,
                                                borderRadius: 10,
                                                padding: 12,
                                            }}
                                        >
                                            <div style={{ fontWeight: 700, marginBottom: 4 }}>
                                                {player.playerName}
                                            </div>
                                            {best ? (
                                                <>
                                                    <div style={{ ...scoreNum, fontSize: 13 }}>
                                                        {best.goalsScored} goal
                                                        {best.goalsScored === 1 ? "" : "s"} ·{" "}
                                                        {best.assists} assist
                                                        {best.assists === 1 ? "" : "s"}
                                                    </div>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {best.teamName || "—"} v{" "}
                                                        {best.opponentTeamName || "—"} ·{" "}
                                                        {best.teamScore}-{best.opponentScore}
                                                    </Text>
                                                    <div>
                                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                                            {showBdLocalTime(best.matchDate)}
                                                        </Text>
                                                    </div>
                                                </>
                                            ) : (
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    No goal or assist recorded yet
                                                </Text>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}
        </Card>
    );
};

export default PlayerComparison;
