import { Table, Select, Button, Space, Typography, Card } from "antd";
import { useState, useEffect } from "react";
import { useGetPlayerStatisticsQuery } from "../../state/features/statistics/statisticsSlice";
import { useGetTournamentSessionsQuery, useGetTournamentsByYearQuery } from "../../state/features/tournaments/tournamentsSlice";
import type { ColumnsType } from "antd/es/table";
import { IPlayerStatisticsData } from "../../state/features/statistics/statisticsTypes";

const { Option } = Select;
const { Title } = Typography;

const PlayerStatistics: React.FC = () => {
    const [selectedSeason, setSelectedSeason] = useState<string | undefined>(undefined);
    const [selectedTournament, setSelectedTournament] = useState<number | undefined>(undefined);
    const [position, setPosition] = useState<string | undefined>(undefined);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);

    // Fetch tournament sessions (years)
    const { data: sessionsData, isLoading: sessionsLoading } = useGetTournamentSessionsQuery();

    // Fetch tournaments for selected year
    const { data: tournamentsData, isLoading: tournamentsLoading } = useGetTournamentsByYearQuery(
        { year: selectedSeason || "" },
        { skip: !selectedSeason }
    );

    // Set the latest season and tournament on initial load
    useEffect(() => {
        if (sessionsData?.content && sessionsData.content.length > 0 && !selectedSeason) {
            const latestSeason = sessionsData.content[0];
            setSelectedSeason(latestSeason);
        }
    }, [sessionsData, selectedSeason]);

    useEffect(() => {
        if (tournamentsData?.content && tournamentsData.content.length > 0 && !selectedTournament) {
            const latestTournament = tournamentsData.content[0];
            setSelectedTournament(latestTournament.id);
        }
    }, [tournamentsData, selectedTournament]);

    const { data, isLoading, refetch } = useGetPlayerStatisticsQuery({
        tournamentId: selectedTournament,
        position,
        limit: 100,
    });

    const columns: ColumnsType<IPlayerStatisticsData> = [
        {
            title: "",
            key: "playerCard",
            width: 80,
            fixed: "left",
            render: (record: IPlayerStatisticsData, _: any, index: number) => {
                const absoluteIndex = (currentPage - 1) * pageSize + index + 1;
                return (
                    <div
                        style={{
                            position: "relative",
                            width: "60px",
                            height: "70px",
                            backgroundImage: `url(/playerCard.png)`,
                            backgroundSize: "contain",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "center",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <span
                            style={{
                                position: "absolute",
                                top: "4px",
                                left: "16px",
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: "#ffffff",
                                textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                                zIndex: 2,
                            }}
                        >
                            #{absoluteIndex}
                        </span>
                        <span
                            style={{
                                fontSize: "28px",
                                fontWeight: "bold",
                                color: "#ffffff",
                                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                                marginTop: "-5px",
                            }}
                        >
                            {record.playerName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                );
            },
        },
        {
            title: "Player Name",
            dataIndex: "playerName",
            key: "playerName",
            width: 200,
            sorter: (a, b) => a.playerName.localeCompare(b.playerName),
        },
        {
            title: "Position",
            dataIndex: "position",
            key: "position",
            width: 180,
            filters: [
                { text: "Unassigned", value: "UNASSIGNED" },
                { text: "Goalkeeper", value: "GOALKEEPER" },
                { text: "Right Back", value: "RIGHT_BACK" },
                { text: "Left Back", value: "LEFT_BACK" },
                { text: "Center Back", value: "CENTER_BACK_1" },
                { text: "Center Back", value: "CENTER_BACK_2" },
                { text: "Defensive Midfield", value: "DEFENSIVE_MIDFIELD" },
                { text: "Right Wing/Forward", value: "RIGHT_WING_FORWARD" },
                { text: "Central Midfield", value: "CENTRAL_MIDFIELD" },
                { text: "Striker", value: "STRIKER" },
                { text: "Attacking Midfield", value: "ATTACKING_MIDFIELD" },
                { text: "Left Wing/Forward", value: "LEFT_WING_FORWARD" },
            ],
            onFilter: (value, record) => record.position.includes(value as string),
        },
        {
            title: "Matches",
            key: "matchesPlayed",
            width: 100,
            render: (record: IPlayerStatisticsData) => record.statistics.matchesPlayed,
            sorter: (a, b) => a.statistics.matchesPlayed - b.statistics.matchesPlayed,
        },
        {
            title: "Goals",
            key: "goalsScored",
            width: 100,
            render: (record: IPlayerStatisticsData) => (
                <span style={{ fontWeight: "bold", color: "#52c41a" }}>
                    {record.statistics.goalsScored}
                </span>
            ),
            sorter: (a, b) => a.statistics.goalsScored - b.statistics.goalsScored,
        },
        {
            title: "Assists",
            key: "assists",
            width: 100,
            render: (record: IPlayerStatisticsData) => (
                <span style={{ fontWeight: "bold", color: "#1890ff" }}>
                    {record.statistics.assists}
                </span>
            ),
            sorter: (a, b) => a.statistics.assists - b.statistics.assists,
        },
        {
            title: "Yellow Cards",
            key: "yellowCards",
            width: 120,
            render: (record: IPlayerStatisticsData) => (
                <span style={{ color: "#faad14" }}>
                    {record.statistics.yellowCards}
                </span>
            ),
            sorter: (a, b) => a.statistics.yellowCards - b.statistics.yellowCards,
        },
        {
            title: "Red Cards",
            key: "redCards",
            width: 100,
            render: (record: IPlayerStatisticsData) => (
                <span style={{ color: "#ff4d4f" }}>
                    {record.statistics.redCards}
                </span>
            ),
            sorter: (a, b) => a.statistics.redCards - b.statistics.redCards,
        },
    ];

    const handleReset = () => {
        // Reset to latest season and tournament
        if (sessionsData?.content && sessionsData.content.length > 0) {
            setSelectedSeason(sessionsData.content[0]);
            setSelectedTournament(undefined);
        }
        setPosition(undefined);
        setCurrentPage(1);
        refetch();
    };

    const handleSeasonChange = (value: string) => {
        setSelectedSeason(value);
        setSelectedTournament(undefined); // Reset tournament when season changes
    };

    return (
     
            <Card>
                <Title level={3} style={{ marginBottom: 24 }}>
                    Player Statistics
                </Title>

                <Space direction="vertical" style={{ width: "100%", marginBottom: 24 }}>
                    <Space wrap>
                        <Select
                            style={{ width: 150 }}
                            placeholder="Select Season"
                            value={selectedSeason}
                            onChange={handleSeasonChange}
                            loading={sessionsLoading}
                        >
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
                        >
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
                </Space>

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
                    scroll={{ x: 1000 }}
                    size="small"
                />
            </Card>
       
    );
};

export default PlayerStatistics;
