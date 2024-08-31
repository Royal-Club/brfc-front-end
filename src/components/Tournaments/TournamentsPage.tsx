import React, { useEffect, useState } from "react";
import { Layout, Table, Skeleton, Alert, Typography, Space } from "antd";
import { useGetTournamentsQuery } from "../../state/features/tournaments/tournamentsSlice";
import { IoTournamentSingleSummaryType } from "../../state/features/tournaments/tournamentTypes";
import TournamentsActionDropdown from "./Atoms/TournamentsActionDropdown";
import { useNavigate } from "react-router-dom";
import CreateTournament from "./Atoms/CreateTournamentModal";

const { Header } = Layout;
const { Title } = Typography;

const TournamentsPage: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sorter, setSorter] = useState<{
        sortedBy: string;
        sortDirection: "ASC" | "DESC";
    }>({
        sortedBy: "tournamentDate",
        sortDirection: "DESC",
    });

    const {
        data: tournamentSummaries,
        isLoading,
        isError,
        refetch: refetchTournaments,
    } = useGetTournamentsQuery({
        offSet: currentPage - 1,
        pageSize,
        sortedBy: sorter.sortedBy,
        sortDirection: sorter.sortDirection,
    });

    const navigate = useNavigate();

    const handleMenuClick = (e: any, record: IoTournamentSingleSummaryType) => {
        if (e.key === "join") {
            navigate(`/tournaments/join-tournament/${record.id}`);
        } else if (e.key === "team-building") {
            navigate(`/tournaments/team-building/${record.id}`);
        }
    };

    const handleTableChange = (pagination: any, filters: any, sorter: any) => {
        setCurrentPage(pagination.current);
        setPageSize(pagination.pageSize);
        setSorter({
            sortedBy: sorter.field || "tournamentDate",
            sortDirection: sorter.order === "ascend" ? "ASC" : "DESC",
        });
    };

    useEffect(() => {
        refetchTournaments();
    }, [currentPage, pageSize, sorter, refetchTournaments]);

    const columns = [
        {
            title: "Tournament Name",
            dataIndex: "tournamentName",
            key: "tournamentName",
        },
        {
            title: "Date",
            dataIndex: "tournamentDate",
            key: "tournamentDate",
            sorter: true,
            render: (date: string) =>
                new Date(date).toLocaleDateString("en-GB"),
        },
        {
            title: "Venue",
            dataIndex: "venueName",
            key: "venueName",
            sorter: true,
        },
        {
            title: "Status",
            dataIndex: "activeStatus",
            key: "activeStatus",
            render: (activeStatus: boolean) =>
                activeStatus ? "Active" : "Inactive",
        },
        {
            title: "Action",
            key: "action",
            render: (text: any, record: IoTournamentSingleSummaryType) => (
                <TournamentsActionDropdown
                    record={record}
                    onMenuClick={handleMenuClick}
                />
            ),
        },
    ];

    if (isLoading) {
        return (
            <>
                <Header style={{ backgroundColor: "#fff", padding: "0 24px" }}>
                    <Space direction="vertical" style={{ width: "100%" }}>
                        <Skeleton.Button active style={{ width: 150 }} />
                    </Space>
                </Header>
                <Skeleton active paragraph={{ rows: 6 }} />
            </>
        );
    }

    if (isError || !tournamentSummaries) {
        return (
            <Alert
                message="Error"
                description="Failed to load tournaments."
                type="error"
                showIcon
            />
        );
    }

    return (
        <>
            <Header style={{ backgroundColor: "#fff", padding: "0 24px" }}>
                <Space
                    direction="horizontal"
                    style={{ width: "100%", justifyContent: "space-between" }}
                >
                    <Title level={2} style={{ margin: 0 }}>
                        Tournaments
                    </Title>
                    <CreateTournament />
                </Space>
            </Header>
            <Table<IoTournamentSingleSummaryType>
                columns={columns}
                dataSource={tournamentSummaries.content}
                rowKey={(record) => record.id.toString()}
                showSorterTooltip={false}
                pagination={{
                    current: currentPage,
                    pageSize,
                    total: 20,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50"],
                }}
                scroll={{ y: "60vh" }}
                onChange={handleTableChange}
            />
        </>
    );
};

export default TournamentsPage;
