import React from "react";
import {
    Layout,
    Button,
    Table,
    Skeleton,
    Alert,
    Typography,
    Space,
} from "antd";
import { useGetTournamentsQuery } from "../../state/features/tournaments/tournamentsSlice";
import { IoTournamentSingleSummaryType } from "../../state/features/tournaments/tournamentTypes";
import TournamentsActionDropdown from "./Atoms/TournamentsActionDropdown";
import { useNavigate } from "react-router-dom";
import CreateTournament from "./Atoms/CreateTournamentModal";

const { Header } = Layout;
const { Title } = Typography;

const TournamentsPage: React.FC = () => {
    const {
        data: tournamentSummaries,
        isLoading,
        isError,
    } = useGetTournamentsQuery();

    const navigate = useNavigate();

    const handleMenuClick = (e: any, record: IoTournamentSingleSummaryType) => {
        if (e.key === "join") {
            navigate(`/tournaments/join-tournament/${record.id}`);
        } else if (e.key === "team-building") {
            navigate(`/tournaments/team-building/${record.id}`);
        }
    };

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
            render: (date: string) => {
                return new Date(date).toLocaleDateString("en-GB");
            },
        },
        {
            title: "Venue",
            dataIndex: "venueName",
            key: "venueName",
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
                        All Tournaments
                    </Title>
                    <CreateTournament />
                </Space>
            </Header>
            <Table<IoTournamentSingleSummaryType>
                columns={columns}
                dataSource={tournamentSummaries.content}
                rowKey={(record) => record.id.toString()}
                pagination={{ pageSize: 10 }}
            />
        </>
    );
};

export default TournamentsPage;
