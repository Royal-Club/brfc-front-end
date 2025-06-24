import React, { useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Select,
  Typography,
  Space,
  Skeleton,
  Input,
  Grid,
  theme,
  Card,
  Row,
  Col,
  Button,
  Badge,
  Table,
  Radio,
  Divider,
  Avatar,
  Tooltip,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table/interface";
import useJoinTournament from "../../hooks/useJoinTournament";
import { TournamentPlayerInfoType } from "../../state/features/tournaments/tournamentTypes";
import DebouncedInput from "./Atoms/DebouncedInput";
import "./tournament.css";
import {
  CheckCircleTwoTone,
  CloseCircleOutlined,
  RightSquareOutlined,
  UserOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  SortAscendingOutlined,
  FilterOutlined,
  CaretRightOutlined,
  StarFilled,
  EditOutlined,
} from "@ant-design/icons";
import { showBdLocalTime } from "./../../utils/utils";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
const { useBreakpoint } = Grid;

type ParticipationFilter = "all" | "participating" | "not-participating" | "pending";
type SortOption = "name" | "status" | "employeeId";

interface TableRow extends TournamentPlayerInfoType {
  key: number;
}

export default function JoinTournament() {
  const loginInfo = useSelector(selectLoginInfo);
  const { id = "" } = useParams();
  const tournamentId = Number(id);
  const { players, isLoading, isUpdating, handleUpdate, nextTournament } =
    useJoinTournament(tournamentId);

  const [editedComments, setEditedComments] = useState<{
    [key: number]: string;
  }>({});

  const { token } = theme.useToken();

  const [searchTerm, setSearchTerm] = useState("");
  const [participationFilter, setParticipationFilter] = useState<ParticipationFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const screens = useBreakpoint();

  // Find logged-in player
  const loggedInPlayer = players.find(
    (player) => player.playerId === Number(loginInfo.userId)
  );

  // Filter and sort players
  const { participatingPlayers, notParticipatingPlayers, pendingPlayers, filteredTableData } = useMemo(() => {
    let filtered = players; // Include all players including logged-in user

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (player) =>
          player.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          player.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply participation filter
    if (participationFilter !== "all") {
      switch (participationFilter) {
        case "participating":
          filtered = filtered.filter((p) => p.participationStatus === true);
          break;
        case "not-participating":
          filtered = filtered.filter((p) => p.participationStatus === false);
          break;
        case "pending":
          filtered = filtered.filter((p) => p.participationStatus === null);
          break;
      }
    }

    // Sort players with logged-in user at the top
    const sortedPlayers = [...filtered].sort((a, b) => {
      // Always put logged-in user first
      if (a.playerId === Number(loginInfo.userId)) return -1;
      if (b.playerId === Number(loginInfo.userId)) return 1;
      
      switch (sortBy) {
        case "name":
          return a.playerName.localeCompare(b.playerName);
        case "employeeId":
          return a.employeeId.localeCompare(b.employeeId);
        case "status":
          const getStatusValue = (status: boolean | null): number => {
            if (status === true) return 0;
            if (status === null) return 1;
            return 2;
          };
          return getStatusValue(a.participationStatus) - getStatusValue(b.participationStatus);
        default:
          return 0;
      }
    });

    // Group by participation status for stats
    const participating = players.filter((p) => p.participationStatus === true);
    const notParticipating = players.filter((p) => p.participationStatus === false);
    const pending = players.filter((p) => p.participationStatus === null);

    // Convert to table data
    const tableData: TableRow[] = sortedPlayers.map((player) => ({
      ...player,
      key: player.playerId,
    }));

    return {
      participatingPlayers: participating,
      notParticipatingPlayers: notParticipating,
      pendingPlayers: pending,
      filteredTableData: tableData,
    };
  }, [players, searchTerm, participationFilter, sortBy, loginInfo.userId]);


  const getStatusBadge = (status: boolean | null) => {
    if (status === true) return <Badge status="success" text="Participating" />;
    if (status === false) return <Badge status="error" text="Not Participating" />;
    return <Badge status="warning" text="Pending" />;
  };

  const columns: ColumnsType<TableRow> = [
    {
      title: "ID",
      key: "employeeId",
      width: screens.xs ? 60 : 80,
      render: (_, record) => (
        <Text strong style={{ 
          fontSize: screens.xs ? "11px" : "13px",
          color: record.playerId === Number(loginInfo.userId) ? token.colorPrimary : token.colorText
        }}>
          {record.employeeId}
        </Text>
      ),
      align: "center",
    },
    {
      title: "Player",
      key: "player",
      width: screens.xs ? 200 : 280,
      render: (_, record) => (
        <Space align="center">
          <Avatar 
            size={screens.xs ? 24 : 32} 
            icon={<UserOutlined />}
            style={{ 
              backgroundColor: record.playerId === Number(loginInfo.userId) ? token.colorPrimary : '#1890ff',
            }}
          />
          <div>
            <Space>
              <Text strong style={{ 
                fontSize: screens.xs ? "13px" : "15px",
                color: token.colorText
              }}>
                {record.playerName}
              </Text>
              {record.playerId === Number(loginInfo.userId) && <StarFilled style={{ color: '#faad14' }} />}
            </Space>
          </div>
        </Space>
      ),
    },
    {
      title: "Status",
      key: "participationStatus",
      width: screens.xs ? 120 : 140,
      render: (_, record) => getStatusBadge(record.participationStatus),
      align: "left",
    },
    {
      title: "Action",
      key: "action",
      width: screens.xs ? 120 : 150,
      render: (_, record) => (
        <Select
          value={
            record.participationStatus === true
              ? "true"
              : record.participationStatus === false
              ? "false"
              : "Select"
          }
          onChange={(value) => {
            handleUpdate(
              record.playerId,
              editedComments[record.playerId] || record.comments || "",
              value === "true"
            );
          }}
          disabled={
            isUpdating ||
            (!loginInfo.roles.includes("ADMIN") &&
              record.playerId !== Number(loginInfo.userId))
          }
          style={{ width: "100%" }}
          size={screens.xs ? "small" : "middle"}
        >
          <Option value="true">
            <Space>
              <CheckCircleTwoTone twoToneColor="#52c41a" />
              Yes
            </Space>
          </Option>
          <Option value="false">
            <Space>
              <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
              No
            </Space>
          </Option>
        </Select>
      ),
    },
    {
      title: "Comments",
      key: "comments",
      render: (_, record) => (
        <DebouncedInput
          isDisabled={
            !loginInfo.roles.includes("ADMIN") &&
            record.playerId !== Number(loginInfo.userId)
          }
          placeholder="Add your comments here..."
          debounceDuration={1000}
          onChange={(value) => {
            setEditedComments({
              ...editedComments,
              [record.playerId]: value,
            });
            handleUpdate(record.playerId, value, record.participationStatus);
          }}
          value={editedComments[record.playerId] || record.comments || ""}
        />
      ),
    },
  ];

  return (
    <div className="join-tournament-container">
      {isLoading ? (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Card style={{ borderRadius: 12 }}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
          <Card style={{ borderRadius: 12 }}>
            <Skeleton.Input style={{ width: 200, marginBottom: 16 }} active />
            <Skeleton active paragraph={{ rows: 8 }} />
          </Card>
        </Space>
      ) : (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Combined Tournament Header with Stats and Player Status */}
          <Card 
            style={{ 
              borderRadius: 12, 
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderColor: token.colorBorder
            }}
          >
            {/* Tournament Header Section */}
            <Row gutter={[16, 12]} align="middle" style={{ marginBottom: 12 }}>
              <Col xs={24} lg={16}>
                <Space direction="vertical" size={2}>
                  <Title level={2} style={{ 
                    margin: 0, 
                    fontSize: screens.xs ? "18px" : "24px",
                    color: token.colorText
                  }}>
                    {nextTournament?.tournamentName}
                  </Title>
                  <Text type="secondary" style={{ fontSize: "14px" }}>
                    <RightSquareOutlined />{" "}
                    {nextTournament?.tournamentDate &&
                      showBdLocalTime(nextTournament?.tournamentDate)}
                  </Text>
                </Space>
              </Col>
              <Col xs={24} lg={8}>
                <Row gutter={[4, 4]} className="tournament-stats-row">
                  <Col xs={12} sm={6}>
                    <Tooltip title="Total Players" placement="top">
                      <Card size="small" style={{ 
                        textAlign: 'center',
                        borderColor: token.colorBorder,
                        padding: '4px',
                        cursor: 'pointer'
                      }}>
                        <Space direction="vertical" size={1}>
                          <TeamOutlined style={{ fontSize: 12, color: '#1890ff' }} />
                          <Text strong style={{ 
                            fontSize: 14,
                            color: token.colorText
                          }}>{players.length}</Text>
                        </Space>
                      </Card>
                    </Tooltip>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Tooltip title="Participating" placement="top">
                      <Card size="small" style={{ 
                        textAlign: 'center',
                        borderColor: token.colorBorder,
                        padding: '4px',
                        cursor: 'pointer'
                      }}>
                        <Space direction="vertical" size={1}>
                          <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 12 }} />
                          <Text strong style={{ fontSize: 14, color: '#52c41a' }}>
                            {participatingPlayers.length}
                          </Text>
                        </Space>
                      </Card>
                    </Tooltip>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Tooltip title="Not Participating" placement="top">
                      <Card size="small" style={{ 
                        textAlign: 'center',
                        borderColor: token.colorBorder,
                        padding: '4px',
                        cursor: 'pointer'
                      }}>
                        <Space direction="vertical" size={1}>
                          <CloseCircleOutlined style={{ fontSize: 12, color: '#ff4d4f' }} />
                          <Text strong style={{ fontSize: 14, color: '#ff4d4f' }}>
                            {notParticipatingPlayers.length}
                          </Text>
                        </Space>
                      </Card>
                    </Tooltip>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Tooltip title="Pending Response" placement="top">
                      <Card size="small" style={{ 
                        textAlign: 'center',
                        borderColor: token.colorBorder,
                        padding: '4px',
                        cursor: 'pointer'
                      }}>
                        <Space direction="vertical" size={1}>
                          <ClockCircleOutlined style={{ fontSize: 12, color: '#faad14' }} />
                          <Text strong style={{ fontSize: 14, color: '#faad14' }}>
                            {pendingPlayers.length}
                          </Text>
                        </Space>
                      </Card>
                    </Tooltip>
                  </Col>
                </Row>
              </Col>
            </Row>

            {/* Logged-in Player Section */}
            {loggedInPlayer && (
              <>
                <Divider style={{ margin: '8px 0' }} />
                <div>
                  <Title level={4} style={{ 
                    marginBottom: 8, 
                    color: token.colorPrimary 
                  }}>
                    <UserOutlined /> Your Participation Status
                  </Title>
                  <Row gutter={[16, 8]} align="middle">
                    <Col xs={24} sm={6}>
                      <Space align="center">
                        <Avatar 
                          size={32} 
                          icon={<UserOutlined />}
                          style={{ 
                            backgroundColor: token.colorPrimary,
                            border: `2px solid ${token.colorPrimary}`
                          }}
                        />
                        <div>
                          <Space>
                            <Text strong style={{ 
                              fontSize: "14px",
                              color: token.colorText
                            }}>
                              {loggedInPlayer.playerName}
                            </Text>
                            <StarFilled style={{ color: '#faad14' }} />
                          </Space>
                          <div>
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              ID: {loggedInPlayer.employeeId}
                            </Text>
                          </div>
                        </div>
                      </Space>
                    </Col>
                    <Col xs={24} sm={6}>
                      <div>
                        <Text strong style={{ 
                          fontSize: "14px", 
                          display: "block", 
                          marginBottom: 4,
                          color: token.colorText
                        }}>
                          Participation Status
                        </Text>
                        <Select
                          value={
                            loggedInPlayer.participationStatus === true
                              ? "true"
                              : loggedInPlayer.participationStatus === false
                              ? "false"
                              : "Select"
                          }
                          onChange={(value) => {
                            handleUpdate(
                              loggedInPlayer.playerId,
                              editedComments[loggedInPlayer.playerId] || loggedInPlayer.comments || "",
                              value === "true"
                            );
                          }}
                          disabled={isUpdating}
                          style={{ width: "100%" }}
                          size="large"
                        >
                          <Option value="true">
                            <Space>
                              <CheckCircleTwoTone twoToneColor="#52c41a" />
                              Yes
                            </Space>
                          </Option>
                          <Option value="false">
                            <Space>
                              <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                              No
                            </Space>
                          </Option>
                        </Select>
                      </div>
                    </Col>
                    <Col xs={24} sm={12}>
                      <div>
                        <Text strong style={{ 
                          fontSize: "14px", 
                          display: "block", 
                          marginBottom: 4,
                          color: token.colorText
                        }}>
                          <EditOutlined /> Comments
                        </Text>
                        <DebouncedInput
                          isDisabled={false}
                          placeholder="Add your comments here..."
                          debounceDuration={1000}
                          onChange={(value) => {
                            setEditedComments({
                              ...editedComments,
                              [loggedInPlayer.playerId]: value,
                            });
                            handleUpdate(loggedInPlayer.playerId, value, loggedInPlayer.participationStatus);
                          }}
                          value={editedComments[loggedInPlayer.playerId] || loggedInPlayer.comments || ""}
                        />
                      </div>
                    </Col>
                  </Row>
                </div>
              </>
            )}
          </Card>

          {/* Tournament Participants Table */}
          <Card style={{ 
            borderRadius: 12, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderColor: token.colorBorder
          }}>
            <Row gutter={[16, 12]} align="middle" style={{ marginBottom: 16 }}>
              <Col xs={24} sm={8}>
                <Title level={4} style={{ 
                  margin: 0,
                  color: token.colorText
                }}>
                  <TeamOutlined /> Tournament Participants
                </Title>
              </Col>
              <Col xs={24} sm={16}>
                <Row gutter={[8, 8]} align="middle">
                  <Col xs={12} sm={6}>
                    <Select
                      value={sortBy}
                      onChange={setSortBy}
                      style={{ width: "100%" }}
                      size="middle"
                      prefix={<SortAscendingOutlined />}
                    >
                      <Option value="name">Sort by Name</Option>
                      <Option value="employeeId">Sort by ID</Option>
                      <Option value="status">Sort by Status</Option>
                    </Select>
                  </Col>
                  <Col xs={12} sm={8}>
                    <Radio.Group
                      value={participationFilter}
                      onChange={(e) => setParticipationFilter(e.target.value)}
                      optionType="button"
                      buttonStyle="solid"
                      size="small"
                      style={{ width: "100%" }}
                    >
                      <Radio.Button value="all">All</Radio.Button>
                      <Radio.Button value="participating">✅</Radio.Button>
                      <Radio.Button value="pending">⏳</Radio.Button>
                      <Radio.Button value="not-participating">❌</Radio.Button>
                    </Radio.Group>
                  </Col>
                  <Col xs={24} sm={10}>
                    <Search
                      placeholder="Search by name or employee ID..."
                      prefix={<SearchOutlined />}
                      onSearch={(value) => setSearchTerm(value)}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ width: "100%" }}
                      size="middle"
                      allowClear
                    />
                  </Col>
                </Row>
              </Col>
            </Row>

            {searchTerm && (
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary">
                  <SearchOutlined /> Found {filteredTableData.length} player(s) matching "{searchTerm}"
                </Text>
              </div>
            )}

            <Table
              columns={columns}
              dataSource={filteredTableData}
              size={screens.xs ? "small" : "middle"}
              bordered
              pagination={{
                pageSize: screens.xs ? 10 : 15,
                showSizeChanger: !screens.xs,
                showQuickJumper: !screens.xs,
                size: screens.xs ? "small" : "default",
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} players`,
              }}
              scroll={{ x: "max-content" }}
              loading={isUpdating}
              locale={{
                emptyText: `No ${participationFilter === "all" ? "" : participationFilter.replace("-", " ")} players found`,
              }}
              rowClassName={(record) => 
                record.playerId === Number(loginInfo.userId) ? 'logged-in-player-row' : ''
              }
              style={{ borderColor: token.colorBorder }}
            />
          </Card>
        </Space>
      )}
    </div>
  );
}