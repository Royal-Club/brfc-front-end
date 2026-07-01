import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Select, Typography, Space, Skeleton, Input, Grid, theme, Card,
  Row, Col, Button, Table, Segmented, Avatar, Tag, Divider, Progress,
} from "antd";
import type { ColumnsType } from "antd/es/table/interface";
import useJoinTournament from "../../hooks/useJoinTournament";
import { TournamentPlayerInfoType } from "../../state/features/tournaments/tournamentTypes";
import DebouncedInput from "./Atoms/DebouncedInput";
import "./tournament.css";
import {
  CheckCircleOutlined, CloseCircleOutlined, UserOutlined, SearchOutlined,
  ClockCircleOutlined, TeamOutlined, StarFilled, CalendarOutlined,
  CheckCircleFilled, TrophyOutlined,
} from "@ant-design/icons";
import { showBdLocalTime } from "./../../utils/utils";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import GoalKeeperDrawer from "./Atoms/GoalKeeperDrawer";
import { toAbsolutePlayerPhotoUrl } from "../../utils/playerPhotoUtils";

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

type ParticipationFilter = "all" | "participating" | "not-participating" | "pending";
type SortOption = "name" | "status" | "employeeId";
interface TableRow extends TournamentPlayerInfoType { key: number; }

const statusBorderColor = (s: boolean | null | undefined) =>
  s === true ? "#52c41a" : s === false ? "#ff4d4f" : "#faad14";

export default function JoinTournament() {
  const loginInfo    = useSelector(selectLoginInfo);
  const { id = "" } = useParams();
  const tournamentId = Number(id);
  const navigate     = useNavigate();
  const { players, isLoading, isUpdating, handleUpdate, nextTournament } =
    useJoinTournament(tournamentId);

  const [editedComments, setEditedComments] = useState<{ [key: number]: string }>({});
  const { token } = theme.useToken();
  const [searchTerm, setSearchTerm]               = useState("");
  const [participationFilter, setParticipationFilter] = useState<ParticipationFilter>("all");
  const [sortBy, setSortBy]                       = useState<SortOption>("name");
  const screens = useBreakpoint();

  const loggedInPlayer = players.find(p => p.playerId === Number(loginInfo.userId));

  const { participatingPlayers, notParticipatingPlayers, pendingPlayers, filteredTableData } =
    useMemo(() => {
      let filtered = [...players];

      if (searchTerm) {
        filtered = filtered.filter(p =>
          p.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (participationFilter !== "all") {
        filtered = filtered.filter(p =>
          participationFilter === "participating"     ? p.participationStatus === true  :
          participationFilter === "not-participating" ? p.participationStatus === false :
          p.participationStatus === null
        );
      }

      const sorted = [...filtered].sort((a, b) => {
        if (a.playerId === Number(loginInfo.userId)) return -1;
        if (b.playerId === Number(loginInfo.userId)) return 1;
        if (sortBy === "name")       return a.playerName.localeCompare(b.playerName);
        if (sortBy === "employeeId") return a.employeeId.localeCompare(b.employeeId);
        const rank = (s: boolean | null) => s === true ? 0 : s === null ? 1 : 2;
        return rank(a.participationStatus) - rank(b.participationStatus);
      });

      return {
        participatingPlayers:    players.filter(p => p.participationStatus === true),
        notParticipatingPlayers: players.filter(p => p.participationStatus === false),
        pendingPlayers:          players.filter(p => p.participationStatus === null),
        filteredTableData:       sorted.map(p => ({ ...p, key: p.playerId })) as TableRow[],
      };
    }, [players, searchTerm, participationFilter, sortBy, loginInfo.userId]);

  const columns: ColumnsType<TableRow> = [
    {
      title: "ID",
      key: "employeeId",
      width: 80,
      align: "center",
      render: (_, r) => (
        <Text strong style={{ fontSize: 13, color: r.playerId === Number(loginInfo.userId) ? token.colorPrimary : token.colorText }}>
          {r.employeeId}
        </Text>
      ),
    },
    {
      title: "Player",
      key: "player",
      render: (_, r) => {
        const isMe = r.playerId === Number(loginInfo.userId);
        const photoUrl = toAbsolutePlayerPhotoUrl(r.photoUrl);
        return (
          <Space size={8}>
            <Avatar size={30} src={photoUrl} icon={!photoUrl ? <UserOutlined /> : undefined}
              style={{ backgroundColor: photoUrl ? undefined : (isMe ? token.colorPrimary : "#1890ff"), flexShrink: 0 }} />
            <Space size={4}>
              <Text strong style={{ fontSize: 14 }}>{r.playerName}</Text>
              {isMe      && <StarFilled style={{ color: "#faad14", fontSize: 11 }} />}
              {r.isCaptain && <Tag color="gold" style={{ margin: 0, fontSize: 10, padding: "0 4px", lineHeight: "18px" }}>C</Tag>}
            </Space>
          </Space>
        );
      },
    },
    {
      title: "Status",
      key: "participationStatus",
      width: 160,
      render: (_, r) =>
        r.participationStatus === true  ? <Tag color="success">Participating</Tag>     :
        r.participationStatus === false ? <Tag color="error">Not Participating</Tag>   :
                                          <Tag color="warning">Pending</Tag>,
    },
    {
      title: "Action",
      key: "action",
      width: 120,
      render: (_, r) => {
        const canEdit =
          loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN") ||
          r.playerId === Number(loginInfo.userId);
        return (
          <Select
            value={r.participationStatus === true ? "true" : r.participationStatus === false ? "false" : "Select"}
            onChange={v => handleUpdate(r.playerId, editedComments[r.playerId] ?? r.comments ?? "", v === "true")}
            disabled={isUpdating || !canEdit}
            style={{ width: "100%" }}
            size="small"
          >
            <Option value="true"><Space><CheckCircleOutlined style={{ color: "#52c41a" }} />Yes</Space></Option>
            <Option value="false"><Space><CloseCircleOutlined style={{ color: "#ff4d4f" }} />No</Space></Option>
          </Select>
        );
      },
    },
    {
      title: "Comments",
      key: "comments",
      render: (_, r) => {
        const canEdit =
          loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN") ||
          r.playerId === Number(loginInfo.userId);
        return (
          <DebouncedInput
            isDisabled={!canEdit}
            placeholder="Add your comments here..."
            debounceDuration={1000}
            onChange={value => {
              setEditedComments(prev => ({ ...prev, [r.playerId]: value }));
              handleUpdate(r.playerId, value, r.participationStatus);
            }}
            value={editedComments[r.playerId] ?? r.comments ?? ""}
          />
        );
      },
    },
  ];

  const myStatusColor = statusBorderColor(loggedInPlayer?.participationStatus);

  // tint the "your status" strip slightly based on participation answer
  const statusStripBg =
    loggedInPlayer?.participationStatus === true  ? "rgba(82,196,26,0.06)"  :
    loggedInPlayer?.participationStatus === false ? "rgba(255,77,79,0.06)"  :
    "rgba(250,173,20,0.06)";

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card><Skeleton active paragraph={{ rows: 5 }} /></Card>
        <Card><Skeleton active paragraph={{ rows: 8 }} /></Card>
      </Space>
    );
  }

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>

      {/* ── 1. Three cards in one row ─────────────────────────────────── */}
      <Row gutter={[16, 16]} align="stretch">

        {/* ── Card 1: Match Summary ── */}
        <Col xs={24} md={12} lg={8}>
          <Card className="jt-card" style={{ height: "100%" }}
            styles={{ body: { padding: "16px 18px 14px" } }}>

            {/* Tournament name + date */}
            <div style={{ marginBottom: 12 }}>
              <Title level={4} style={{ margin: "0 0 3px", lineHeight: 1.2 }}>
                {nextTournament?.tournamentName}
              </Title>
              <Space size={5}>
                <CalendarOutlined style={{ color: token.colorTextSecondary, fontSize: 12 }} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {nextTournament?.tournamentDate && showBdLocalTime(nextTournament.tournamentDate)}
                </Text>
              </Space>
            </div>

            {/* Stat boxes */}
            <Row gutter={[8, 8]}>
              {[
                { value: players.length,                 color: "#1677ff", bg: "rgba(22,119,255,0.1)",  label: "Total"   },
                { value: participatingPlayers.length,    color: "#52c41a", bg: "rgba(82,196,26,0.12)",  label: "In"      },
                { value: notParticipatingPlayers.length, color: "#ff4d4f", bg: "rgba(255,77,79,0.1)",   label: "Out"     },
                { value: pendingPlayers.length,          color: "#faad14", bg: "rgba(250,173,20,0.1)",  label: "Pending" },
              ].map(({ value, color, bg, label }) => (
                <Col span={6} key={label}>
                  <div style={{
                    background: bg,
                    border: `1px solid ${color}30`,
                    borderRadius: 8,
                    padding: "8px 4px",
                    textAlign: "center",
                  }}>
                    <Text strong style={{ fontSize: 22, color, display: "block", lineHeight: 1.1 }}>{value}</Text>
                    <Text style={{ fontSize: 11, color, opacity: 0.85 }}>{label}</Text>
                  </div>
                </Col>
              ))}
            </Row>

            {/* Participation progress */}
            {players.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Participation</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {participatingPlayers.length} / {players.length} confirmed
                  </Text>
                </div>
                <Progress
                  percent={Math.round((participatingPlayers.length / players.length) * 100)}
                  strokeColor="#52c41a"
                  trailColor="rgba(255,255,255,0.08)"
                  showInfo={false}
                  size="small"
                />
              </div>
            )}

          </Card>
        </Col>

        {/* ── Card 2: Your Response (main action card) ── */}
        {loggedInPlayer ? (
          <Col xs={24} md={12} lg={8}>
            <Card className="jt-card jt-card--primary" style={{ height: "100%" }}
              styles={{ body: { padding: "16px 18px" } }}>

              {/* Identity row */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <Avatar
                  size={44}
                  src={toAbsolutePlayerPhotoUrl(loggedInPlayer.photoUrl)}
                  icon={!loggedInPlayer.photoUrl ? <UserOutlined /> : undefined}
                  style={{ backgroundColor: loggedInPlayer.photoUrl ? undefined : token.colorPrimary, flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Space size={5} align="center">
                    <Text strong style={{ fontSize: 15 }}>{loggedInPlayer.playerName}</Text>
                    <StarFilled style={{ color: "#faad14", fontSize: 12 }} />
                  </Space>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>ID: {loggedInPlayer.employeeId}</Text>
                    {loggedInPlayer.participationStatus === true  && <Tag color="success"  style={{ margin: 0, fontSize: 11 }}>Confirmed</Tag>}
                    {loggedInPlayer.participationStatus === false && <Tag color="error"    style={{ margin: 0, fontSize: 11 }}>Declined</Tag>}
                    {loggedInPlayer.participationStatus === null  && <Tag color="warning"  style={{ margin: 0, fontSize: 11 }}>Pending</Tag>}
                  </div>
                </div>
              </div>

              <Divider style={{ margin: "8px 0" }} />

              {/* Participation question */}
              <Text style={{ display: "block", fontWeight: 500, marginBottom: 8 }}>
                Are you participating?
              </Text>

              <Row gutter={10} style={{ marginBottom: 8 }}>
                <Col span={12}>
                  <Button block size="large"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleUpdate(loggedInPlayer.playerId, editedComments[loggedInPlayer.playerId] ?? loggedInPlayer.comments ?? "", true)}
                    disabled={isUpdating}
                    style={loggedInPlayer.participationStatus === true
                      ? { background: "#52c41a", borderColor: "#52c41a", color: "#fff", fontWeight: 600, boxShadow: "0 2px 8px #52c41a4d" }
                      : { background: "#52c41a14", borderColor: "#52c41a40", color: "#52c41a", fontWeight: 500 }
                    }
                  >
                    Yes, I'm in
                  </Button>
                </Col>
                <Col span={12}>
                  <Button block size="large"
                    icon={<CloseCircleOutlined />}
                    onClick={() => handleUpdate(loggedInPlayer.playerId, editedComments[loggedInPlayer.playerId] ?? loggedInPlayer.comments ?? "", false)}
                    disabled={isUpdating}
                    style={loggedInPlayer.participationStatus === false
                      ? { background: "#ff4d4f", borderColor: "#ff4d4f", color: "#fff", fontWeight: 600, boxShadow: "0 2px 8px #ff4d4f4d" }
                      : { background: "#ff4d4f14", borderColor: "#ff4d4f40", color: "#ff4d4f", fontWeight: 500 }
                    }
                  >
                    Can't make it
                  </Button>
                </Col>
              </Row>

              {/* Comment full-width below */}
              <DebouncedInput
                isDisabled={false}
                placeholder="Leave a comment (optional)..."
                debounceDuration={1000}
                onChange={value => {
                  setEditedComments(prev => ({ ...prev, [loggedInPlayer.playerId]: value }));
                  handleUpdate(loggedInPlayer.playerId, value, loggedInPlayer.participationStatus);
                }}
                value={editedComments[loggedInPlayer.playerId] ?? loggedInPlayer.comments ?? ""}
              />

            </Card>
          </Col>
        ) : (
          // Reserve the column even when no logged-in player
          <Col xs={0} lg={8} />
        )}

        {/* ── Card 3: Your Team ── */}
        <Col xs={24} md={12} lg={8}>
          <Card className="jt-card jt-team-card" style={{ height: "100%" }}
            styles={{ body: { padding: "16px 18px", height: "100%", display: "flex", flexDirection: "column" } }}>

            {/* Header row: title + compact status badge */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Space size={6} align="center">
                <TrophyOutlined style={{ fontSize: 15, color: "#faad14" }} />
                <Text strong style={{ fontSize: 13 }}>Your Team</Text>
              </Space>
              {loggedInPlayer?.participationStatus === true && (
                <span className="jt-status-badge jt-status-badge--success">
                  <CheckCircleFilled /> Attending
                </span>
              )}
              {loggedInPlayer?.participationStatus === false && (
                <span className="jt-status-badge jt-status-badge--error">
                  <CloseCircleOutlined /> Not Attending
                </span>
              )}
              {(loggedInPlayer?.participationStatus === null || !loggedInPlayer) && (
                <span className="jt-status-badge jt-status-badge--warning">
                  <ClockCircleOutlined /> Pending
                </span>
              )}
            </div>

            {/* Main focus: Goalkeeper Records */}
            <div className="jt-team-focus">
              <GoalKeeperDrawer
                tournamentId={tournamentId}
                triggerClassName="jt-team-focus-trigger"
                triggerIcon={<TrophyOutlined />}
              />
              <Text type="secondary" className="jt-team-helper">
                {loggedInPlayer?.participationStatus === true
                  ? "You're confirmed — check back here for your team assignment."
                  : loggedInPlayer?.participationStatus === false
                  ? "You are currently marked as unavailable for this match."
                  : "Awaiting your response — let us know if you're in."}
              </Text>
            </div>

            <Button type="primary" icon={<TeamOutlined />} block style={{ marginTop: 12 }}
              onClick={() => navigate(`/tournaments/team-building/${tournamentId}`)}>
              View Team
            </Button>

          </Card>
        </Col>

      </Row>

      {/* ── 3. Participants Table ────────────────────────────────────── */}
      <Card styles={{ body: { padding: "16px 20px 24px" } }}>

        {/* Controls — title row */}
        <Row gutter={[12, 8]} align="middle" style={{ marginBottom: 12 }}>
          <Col xs={24} sm={12}>
            <Space align="center" size={8}>
              <TeamOutlined style={{ fontSize: 15 }} />
              <Title level={4} style={{ margin: 0 }}>Tournament Participants</Title>
              <Tag>{players.length}</Tag>
            </Space>
          </Col>
          <Col xs={24} sm={12} style={{ display: "flex", justifyContent: screens.sm ? "flex-end" : "flex-start" }}>
            <Space size={8} wrap>
              <Select value={sortBy} onChange={setSortBy} size="small" style={{ width: 130 }}>
                <Option value="name">Sort by Name</Option>
                <Option value="employeeId">Sort by ID</Option>
                <Option value="status">Sort by Status</Option>
              </Select>
              <Segmented
                size="small"
                value={participationFilter}
                onChange={v => setParticipationFilter(v as ParticipationFilter)}
                options={[
                  { label: "All",     value: "all"               },
                  { label: "In",      value: "participating"     },
                  { label: "Pending", value: "pending"           },
                  { label: "Out",     value: "not-participating" },
                ]}
              />
            </Space>
          </Col>
        </Row>

        {/* Search row */}
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search by name or employee ID..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            allowClear
            style={{ maxWidth: 360 }}
          />
          {searchTerm && (
            <Text type="secondary" style={{ marginLeft: 12, fontSize: 12 }}>
              {filteredTableData.length} result(s)
            </Text>
          )}
        </div>

        <Table
          columns={columns}
          dataSource={filteredTableData}
          size="middle"
          bordered
          pagination={{
            pageSize: 25,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} players`,
          }}
          scroll={{ x: "max-content" }}
          loading={isUpdating}
          locale={{ emptyText: "No players found" }}
          rowClassName={r =>
            r.playerId === Number(loginInfo.userId) ? "logged-in-player-row" : ""
          }
        />
      </Card>

    </Space>
  );
}
