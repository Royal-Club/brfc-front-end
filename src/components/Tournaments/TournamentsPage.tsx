import React, { useEffect, useState } from "react";
import { Layout, Table, Skeleton, Alert, Typography, Space, theme } from "antd";
import { useGetTournamentsQuery } from "../../state/features/tournaments/tournamentsSlice";
import { IoTournamentSingleSummaryType } from "../../state/features/tournaments/tournamentTypes";
import TournamentsActionDropdown from "./Atoms/TournamentsActionDropdown";
import { useNavigate } from "react-router-dom";
import CreateTournament from "./Atoms/CreateTournamentModal";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { showBdLocalTime } from "../../utils/utils";


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
    token: { colorBgContainer },
  } = theme.useToken();

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
    } else if (e.type === "click" && record.activeStatus
    ) {
      navigate(`/tournaments/join-tournament/${record.id}`);
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
      onCell: (record: IoTournamentSingleSummaryType, rowIndex: any) => {
        return {
          onClick: (e: any) => {
            handleMenuClick(e, record);
          }
        };
      },
      render: (text: string, record: IoTournamentSingleSummaryType) => {
        return {
          children: (
            <span
              style={{
                color: record.activeStatus === false ? "gray" : "inherit",
              }}
            >
              {text}
            </span>
          ),
        };
      },
    },
    {
      title: "Date & Time",
      dataIndex: "tournamentDate",
      key: "tournamentDate",
      sorter: true,
      onCell: (record: IoTournamentSingleSummaryType, rowIndex: any) => {
        return {
          onClick: (e: any) => {
            handleMenuClick(e, record);
          },
        };
      },
      render: (date: string, record: IoTournamentSingleSummaryType) => {
        return {
          children: (
            <span
              style={{
                color: record.activeStatus === false ? "gray" : "inherit",
              }}
            >
              {date && showBdLocalTime(date)}
            </span>
          ),
        };
      },
    },
    {
      title: "Venue",
      dataIndex: "venueName",
      key: "venueName",
      sorter: true,
      onCell: (record: IoTournamentSingleSummaryType, rowIndex: any) => {
        return {
          onClick: (e: any) => {
            handleMenuClick(e, record);
          },
        };
      },
      render: (venue: string, record: IoTournamentSingleSummaryType) => {
        return {
          children: (
            <span
              style={{
                color: record.activeStatus === false ? "gray" : "inherit",
              }}
            >
              {venue}
            </span>
          ),
        };
      }
    },
    {
      title: "Status",
      dataIndex: "tournamentStatus",
      key: "tournamentStatus",
      onCell: (record: IoTournamentSingleSummaryType, rowIndex: any) => {
        return {
          onClick: (e: any) => {
            handleMenuClick(e, record);
          },
        };
      },
      render: (
        tournamentStatus: string,
        record: IoTournamentSingleSummaryType
      ) => {
        const dotColor =
          record.activeStatus === false
            ? "gray"
            : tournamentStatus === "UPCOMING"
            ? "#008080"
            : tournamentStatus === "COMPLETED"
            ? "#708090"
            : tournamentStatus === ""
            ? null
            : "#4169E1";

        return {
          children: (
            <div style={{ display: "flex", alignItems: "center" }}>
              {dotColor && (
                <span
                  style={{
                    height: "10px",
                    width: "10px",
                    borderRadius: "50%",
                    backgroundColor: dotColor,
                    display: "inline-block",
                    marginRight: "8px",
                  }}
                ></span>
              )}

              <span
                style={{
                  color: record.activeStatus === false ? "gray" : "inherit",
                }}
              >
                {tournamentStatus}
              </span>
            </div>
          ),
        };
      },
    },
    {
      title: "Action",
      key: "action",
      render: (text: any, record: IoTournamentSingleSummaryType) => {
        return {
          children: record?.tournamentDate ? (
            <TournamentsActionDropdown
              record={record}
              onMenuClick={handleMenuClick}
              tournamentId={record.id}
            />
          ) : (
            <div style={{ height: "32px" }} />
          ),
        }
      }
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
        <Header style={{ padding: "0 24px", background: colorBgContainer }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Skeleton.Button active style={{ width: 150 }} />
          </Space>
        </Header>
        <Skeleton active paragraph={{ rows: 10 }} />
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
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          padding: "12px 0",
          display: "flex",
          flexWrap: "wrap",
        }}
      >
        <Title style={{ margin: 0 }}>Tournaments</Title>
        {loginInfo.roles.includes("ADMIN") && <CreateTournament />}
      </Space>

      <div className="tournament-table">
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
          scroll={{ y: "70vh", x: "max-content" }}
          onChange={handleTableChange}
        />
      </div>
    </>
  );
};

export default TournamentsPage;
