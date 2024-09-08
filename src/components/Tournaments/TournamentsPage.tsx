import React, { useEffect, useState } from "react";
import { Layout, Table, Skeleton, Alert, Typography, Space } from "antd";
import { useGetTournamentsQuery } from "../../state/features/tournaments/tournamentsSlice";
import { IoTournamentSingleSummaryType } from "../../state/features/tournaments/tournamentTypes";
import TournamentsActionDropdown from "./Atoms/TournamentsActionDropdown";
import { useNavigate } from "react-router-dom";
import CreateTournament from "./Atoms/CreateTournamentModal";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";

const { Header } = Layout;
const { Title } = Typography;

const TournamentsPage: React.FC = () => {
    const loginInfo = useSelector(selectLoginInfo);
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
            dataIndex: "name",
            key: "tournamentName",
        },
        {
            title: "Date",
            dataIndex: "tournamentDate",
            key: "tournamentDate",
            sorter: true,
            render: (date: string) =>
                date && new Date(date).toLocaleDateString("en-GB"),
        },
        {
            title: "Venue",
            dataIndex: "venueName",
            key: "venueName",
            sorter: true,
        },
        {
            title: "Status",
            dataIndex: "tournamentStatus",
            key: "tournamentStatus",
            render: (tournamentStatus: string) => {
                return (
                    <div
                        style={{
                            color:
                                tournamentStatus === "UPCOMING"
                                    ? "green"
                                    : tournamentStatus === "COMPLETED"
                                    ? "gray"
                                    : "blue",
                        }}
                    >
                        {tournamentStatus}{" "}
                    </div>
                );
            },
        },
        {
            title: "Action",
            key: "action",
            render: (text: any, record: IoTournamentSingleSummaryType) =>
                record?.tournamentDate ? (
                    <TournamentsActionDropdown
                        record={record}
                        onMenuClick={handleMenuClick}
                    />
                ) : (
                    <div style={{ height: "32px" }} />
                ),
        },
    ];

    const emptyRowPlaceholder = () => {
        const remainingRows =
            pageSize - (tournamentSummaries?.content?.tournaments?.length || 0);
        return Array.from({ length: remainingRows }).map((_, index) => ({
            id: `empty-${index}`,
            tournamentName: "",
            tournamentDate: "",
            venueName: "",
            tournamentStatus: "",
            action: "",
        }));
    };

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

    const dataSource = [
        ...tournamentSummaries.content.tournaments,
        ...emptyRowPlaceholder(),
    ] as IoTournamentSingleSummaryType[];

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
                    {loginInfo.roles.includes("ADMIN") && <CreateTournament />}
                </Space>
            </Header>
            {JSON.stringify(
                tournamentSummaries.content.tournaments[0].tournamentStatus
            )}
            <Table<IoTournamentSingleSummaryType>
                columns={columns}
                dataSource={dataSource}
                rowKey={(record) => record.id?.toString() || record.id}
                showSorterTooltip={false}
                bordered
                pagination={{
                    current: currentPage,
                    pageSize,
                    total: tournamentSummaries?.content?.totalCount,
                }}
                scroll={{ y: "63vh" }}
                onChange={handleTableChange}
            />
        </>
    );
};

export default TournamentsPage;
