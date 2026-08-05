import React, { useMemo, useState } from "react";
import {
    Avatar,
    Button,
    Card,
    Empty,
    Progress,
    Segmented,
    Select,
    Spin,
    Switch,
    Table,
    Tag,
    Tooltip,
    Typography,
    theme,
} from "antd";
import {
    CheckCircleOutlined,
    DownloadOutlined,
    FireOutlined,
    TeamOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import useIsMobile from "../../hooks/useIsMobile";
import usePlayerPhotos from "../../hooks/usePlayerPhotos";
import { useGetPlayerAttendanceQuery } from "../../state/features/attendance/attendanceSlice";
import type { IPlayerAttendance } from "../../state/features/attendance/attendanceSlice";
import { useGetTournamentSessionsQuery } from "../../state/features/tournaments/tournamentsSlice";
import { positionLabel } from "../../utils/playerStatsUtils";
import { club, kicker, scoreNum } from "../../theme/clubTheme";
import { exportToExcel, showBdLocalTime } from "../../utils/utils";

const { Title, Text } = Typography;

/** Consecutive missed tournaments before a player is flagged as drifting away. */
const AT_RISK_ABSENCES = 3;

type SortKey = "Attendance" | "Reliability" | "Played" | "Streak";

const SORTERS: Record<SortKey, (a: IPlayerAttendance, b: IPlayerAttendance) => number> = {
    Attendance: (a, b) => b.attendanceRate - a.attendanceRate,
    Reliability: (a, b) => b.reliabilityRate - a.reliabilityRate,
    Played: (a, b) => b.played - a.played,
    Streak: (a, b) => b.currentStreak - a.currentStreak,
};

const rateColor = (rate: number) => {
    if (rate >= 70) return "#52c41a";
    if (rate >= 40) return "#faad14";
    return "#ff4d4f";
};

/**
 * Club attendance and reliability. The club has always recorded who was asked
 * (tournament RSVPs) and who ended up on a team sheet — this turns that into a
 * turn-up record per player.
 */
const PlayerAttendance: React.FC = () => {
    const isMobile = useIsMobile(768);
    const navigate = useNavigate();
    const photoById = usePlayerPhotos();
    const [year, setYear] = useState<number | undefined>(undefined);
    const [activeOnly, setActiveOnly] = useState(true);
    const [sortKey, setSortKey] = useState<SortKey>("Attendance");

    const {
        token: { colorBorderSecondary, colorFillTertiary, colorTextSecondary },
    } = theme.useToken();

    const { data: sessionsData } = useGetTournamentSessionsQuery();
    const { data, isLoading, isFetching } = useGetPlayerAttendanceQuery({
        year,
        activeOnly,
    });

    const rows = useMemo(() => {
        const list = [...(data?.content || [])];
        return list.sort(SORTERS[sortKey]);
    }, [data, sortKey]);

    const summary = useMemo(() => {
        if (rows.length === 0) {
            return { average: 0, mostReliable: undefined as IPlayerAttendance | undefined, bestStreak: undefined as IPlayerAttendance | undefined, atRisk: [] as IPlayerAttendance[] };
        }
        const average =
            rows.reduce((total, row) => total + row.attendanceRate, 0) / rows.length;

        // "Most reliable" needs enough confirmations to mean something.
        const reliablePool = rows.filter((row) => row.confirmed >= 3);
        const mostReliable = [...(reliablePool.length ? reliablePool : rows)].sort(
            (a, b) => b.reliabilityRate - a.reliabilityRate
        )[0];

        const bestStreak = [...rows].sort((a, b) => b.currentStreak - a.currentStreak)[0];
        const atRisk = rows
            .filter((row) => row.currentAbsenceStreak >= AT_RISK_ABSENCES)
            .sort((a, b) => b.currentAbsenceStreak - a.currentAbsenceStreak);

        return { average, mostReliable, bestStreak, atRisk };
    }, [rows]);

    const handleExport = () => {
        exportToExcel(
            rows.map((row) => ({
                Player: row.playerName,
                Position: positionLabel(row.position),
                Tournaments: row.eligibleTournaments,
                Played: row.played,
                "Attendance %": row.attendanceRate,
                Confirmed: row.confirmed,
                Declined: row.declined,
                "No response": row.noResponse,
                "Confirmed, not played": row.confirmedButNotPlayed,
                "Reliability %": row.reliabilityRate,
                "Current streak": row.currentStreak,
                "Longest streak": row.longestStreak,
                "Last played": row.lastPlayedDate
                    ? showBdLocalTime(row.lastPlayedDate)
                    : "",
            })),
            `attendance-${year ?? "all-time"}`
        );
    };

    const summaryTile = (
        label: string,
        value: React.ReactNode,
        caption?: string,
        icon?: React.ReactNode,
        accent?: string
    ) => (
        <div
            style={{
                flex: "1 1 200px",
                background: club.panel,
                border: `1px solid ${club.panelBorder}`,
                borderLeft: `3px solid ${accent || club.gold}`,
                borderRadius: 12,
                padding: 14,
            }}
        >
            <div
                style={{
                    ...kicker,
                    fontSize: 10,
                    color: club.goldSoft,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                }}
            >
                {icon}
                {label}
            </div>
            <div
                style={{
                    ...scoreNum,
                    fontSize: 24,
                    fontWeight: 800,
                    color: club.textPrimary,
                    marginTop: 6,
                    lineHeight: 1.15,
                }}
            >
                {value}
            </div>
            {caption && (
                <div style={{ color: club.textMuted, fontSize: 11, marginTop: 2 }}>
                    {caption}
                </div>
            )}
        </div>
    );

    const playerCell = (row: IPlayerAttendance) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar size={32} src={photoById[row.playerId]}>
                {row.playerName?.charAt(0)?.toUpperCase() || "?"}
            </Avatar>
            <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{row.playerName}</div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                    {positionLabel(row.position)}
                </Text>
            </div>
        </div>
    );

    const columns = [
        {
            title: "#",
            key: "rank",
            width: 56,
            render: (_: unknown, __: IPlayerAttendance, index: number) => (
                <span style={{ ...scoreNum, color: club.goldSoft, fontWeight: 700 }}>
                    {index + 1}
                </span>
            ),
        },
        {
            title: "Player",
            key: "player",
            render: (_: unknown, row: IPlayerAttendance) => playerCell(row),
        },
        {
            title: "Attendance",
            key: "attendance",
            width: 190,
            sorter: (a: IPlayerAttendance, b: IPlayerAttendance) =>
                a.attendanceRate - b.attendanceRate,
            render: (_: unknown, row: IPlayerAttendance) => (
                <div>
                    <Progress
                        percent={Math.round(row.attendanceRate)}
                        size="small"
                        strokeColor={rateColor(row.attendanceRate)}
                    />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {row.played} of {row.eligibleTournaments} tournaments
                    </Text>
                </div>
            ),
        },
        {
            title: (
                <Tooltip title="How often an RSVP of 'yes' turned into a place on a team sheet">
                    <span>Reliability</span>
                </Tooltip>
            ),
            key: "reliability",
            width: 130,
            sorter: (a: IPlayerAttendance, b: IPlayerAttendance) =>
                a.reliabilityRate - b.reliabilityRate,
            render: (_: unknown, row: IPlayerAttendance) => (
                <div>
                    <span
                        style={{
                            ...scoreNum,
                            fontWeight: 700,
                            color: rateColor(row.reliabilityRate),
                        }}
                    >
                        {row.reliabilityRate.toFixed(0)}%
                    </span>
                    {row.confirmedButNotPlayed > 0 && (
                        <div>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                {row.confirmedButNotPlayed} unused yes
                            </Text>
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: (
                <Tooltip title="Confirmed / declined / never answered">
                    <span>RSVP</span>
                </Tooltip>
            ),
            key: "rsvp",
            width: 150,
            render: (_: unknown, row: IPlayerAttendance) => (
                <span>
                    <Tag color="success" style={{ marginRight: 4 }}>
                        {row.confirmed}
                    </Tag>
                    <Tag color="default" style={{ marginRight: 4 }}>
                        {row.declined}
                    </Tag>
                    <Tag color="warning">{row.noResponse}</Tag>
                </span>
            ),
        },
        {
            title: "Streak",
            key: "streak",
            width: 130,
            sorter: (a: IPlayerAttendance, b: IPlayerAttendance) =>
                a.currentStreak - b.currentStreak,
            render: (_: unknown, row: IPlayerAttendance) =>
                row.currentStreak > 0 ? (
                    <Tag color="green" icon={<FireOutlined />}>
                        {row.currentStreak} in a row
                    </Tag>
                ) : row.currentAbsenceStreak >= AT_RISK_ABSENCES ? (
                    <Tag color="red">{row.currentAbsenceStreak} missed</Tag>
                ) : (
                    <Text type="secondary">—</Text>
                ),
        },
        {
            title: "Last played",
            key: "lastPlayed",
            width: 170,
            render: (_: unknown, row: IPlayerAttendance) =>
                row.lastPlayedDate ? (
                    <Text style={{ fontSize: 12 }}>
                        {showBdLocalTime(row.lastPlayedDate)}
                    </Text>
                ) : (
                    <Text type="secondary">Never</Text>
                ),
        },
    ];

    const renderMobileCards = () => (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rows.map((row, index) => (
                <div
                    key={row.playerId}
                    onClick={() => navigate(`/players/${row.playerId}`)}
                    style={{
                        border: `1px solid ${colorBorderSecondary}`,
                        borderLeft: `3px solid ${rateColor(row.attendanceRate)}`,
                        borderRadius: 10,
                        padding: 12,
                        background: colorFillTertiary,
                        cursor: "pointer",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 10,
                        }}
                    >
                        <span style={{ ...scoreNum, color: club.goldSoft, fontWeight: 700 }}>
                            #{index + 1}
                        </span>
                        {playerCell(row)}
                    </div>
                    <Progress
                        percent={Math.round(row.attendanceRate)}
                        size="small"
                        strokeColor={rateColor(row.attendanceRate)}
                    />
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 11,
                            color: colorTextSecondary,
                            marginTop: 4,
                        }}
                    >
                        <span>
                            {row.played}/{row.eligibleTournaments} played
                        </span>
                        <span>{row.reliabilityRate.toFixed(0)}% reliable</span>
                        {row.currentStreak > 0 && <span>{row.currentStreak} in a row</span>}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <Card style={{ margin: 16 }}>
            <div style={{ marginBottom: 16 }}>
                <Title level={3} style={{ margin: 0, lineHeight: 1.1 }}>
                    <TeamOutlined style={{ color: club.gold, marginRight: 10 }} />
                    Attendance &amp; Reliability
                </Title>
                <Text type="secondary">
                    Who turns up, who answers the RSVP, and who has drifted away
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

            {/* Filters */}
            <div
                style={{
                    background: colorFillTertiary,
                    border: `1px solid ${colorBorderSecondary}`,
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 18,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                    alignItems: "center",
                }}
            >
                <Select
                    style={{ width: isMobile ? "100%" : 150 }}
                    placeholder="All time"
                    value={year}
                    onChange={setYear}
                    allowClear
                    options={(sessionsData?.content || []).map((season) => ({
                        value: Number(season),
                        label: season,
                    }))}
                />
                <Segmented
                    value={sortKey}
                    onChange={(value) => setSortKey(value as SortKey)}
                    options={Object.keys(SORTERS)}
                />
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Switch
                        size="small"
                        checked={activeOnly}
                        onChange={setActiveOnly}
                    />
                    <Text style={{ fontSize: 13 }}>Active players only</Text>
                </span>
                <Button
                    icon={<DownloadOutlined />}
                    onClick={handleExport}
                    disabled={rows.length === 0}
                    style={{ marginLeft: "auto" }}
                >
                    Export
                </Button>
            </div>

            {isLoading || isFetching ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <Spin />
                </div>
            ) : rows.length === 0 ? (
                <Empty description="No attendance data for this period" />
            ) : (
                <>
                    {/* Summary */}
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 12,
                            marginBottom: 20,
                        }}
                    >
                        {summaryTile(
                            "Club average",
                            `${summary.average.toFixed(0)}%`,
                            `across ${rows.length} players`,
                            <TeamOutlined />
                        )}
                        {summaryTile(
                            "Most reliable",
                            summary.mostReliable?.playerName || "—",
                            summary.mostReliable
                                ? `${summary.mostReliable.reliabilityRate.toFixed(0)}% of confirmations played`
                                : undefined,
                            <CheckCircleOutlined />,
                            "#52c41a"
                        )}
                        {summaryTile(
                            "Longest active run",
                            summary.bestStreak && summary.bestStreak.currentStreak > 0
                                ? `${summary.bestStreak.currentStreak}`
                                : "—",
                            summary.bestStreak && summary.bestStreak.currentStreak > 0
                                ? `${summary.bestStreak.playerName}, tournaments in a row`
                                : "nobody on a run",
                            <FireOutlined />,
                            "#faad14"
                        )}
                        {summaryTile(
                            "Drifting away",
                            `${summary.atRisk.length}`,
                            `missed ${AT_RISK_ABSENCES}+ in a row`,
                            <WarningOutlined />,
                            "#ff4d4f"
                        )}
                    </div>

                    {summary.atRisk.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                            <div
                                style={{
                                    ...kicker,
                                    fontSize: 10,
                                    color: colorTextSecondary,
                                    marginBottom: 8,
                                }}
                            >
                                Worth a nudge
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {summary.atRisk.slice(0, 12).map((row) => (
                                    <Tag
                                        key={row.playerId}
                                        color="red"
                                        style={{ cursor: "pointer", margin: 0 }}
                                        onClick={() => navigate(`/players/${row.playerId}`)}
                                    >
                                        {row.playerName} · {row.currentAbsenceStreak} missed
                                    </Tag>
                                ))}
                            </div>
                        </div>
                    )}

                    {isMobile ? (
                        renderMobileCards()
                    ) : (
                        <Table
                            rowKey="playerId"
                            dataSource={rows}
                            columns={columns}
                            size="small"
                            scroll={{ x: 900 }}
                            pagination={{ pageSize: 25, showSizeChanger: true }}
                            onRow={(row) => ({
                                onClick: () => navigate(`/players/${row.playerId}`),
                                style: { cursor: "pointer" },
                            })}
                        />
                    )}
                </>
            )}
        </Card>
    );
};

export default PlayerAttendance;
