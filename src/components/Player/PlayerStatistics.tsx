import { Table, Select, Button, Space, Typography, Card, Avatar, theme } from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import { useGetPlayerStatisticsQuery } from "../../state/features/statistics/statisticsSlice";
import { useGetTournamentSessionsQuery, useGetTournamentsByYearQuery } from "../../state/features/tournaments/tournamentsSlice";
import { useGetPlayersQuery } from "../../state/features/player/playerSlice";
import type { ColumnsType } from "antd/es/table";
import { IPlayerStatisticsData } from "../../state/features/statistics/statisticsTypes";
import { API_URL } from "../../settings";

const { Option } = Select;
const { Title, Text } = Typography;

const PlayerStatistics: React.FC = () => {
    const [selectedSeason, setSelectedSeason] = useState<string | undefined>(undefined);
    const [selectedTournament, setSelectedTournament] = useState<number | undefined>(undefined);
    const [position, setPosition] = useState<string | undefined>(undefined);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);

    const {
        token: {
            colorText,
            colorTextSecondary,
            colorBorderSecondary,
            colorFillTertiary,
            colorFillSecondary,
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
            <span style={{ color: colorTextSecondary }}>0</span>
        ) : (
            <span style={{ color: color || colorText, fontWeight: 700, fontSize: 15 }}>
                {value}
            </span>
        );

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
                                backgroundColor: "#1890ff",
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
            render: (record: IPlayerStatisticsData) => statCell(record.statistics.goalsAndAssists),
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
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 20,
                }}
            >
                <TrophyOutlined style={{ fontSize: 24, color: "#faad14" }} />
                <div>
                    <Title level={3} style={{ margin: 0 }}>
                        Player Statistics
                    </Title>
                    <Text type="secondary">Goals, assists and disciplinary records across tournaments</Text>
                </div>
            </div>

            {/* Filter bar */}
            <div
                style={{
                    background: colorFillTertiary,
                    border: `1px solid ${colorBorderSecondary}`,
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 20,
                }}
            >
                <Space wrap>
                    <Select
                        style={{ width: 150 }}
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
                        style={{ width: 200 }}
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
                        style={{ width: 200 }}
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

                    <Button onClick={handleReset}>Reset Filters</Button>
                </Space>
            </div>

            <div className="player-stats-table">
                {/* Zebra rows for readability + remove AntD's active-sort column
                    tint so columns don't look randomly banded. */}
                <style>{`
                    .player-stats-table .ant-table-tbody > tr:nth-child(even) > td {
                        background: ${colorFillTertiary};
                    }
                    .player-stats-table .ant-table-tbody > tr.ant-table-row:hover > td {
                        background: ${colorFillSecondary} !important;
                    }
                    .player-stats-table td.ant-table-column-sort,
                    .player-stats-table th.ant-table-column-sort {
                        background: transparent !important;
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
        </Card>
    );
};

export default PlayerStatistics;
