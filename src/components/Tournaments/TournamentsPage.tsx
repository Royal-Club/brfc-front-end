import React, { useEffect, useState } from "react";
import { Layout, Table, Skeleton, Alert, Typography, Space, theme, Card, Button, Tag, Row, Col, Pagination } from "antd";
import { useGetTournamentsQuery } from "../../state/features/tournaments/tournamentsSlice";
import { IoTournamentSingleSummaryType } from "../../state/features/tournaments/tournamentTypes";
import TournamentsActionDropdown from "./Atoms/TournamentsActionDropdown";
import { useNavigate } from "react-router-dom";
import CreateTournament from "./Atoms/CreateTournamentModal";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { showBdLocalTime } from "../../utils/utils";
import { CalendarOutlined, EnvironmentOutlined, ClockCircleOutlined } from "@ant-design/icons";

const { Header } = Layout;
const { Title, Text } = Typography;

const TournamentsPage: React.FC = () => {
  const loginInfo = useSelector(selectLoginInfo);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isMobile, setIsMobile] = useState(false);
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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMenuClick = (e: any, record: IoTournamentSingleSummaryType) => {
    if (e.key === "join") {
      navigate(`/tournaments/join-tournament/${record.id}`);
    } else if (e.key === "team-building") {
      navigate(`/tournaments/team-building/${record.id}`);
    } else if (e.type === "click" && record.activeStatus) {
      navigate(`/tournaments/join-tournament/${record.id}`);
    }
  };

  const handleCardClick = (record: IoTournamentSingleSummaryType) => {
    if (record.activeStatus) {
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

  const getStatusColor = (status: string | undefined, activeStatus: boolean) => {
    if (!activeStatus || !status) return "default";
    switch (status) {
      case "UPCOMING": return "processing";
      case "COMPLETED": return "success";
      case "ONGOING": return "warning";
      default: return "default";
    }
  };

  const getStatusText = (status: string | undefined) => {
    if (!status) return "Unknown";
    switch (status) {
      case "UPCOMING": return "Upcoming";
      case "COMPLETED": return "Completed";
      case "ONGOING": return "Ongoing";
      default: return status;
    }
  };

  // Mobile Card Component
  const TournamentCard = ({ tournament }: { tournament: IoTournamentSingleSummaryType }) => (
    <Card
      className="tournament-mobile-card"
      hoverable={tournament.activeStatus}
      style={{
        marginBottom: 12,
        opacity: tournament.activeStatus ? 1 : 0.6,
      }}
      bodyStyle={{ padding: '16px' }}
    >
      <Row justify="space-between" align="top">
        <Col 
          span={18}
          onClick={() => handleCardClick(tournament)}
          style={{ 
            cursor: tournament.activeStatus ? 'pointer' : 'default' 
          }}
        >
          <Title 
            level={5} 
            style={{ 
              margin: '0 0 8px 0', 
              color: tournament.activeStatus ? 'inherit' : '#999',
              fontSize: '16px',
              lineHeight: '1.3'
            }}
            ellipsis={{ rows: 2 }}
          >
            {tournament.name}
          </Title>
          
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Space size={4}>
              <CalendarOutlined style={{ color: '#1890ff', fontSize: '12px' }} />
              <Text style={{ fontSize: '12px', color: tournament.activeStatus ? 'inherit' : '#999' }}>
                {tournament.tournamentDate && showBdLocalTime(tournament.tournamentDate)}
              </Text>
            </Space>
            
            <Space size={4}>
              <EnvironmentOutlined style={{ color: '#52c41a', fontSize: '12px' }} />
              <Text style={{ fontSize: '12px', color: tournament.activeStatus ? 'inherit' : '#999' }}>
                {tournament.venueName}
              </Text>
            </Space>
          </Space>
        </Col>
        
        <Col 
          span={6} 
          style={{ textAlign: 'right' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Space direction="vertical" size={8} style={{ width: '100%', alignItems: 'flex-end' }}>
            <Tag 
              color={getStatusColor(tournament.tournamentStatus, tournament.activeStatus)}
              style={{ margin: 0, fontSize: '10px' }}
            >
              {getStatusText(tournament.tournamentStatus)}
            </Tag>
            
            {tournament.tournamentDate && (
              <div onClick={(e) => e.stopPropagation()}>
                <TournamentsActionDropdown
                  record={tournament}
                  onMenuClick={handleMenuClick}
                  tournamentId={tournament.id}
                />
              </div>
            )}
          </Space>
        </Col>
      </Row>
    </Card>
  );

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
        };
      },
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
    if (isMobile) {
      return (
        <div style={{ padding: '16px' }}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Space
              style={{
                width: "100%",
                justifyContent: "space-between",
                padding: "8px 0",
                display: "flex",
                flexWrap: "wrap",
              }}
            >
              <Skeleton.Input active style={{ width: 120, height: 28 }} />
              {loginInfo.roles.includes("ADMIN") && (
                <Skeleton.Button active style={{ width: 100, height: 28 }} />
              )}
            </Space>
            
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} style={{ marginBottom: 12 }}>
                <Skeleton active paragraph={{ rows: 2 }} />
              </Card>
            ))}
          </Space>
        </div>
      );
    }

    return (
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
            padding: "12px 0",
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          <Skeleton.Input active style={{ width: 150, height: 32 }} />
          {loginInfo.roles.includes("ADMIN") && (
            <Skeleton.Button active style={{ width: 120, height: 32 }} />
          )}
        </Space>
        <div style={{ background: colorBgContainer, padding: "24px", borderRadius: "8px" }}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </Space>
    );
  }

  if (isError || !tournamentSummaries) {
    return (
      <div style={{ padding: isMobile ? "16px" : "0" }}>
        <Alert
          message="Error"
          description="Failed to load tournaments."
          type="error"
          showIcon
        />
      </div>
    );
  }

  // Mobile View
  if (isMobile) {
    return (
      <div style={{ 
        padding: '16px', 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
            padding: "8px 0 16px 0",
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          <Title style={{ margin: 0, fontSize: "20px" }}>Tournaments</Title>
          {loginInfo.roles.includes("ADMIN") && <CreateTournament />}
        </Space>

        <div 
          className="mobile-tournament-scroll" 
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            marginBottom: '16px',
            paddingRight: '4px'
          }}
        >
          {tournamentSummaries.content.tournaments.length === 0 ? (
            <Card>
              <Text>No tournaments found.</Text>
            </Card>
          ) : (
            tournamentSummaries.content.tournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))
          )}
        </div>

        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={tournamentSummaries?.content?.totalCount}
          onChange={(page, size) => {
            setCurrentPage(page);
            setPageSize(size || pageSize);
          }}
          showSizeChanger={false}
          showQuickJumper={false}
          showTotal={(total, range) => `${range[0]}-${range[1]}/${total}`}
          size="small"
          style={{ textAlign: 'center', flexShrink: 0 }}
        />
      </div>
    );
  }

  // Desktop View (existing table)
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
