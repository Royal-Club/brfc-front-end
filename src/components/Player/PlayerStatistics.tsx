import { Table, Select, Button, Space, Typography, Card, Avatar, theme, Pagination, Spin, Empty } from "antd";
import { useMemo, useState } from "react";
import useIsMobile from "../../hooks/useIsMobile";
import { useGetPlayerStatisticsQuery } from "../../state/features/statistics/statisticsSlice";
import { useGetTournamentSessionsQuery, useGetTournamentsByYearQuery } from "../../state/features/tournaments/tournamentsSlice";
import { useGetPlayersQuery } from "../../state/features/player/playerSlice";
import type { ColumnsType } from "antd/es/table";
import { IPlayerStatisticsData } from "../../state/features/statistics/statisticsTypes";
import { API_URL } from "../../settings";
import { club, scoreNum } from "../../theme/clubTheme";

const { Option } = Select;
const { Title, Text } = Typography;

const PlayerStatistics: React.FC = () => {
    const [selectedSeason, setSelectedSeason] = useState<string | undefined>(undefined);
    const [selectedTournament, setSelectedTournament] = useState<number | undefined>(undefined);
    const [position, setPosition] = useState<string | undefined>(undefined);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const isMobile = useIsMobile(576);

    const {
        token: {
            colorText,
            colorTextSecondary,
            colorBorderSecondary,
            colorFillTertiary,
            colorSuccess,
            colorInfo,
            colorWarning,
            colorError,
        },
    } = theme.useToken();

    // Fetch tournament sessions (years)
    const { data: sessionsData, isLoading: sessionsLoading } = useGetTournamentSessionsQuery();

    // Fetch tournaments for selected year
    const { data: tournamentsData, isLoading: tournamentsLoading } = useGetTournamentsByYearQuery(
        { year: selectedSeason || "" },
        { skip: !selectedSeason }
    );

    const { data, isLoading, refetch } = useGetPlayerStatisticsQuery({
        tournamentId: selectedTournament,
        position,
        limit: 100,
    });

    // Players list carries the photo; the stats endpoint does not — join by id.
    const { data: playersData } = useGetPlayersQuery();
    const photoById = useMemo(() => {
        const map: Record<number, string> = {};
        playersData?.content?.forEach((p) => {
            if (p.photoUrl) {
                map[p.id] = p.photoUrl.startsWith("http")
                    ? p.photoUrl
                    : `${API_URL}${p.photoUrl}`;
            }
        });
        return map;
    }, [playersData]);

    // One consistent style for every stat: a plain bold number, dimmed when
    // zero so real contributions stand out. Optional accent color per column.
    const statCell = (value: number, color?: string) =>
        value === 0 ? (
            <span style={{ color: colorTextSecondary, ...scoreNum }}>0</span>
        ) : (
            <span style={{ color: color || colorText, fontWeight: 700, fontSize: 15, ...scoreNum }}>
                {value}
            </span>
        );

    // Compact stat tile used by the mobile card view — label above a bold,
    // color-accented number (dimmed at zero, matching the desktop cells).
    const statChip = (label: string, value: number, color?: string) => (
        <div
            style={{
                textAlign: "center",
                padding: "8px 4px",
                borderRadius: 8,
                background: colorFillTertiary,
                border: `1px solid ${colorBorderSecondary}`,
            }}
        >
            <div
                style={{
                    fontSize: 17,
                    fontWeight: 700,
                    lineHeight: 1.1,
                    color: value === 0 ? colorTextSecondary : color || colorText,
                    ...scoreNum,
                }}
            >
                {value}
            </div>
            <div
                style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                    color: colorTextSecondary,
                    marginTop: 2,
                }}
            >
                {label}
            </div>
        </div>
    );

    // Mobile-only leaderboard: one stacked card per player so every stat is
    // visible without the horizontal table scroll.
    const renderMobileCards = () => {
        const rows = data?.content || [];
        if (isLoading) {
            return (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <Spin />
                </div>
            );
        }
        if (rows.length === 0) {
            return <Empty description="No player statistics found" />;
        }
        const start = (currentPage - 1) * pageSize;
        const paged = rows.slice(start, start + pageSize);
        return (
            <>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {paged.map((record, idx) => {
                        const initial = record.playerName?.charAt(0)?.toUpperCase() || "?";
                        const s = record.statistics;
                        return (
                            <div
                                key={record.playerId}
                                style={{
                                    border: `1px solid ${colorBorderSecondary}`,
                                    borderRadius: 12,
                                    padding: 12,
                                    background: colorFillTertiary,
                                    borderLeft: `3px solid ${club.gold}`,
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                                    <div
                                        style={{
                                            ...scoreNum,
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: club.goldSoft,
                                            minWidth: 22,
                                        }}
                                    >
                                        #{start + idx + 1}
                                    </div>
                                    <Avatar
                                        src={photoById[record.playerId]}
                                        size={44}
                                        style={{
                                            flexShrink: 0,
                                            backgroundColor: club.navySoft,
                                            color: club.goldSoft,
                                            border: `2px solid ${club.gold}`,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {initial}
                                    </Avatar>
                                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                                        <Text strong style={{ fontSize: 14 }} ellipsis>
                                            {record.playerName}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {record.position || "—"}
                                        </Text>
                                    </div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                                    {statChip("Matches", s.matchesPlayed)}
                                    {statChip("Goals", s.goalsScored, colorSuccess)}
                                    {statChip("Assists", s.assists, colorInfo)}
                                    {statChip("G+A", s.goalsAndAssists, club.gold)}
                                    {statChip("Yellow", s.yellowCards, colorWarning)}
                                    {statChip("Red", s.redCards, colorError)}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={rows.length}
                        size="small"
                        showSizeChanger
                        onChange={(page, newPageSize) => {
                            setCurrentPage(page);
                            if (newPageSize !== pageSize) setPageSize(newPageSize);
                        }}
                    />
                </div>
            </>
        );
    };

    const columns: ColumnsType<IPlayerStatisticsData> = [
        {
            title: "Player",
            key: "player",
            width: 260,
            fixed: "left",
            sorter: (a, b) => a.playerName.localeCompare(b.playerName),
            render: (record: IPlayerStatisticsData) => {
                const initial = record.playerName?.charAt(0)?.toUpperCase() || "?";
                return (
                    <Space size={12}>
                        <Avatar
                            src={photoById[record.playerId]}
                            size={44}
                            style={{
                                flexShrink: 0,
                                backgroundColor: club.navySoft,
                                color: club.goldSoft,
                                border: `2px solid ${club.gold}`,
                                fontWeight: 700,
                            }}
                        >
                            {initial}
                        </Avatar>
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                            <Text strong style={{ fontSize: 14 }}>
                                {record.playerName}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {record.position || "—"}
                            </Text>
                        </div>
                    </Space>
                );
            },
        },
        {
            title: "Matches",
            key: "matchesPlayed",
            width: 100,
            align: "center",
            render: (record: IPlayerStatisticsData) => statCell(record.statistics.matchesPlayed),
            sorter: (a, b) => a.statistics.matchesPlayed - b.statistics.matchesPlayed,
        },
        {
            title: "Goals",
            key: "goalsScored",
            width: 100,
            align: "center",
            render: (record: IPlayerStatisticsData) => statCell(record.statistics.goalsScored, colorSuccess),
            sorter: (a, b) => a.statistics.goalsScored - b.statistics.goalsScored,
        },
        {
            title: "Assists",
            key: "assists",
            width: 100,
            align: "center",
            render: (record: IPlayerStatisticsData) => statCell(record.statistics.assists, colorInfo),
            sorter: (a, b) => a.statistics.assists - b.statistics.assists,
        },
        {
            title: "G+A",
            key: "goalsAndAssists",
            width: 100,
            align: "center",
            render: (record: IPlayerStatisticsData) => statCell(record.statistics.goalsAndAssists, club.gold),
            sorter: (a, b) => a.statistics.goalsAndAssists - b.statistics.goalsAndAssists,
        },
        {
            title: "Yellow",
            key: "yellowCards",
            width: 90,
            align: "center",
            render: (record: IPlayerStatisticsData) => statCell(record.statistics.yellowCards, colorWarning),
            sorter: (a, b) => a.statistics.yellowCards - b.statistics.yellowCards,
        },
        {
            title: "Red",
            key: "redCards",
            width: 90,
            align: "center",
            render: (record: IPlayerStatisticsData) => statCell(record.statistics.redCards, colorError),
            sorter: (a, b) => a.statistics.redCards - b.statistics.redCards,
        },
    ];

    const handleReset = () => {
        setSelectedSeason(undefined);
        setSelectedTournament(undefined);
        setPosition(undefined);
        setCurrentPage(1);
        refetch();
    };

    const handleSeasonChange = (value: string) => {
        setSelectedSeason(value);
        setSelectedTournament(undefined);
    };

    return (
        <Card style={{ margin: 16 }}>
            <div style={{ marginBottom: 16 }}>
                <Title level={3} style={{ margin: 0, lineHeight: 1.1 }}>
                    Player Statistics
                </Title>
                <Text type="secondary">Goals, assists and disciplinary records across tournaments</Text>
            </div>

            {/* Gold divider under the header */}
            <div
                style={{
                    height: 2,
                    borderRadius: 2,
                    marginBottom: 18,
                    background: `linear-gradient(90deg, ${club.gold} 0%, rgba(198,161,91,0) 60%)`,
                }}
            />

            {/* Filter bar */}
            <div
                style={{
                    background: colorFillTertiary,
                    border: `1px solid ${colorBorderSecondary}`,
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 20,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 10,
                        alignItems: "center",
                    }}
                >
                    <Select
                        style={{ width: isMobile ? "100%" : 150 }}
                        placeholder="Select Season"
                        value={selectedSeason}
                        onChange={handleSeasonChange}
                        loading={sessionsLoading}
                        allowClear
                    >
                        <Option value={undefined}>All</Option>
                        {sessionsData?.content?.map((season) => (
                            <Option key={season} value={season}>
                                {season}
                            </Option>
                        ))}
                    </Select>

                    <Select
                        style={{ width: isMobile ? "100%" : 200 }}
                        placeholder="Select Tournament"
                        value={selectedTournament}
                        onChange={setSelectedTournament}
                        loading={tournamentsLoading}
                        disabled={!selectedSeason}
                        allowClear
                    >
                        <Option value={undefined}>All</Option>
                        {tournamentsData?.content?.map((tournament) => (
                            <Option key={tournament.id} value={tournament.id}>
                                {tournament.name}
                            </Option>
                        ))}
                    </Select>

                    <Select
                        style={{ width: isMobile ? "100%" : 200 }}
                        placeholder="Filter by Position"
                        value={position}
                        onChange={setPosition}
                        allowClear
                    >
                        <Option value={undefined}>All</Option>
                        <Option value="UNASSIGNED">Unassigned</Option>
                        <Option value="GOALKEEPER">Goalkeeper</Option>
                        <Option value="RIGHT_BACK">Right Back</Option>
                        <Option value="LEFT_BACK">Left Back</Option>
                        <Option value="CENTER_BACK_1">Center Back 1</Option>
                        <Option value="CENTER_BACK_2">Center Back 2</Option>
                        <Option value="DEFENSIVE_MIDFIELD">Defensive Midfield</Option>
                        <Option value="RIGHT_WING_FORWARD">Right Wing/Forward</Option>
                        <Option value="CENTRAL_MIDFIELD">Central Midfield</Option>
                        <Option value="STRIKER">Striker</Option>
                        <Option value="ATTACKING_MIDFIELD">Attacking Midfield</Option>
                        <Option value="LEFT_WING_FORWARD">Left Wing/Forward</Option>
                    </Select>

                    <Button
                        onClick={handleReset}
                        style={{ width: isMobile ? "100%" : undefined }}
                    >
                        Reset Filters
                    </Button>
                </div>
            </div>

            {isMobile ? (
                renderMobileCards()
            ) : (
            <div className="player-stats-table">
                {/* Zebra rows for readability + remove AntD's active-sort column
                    tint so columns don't look randomly banded. */}
                <style>{`
                    /* Navy header with gold underline — matches the club matchday theme */
                    .player-stats-table .ant-table-thead > tr > th {
                        background: #14213D !important;
                        color: #F5F7FA !important;
                        font-weight: 700;
                        letter-spacing: 0.3px;
                        border-bottom: 2px solid #C6A15B !important;
                    }
                    .player-stats-table .ant-table-thead > tr > th::before {
                        display: none !important;
                    }
                    .player-stats-table .ant-table-thead > tr > th.ant-table-cell-fix-left,
                    .player-stats-table .ant-table-thead > tr > th.ant-table-cell-fix-right {
                        background: #14213D !important;
                    }
                    .player-stats-table .ant-table-thead th.ant-table-column-has-sorters:hover {
                        background: #1B2A4A !important;
                    }
                    .player-stats-table .ant-table-thead .ant-table-column-sorter {
                        color: rgba(245, 247, 250, 0.55);
                    }
                    .player-stats-table .ant-table-tbody > tr:nth-child(even) > td {
                        background: ${colorFillTertiary};
                    }
                    .player-stats-table .ant-table-tbody > tr.ant-table-row:hover > td {
                        background: rgba(198, 161, 91, 0.1) !important;
                    }
                    .player-stats-table td.ant-table-column-sort {
                        background: transparent !important;
                    }
                    .player-stats-table th.ant-table-column-sort {
                        background: #14213D !important;
                    }
                `}</style>
                <Table
                    columns={columns}
                    dataSource={data?.content || []}
                    loading={isLoading}
                    rowKey="playerId"
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} players`,
                        onChange: (page, newPageSize) => {
                            setCurrentPage(page);
                            if (newPageSize !== pageSize) {
                                setPageSize(newPageSize);
                            }
                        },
                    }}
                    scroll={{ x: 900 }}
                    size="middle"
                />
            </div>
            )}
        </Card>
    );
};

export default PlayerStatistics;
