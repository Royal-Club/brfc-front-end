import React, { useMemo, useState } from "react";
import {
    Avatar,
    Card,
    Empty,
    Popover,
    Segmented,
    Select,
    Spin,
    Table,
    Tabs,
    Tag,
    Typography,
    theme,
} from "antd";
import { CrownOutlined, TrophyOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import useIsMobile from "../../hooks/useIsMobile";
import usePlayerPhotos from "../../hooks/usePlayerPhotos";
import { useGetPlayerStatisticsQuery } from "../../state/features/statistics/statisticsSlice";
import type { IPlayerStatisticsData } from "../../state/features/statistics/statisticsTypes";
import {
    POSITION_LABEL,
    buildClubRecords,
    perMatch,
    positionLabel,
    type ClubRecord,
} from "../../utils/playerStatsUtils";
import { club, kicker, scoreNum } from "../../theme/clubTheme";
import BestXiPitch from "../Tournaments/Statistics/BestXiPitch";

const { Title, Text } = Typography;

type PodiumMetric = "Goals" | "Assists" | "G+A" | "Appearances";

const PODIUM_VALUE: Record<PodiumMetric, (p: IPlayerStatisticsData) => number> = {
    Goals: (p) => p.statistics.goalsScored,
    Assists: (p) => p.statistics.assists,
    "G+A": (p) => p.statistics.goalsAndAssists,
    Appearances: (p) => p.statistics.matchesPlayed,
};

const MEDAL = ["#D4AF37", "#B8C0C8", "#B87333"];

/**
 * All-time club records built from the aggregated player statistics endpoint.
 * Calling `/player-statistics` without a tournament id already returns every
 * player's career totals, so this view is a read of data the club has been
 * collecting all along.
 */
const HallOfFame: React.FC = () => {
    const isMobile = useIsMobile(768);
    const navigate = useNavigate();
    const photoById = usePlayerPhotos();
    const [position, setPosition] = useState<string | undefined>(undefined);
    const [podiumMetric, setPodiumMetric] = useState<PodiumMetric>("Goals");

    const {
        token: { colorBorderSecondary, colorFillTertiary, colorTextSecondary },
    } = theme.useToken();

    const { data, isLoading } = useGetPlayerStatisticsQuery({
        position,
        limit: 500,
    });

    const rows = useMemo(() => data?.content || [], [data]);
    const records = useMemo(() => buildClubRecords(rows), [rows]);

    const podium = useMemo(() => {
        const value = PODIUM_VALUE[podiumMetric];
        return [...rows]
            .filter((p) => value(p) > 0)
            .sort((a, b) => value(b) - value(a))
            .slice(0, 3);
    }, [rows, podiumMetric]);

    const totals = useMemo(
        () =>
            rows.reduce(
                (acc, p) => ({
                    players: acc.players + 1,
                    goals: acc.goals + p.statistics.goalsScored,
                    assists: acc.assists + p.statistics.assists,
                    appearances: acc.appearances + p.statistics.matchesPlayed,
                }),
                { players: 0, goals: 0, assists: 0, appearances: 0 }
            ),
        [rows]
    );

    const openPlayer = (playerId?: number) => {
        if (playerId) navigate(`/players/${playerId}`);
    };

    const renderRecordCard = (record: ClubRecord) => {
        const holder = record.holder;
        const chasers = record.chasers;

        const card = (
            <div
                style={{
                    background: club.panel,
                    border: `1px solid ${club.panelBorder}`,
                    borderRadius: 12,
                    padding: 14,
                    height: "100%",
                    cursor: holder ? "pointer" : "default",
                }}
                onClick={() => openPlayer(holder?.playerId)}
            >
                <div
                    style={{
                        ...kicker,
                        color: club.goldSoft,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                    }}
                >
                    <TrophyOutlined />
                    {record.title}
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginTop: 12,
                    }}
                >
                    <Avatar
                        size={44}
                        src={holder ? photoById[holder.playerId] : undefined}
                        style={{
                            flexShrink: 0,
                            backgroundColor: club.navySoft,
                            color: club.goldSoft,
                            border: `2px solid ${club.gold}`,
                            fontWeight: 700,
                        }}
                    >
                        {holder?.playerName?.charAt(0)?.toUpperCase() || "?"}
                    </Avatar>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                            style={{
                                color: club.textPrimary,
                                fontWeight: 700,
                                fontSize: 14,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {holder?.playerName || "No record yet"}
                        </div>
                        <div style={{ color: club.textMuted, fontSize: 12 }}>
                            {holder ? positionLabel(holder.position) : "—"}
                        </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div
                            style={{
                                ...scoreNum,
                                fontSize: 26,
                                fontWeight: 800,
                                lineHeight: 1,
                                color: club.gold,
                            }}
                        >
                            {record.display}
                        </div>
                    </div>
                </div>

                <div style={{ color: club.textMuted, fontSize: 11, marginTop: 8 }}>
                    {record.unit}
                </div>
            </div>
        );

        if (chasers.length === 0) return card;

        return (
            <Popover
                placement="bottom"
                title={`Chasing — ${record.title}`}
                content={
                    <div style={{ minWidth: 180 }}>
                        {chasers.map((chaser, index) => (
                            <div
                                key={chaser.player.playerId}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 16,
                                    padding: "3px 0",
                                    fontSize: 13,
                                }}
                            >
                                <span>
                                    {index + 2}. {chaser.player.playerName}
                                </span>
                                <span style={{ ...scoreNum, fontWeight: 600 }}>
                                    {chaser.display}
                                </span>
                            </div>
                        ))}
                    </div>
                }
            >
                {card}
            </Popover>
        );
    };

    const leaderboardColumns = [
        {
            title: "#",
            key: "rank",
            width: 60,
            render: (_: unknown, __: IPlayerStatisticsData, index: number) => (
                <span style={{ ...scoreNum, color: club.goldSoft, fontWeight: 700 }}>
                    {index + 1}
                </span>
            ),
        },
        {
            title: "Player",
            key: "player",
            render: (_: unknown, row: IPlayerStatisticsData) => (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar size={30} src={photoById[row.playerId]}>
                        {row.playerName?.charAt(0)?.toUpperCase() || "?"}
                    </Avatar>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600 }}>{row.playerName}</div>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            {positionLabel(row.position)}
                        </Text>
                    </div>
                </div>
            ),
        },
        {
            title: "Apps",
            key: "matches",
            width: 80,
            sorter: (a: IPlayerStatisticsData, b: IPlayerStatisticsData) =>
                a.statistics.matchesPlayed - b.statistics.matchesPlayed,
            render: (_: unknown, row: IPlayerStatisticsData) => row.statistics.matchesPlayed,
        },
        {
            title: "Goals",
            key: "goals",
            width: 80,
            defaultSortOrder: "descend" as const,
            sorter: (a: IPlayerStatisticsData, b: IPlayerStatisticsData) =>
                a.statistics.goalsScored - b.statistics.goalsScored,
            render: (_: unknown, row: IPlayerStatisticsData) => row.statistics.goalsScored,
        },
        {
            title: "Assists",
            key: "assists",
            width: 90,
            sorter: (a: IPlayerStatisticsData, b: IPlayerStatisticsData) =>
                a.statistics.assists - b.statistics.assists,
            render: (_: unknown, row: IPlayerStatisticsData) => row.statistics.assists,
        },
        {
            title: "G+A",
            key: "ga",
            width: 80,
            sorter: (a: IPlayerStatisticsData, b: IPlayerStatisticsData) =>
                a.statistics.goalsAndAssists - b.statistics.goalsAndAssists,
            render: (_: unknown, row: IPlayerStatisticsData) => (
                <span style={{ fontWeight: 700, color: club.gold }}>
                    {row.statistics.goalsAndAssists}
                </span>
            ),
        },
        {
            title: "G/Match",
            key: "gpm",
            width: 100,
            sorter: (a: IPlayerStatisticsData, b: IPlayerStatisticsData) =>
                perMatch(a.statistics.goalsScored, a.statistics.matchesPlayed) -
                perMatch(b.statistics.goalsScored, b.statistics.matchesPlayed),
            render: (_: unknown, row: IPlayerStatisticsData) =>
                perMatch(row.statistics.goalsScored, row.statistics.matchesPlayed).toFixed(2),
        },
        {
            title: "Cards",
            key: "cards",
            width: 110,
            render: (_: unknown, row: IPlayerStatisticsData) => (
                <span>
                    <Tag color="warning" style={{ marginRight: 4 }}>
                        {row.statistics.yellowCards}
                    </Tag>
                    <Tag color="error">{row.statistics.redCards}</Tag>
                </span>
            ),
        },
    ];

    const summaryTile = (label: string, value: number) => (
        <div
            style={{
                flex: "1 1 120px",
                background: colorFillTertiary,
                border: `1px solid ${colorBorderSecondary}`,
                borderRadius: 10,
                padding: "10px 14px",
            }}
        >
            <div style={{ ...scoreNum, fontSize: 22, fontWeight: 800 }}>{value}</div>
            <div
                style={{
                    ...kicker,
                    fontSize: 10,
                    color: colorTextSecondary,
                    marginTop: 2,
                }}
            >
                {label}
            </div>
        </div>
    );

    return (
        <Card style={{ margin: 16 }}>
            <div style={{ marginBottom: 16 }}>
                <Title level={3} style={{ margin: 0, lineHeight: 1.1 }}>
                    <CrownOutlined style={{ color: club.gold, marginRight: 10 }} />
                    Hall of Fame
                </Title>
                <Text type="secondary">
                    All-time club records across every tournament on record
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

            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    alignItems: "center",
                    marginBottom: 18,
                }}
            >
                <Select
                    style={{ width: isMobile ? "100%" : 220 }}
                    placeholder="All positions"
                    value={position}
                    onChange={setPosition}
                    allowClear
                    options={Object.entries(POSITION_LABEL).map(([value, label]) => ({
                        value,
                        label,
                    }))}
                />
                {summaryTile("Players", totals.players)}
                {summaryTile("Goals", totals.goals)}
                {summaryTile("Assists", totals.assists)}
                {summaryTile("Appearances", totals.appearances)}
            </div>

            {isLoading ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <Spin />
                </div>
            ) : rows.length === 0 ? (
                <Empty description="No player statistics recorded yet" />
            ) : (
                <Tabs
                    defaultActiveKey="records"
                    items={[
                        {
                            key: "records",
                            label: "Records",
                            children: (
                                <div>
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: isMobile
                                                ? "1fr"
                                                : "repeat(auto-fill, minmax(280px, 1fr))",
                                            gap: 12,
                                        }}
                                    >
                                        {records.map((record) => (
                                            <div key={record.key}>{renderRecordCard(record)}</div>
                                        ))}
                                    </div>

                                    {/* Podium */}
                                    <div style={{ marginTop: 28 }}>
                                        <div
                                            style={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: 12,
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                marginBottom: 16,
                                            }}
                                        >
                                            <Title level={5} style={{ margin: 0 }}>
                                                Career Podium
                                            </Title>
                                            <Segmented
                                                size="small"
                                                value={podiumMetric}
                                                onChange={(value) =>
                                                    setPodiumMetric(value as PodiumMetric)
                                                }
                                                options={Object.keys(PODIUM_VALUE)}
                                            />
                                        </div>

                                        {podium.length === 0 ? (
                                            <Empty description="Nothing recorded for this metric" />
                                        ) : (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    gap: 12,
                                                }}
                                            >
                                                {podium.map((player, index) => (
                                                    <div
                                                        key={player.playerId}
                                                        onClick={() => openPlayer(player.playerId)}
                                                        style={{
                                                            flex: "1 1 220px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 12,
                                                            padding: 14,
                                                            borderRadius: 12,
                                                            cursor: "pointer",
                                                            background: colorFillTertiary,
                                                            border: `1px solid ${colorBorderSecondary}`,
                                                            borderTop: `3px solid ${MEDAL[index]}`,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                ...scoreNum,
                                                                fontSize: 24,
                                                                fontWeight: 800,
                                                                color: MEDAL[index],
                                                                width: 30,
                                                            }}
                                                        >
                                                            {index + 1}
                                                        </div>
                                                        <Avatar
                                                            size={48}
                                                            src={photoById[player.playerId]}
                                                            style={{
                                                                border: `2px solid ${MEDAL[index]}`,
                                                            }}
                                                        >
                                                            {player.playerName?.charAt(0)?.toUpperCase()}
                                                        </Avatar>
                                                        <div style={{ minWidth: 0, flex: 1 }}>
                                                            <div
                                                                style={{
                                                                    fontWeight: 700,
                                                                    whiteSpace: "nowrap",
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis",
                                                                }}
                                                            >
                                                                {player.playerName}
                                                            </div>
                                                            <Text
                                                                type="secondary"
                                                                style={{ fontSize: 12 }}
                                                            >
                                                                {positionLabel(player.position)}
                                                            </Text>
                                                        </div>
                                                        <div
                                                            style={{
                                                                ...scoreNum,
                                                                fontSize: 26,
                                                                fontWeight: 800,
                                                            }}
                                                        >
                                                            {PODIUM_VALUE[podiumMetric](player)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ),
                        },
                        {
                            key: "leaderboard",
                            label: "Career Leaderboard",
                            children: (
                                <Table
                                    rowKey="playerId"
                                    dataSource={rows}
                                    columns={leaderboardColumns}
                                    size="small"
                                    scroll={{ x: 720 }}
                                    pagination={{ pageSize: 20, showSizeChanger: true }}
                                    onRow={(row) => ({
                                        onClick: () => openPlayer(row.playerId),
                                        style: { cursor: "pointer" },
                                    })}
                                />
                            ),
                        },
                        {
                            key: "xi",
                            label: "All-Time XI",
                            children: <BestXiPitch rows={rows} minMatches={3} />,
                        },
                    ]}
                />
            )}
        </Card>
    );
};

export default HallOfFame;
