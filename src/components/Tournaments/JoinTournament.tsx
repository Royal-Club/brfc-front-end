import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Select, Typography, Space, Skeleton, Input, Grid, theme, Card,
  Row, Col, Button, Table, Segmented, Avatar, Tag, Divider, Progress,
  Modal, List,
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
import { club, kicker, scoreNum } from "../../theme/clubTheme";
import useIsMobile from "../../hooks/useIsMobile";

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
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus]       = useState<"in" | "out" | "pending" | null>(null);
  const screens = useBreakpoint();
  const isMobileTable = useIsMobile(768);

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
              style={{ backgroundColor: photoUrl ? undefined : (isMe ? token.colorPrimary : "#14213d"), flexShrink: 0 }} />
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

  // ── Stat-box modal helpers ──────────────────────────────────────────────
  const openStatusModal = (status: "in" | "out" | "pending") => {
    setSelectedStatus(status);
    setIsStatusModalOpen(true);
  };

  const selectedPlayers =
    selectedStatus === "in"      ? participatingPlayers    :
    selectedStatus === "out"     ? notParticipatingPlayers :
    selectedStatus === "pending" ? pendingPlayers          :
    [];

  const getModalTitle = () =>
    selectedStatus === "in"      ? "Participating Players"     :
    selectedStatus === "out"     ? "Not Participating Players" :
    selectedStatus === "pending" ? "Pending Players"           :
    "";

  const chunkSize = 10;
  const playerColumns: TournamentPlayerInfoType[][] = [];
  for (let i = 0; i < selectedPlayers.length; i += chunkSize) {
    playerColumns.push(selectedPlayers.slice(i, i + chunkSize));
  }
  const modalWidth = Math.min(Math.max(360, playerColumns.length * 270 + 64), 980);

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
          <Card className="jt-card jt-card--panel" style={{ height: "100%" }}
            styles={{ body: { padding: "16px 18px 16px" } }}>

            {/* Matchday header: name + date */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ ...kicker, color: club.gold, marginBottom: 2 }}>⚽ Matchday</div>
              <Title level={4} style={{ margin: "0 0 2px", lineHeight: 1.15, color: club.textPrimary }}>
                {nextTournament?.tournamentName}
              </Title>
              <Space size={5}>
                <CalendarOutlined style={{ color: club.gold, fontSize: 12 }} />
                <Text style={{ fontSize: 12, color: club.textMuted, ...scoreNum }}>
                  {nextTournament?.tournamentDate && showBdLocalTime(nextTournament.tournamentDate)}
                </Text>
              </Space>
            </div>

            {/* Stat boxes */}
            <Row gutter={[8, 8]}>
              {([
                { value: players.length,                 color: token.colorInfo,    label: "Total",   status: null      },
                { value: participatingPlayers.length,    color: "#52c41a",          label: "In",      status: "in"      },
                { value: notParticipatingPlayers.length, color: "#ff4d4f",          label: "Out",     status: "out"     },
                { value: pendingPlayers.length,          color: "#faad14",          label: "Pending", status: "pending" },
              ] as const).map(({ value, color, label, status }) => {
                const clickable = status !== null;
                return (
                  <Col xs={12} sm={6} key={label}>
                    <div
                      style={{
                        background: `${color}22`,
                        border: `1px solid ${color}45`,
                        borderRadius: 8,
                        padding: "10px 4px",
                        textAlign: "center",
                        cursor: clickable ? "pointer" : "default",
                        transition: "all 0.2s ease",
                      }}
                      onClick={clickable ? () => openStatusModal(status) : undefined}
                      role={clickable ? "button" : undefined}
                      tabIndex={clickable ? 0 : undefined}
                      onKeyDown={clickable ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openStatusModal(status);
                        }
                      } : undefined}
                    >
                      <Text strong style={{ fontSize: 24, color, display: "block", lineHeight: 1.1, ...scoreNum }}>{value}</Text>
                      <Text style={{ ...kicker, fontSize: 10, color, opacity: 0.95 }}>{label}</Text>
                    </div>
                  </Col>
                );
              })}
            </Row>

            {/* Participation progress */}
            {players.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <Text style={{ ...kicker, fontSize: 10, color: club.goldSoft }}>Squad Filled</Text>
                  <Text style={{ fontSize: 12, color: club.textPrimary, ...scoreNum }}>
                    {participatingPlayers.length} / {players.length}
                  </Text>
                </div>
                <Progress
                  percent={Math.round((participatingPlayers.length / players.length) * 100)}
                  strokeColor={{ from: club.pitch, to: "#43c46f" }}
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
            <Card className="jt-card jt-card--panel jt-card--primary" style={{ height: "100%" }}
              styles={{ body: { padding: "16px 18px" } }}>

              {/* Identity row */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <Avatar
                  size={46}
                  src={toAbsolutePlayerPhotoUrl(loggedInPlayer.photoUrl)}
                  icon={!loggedInPlayer.photoUrl ? <UserOutlined /> : undefined}
                  style={{ backgroundColor: loggedInPlayer.photoUrl ? undefined : token.colorPrimary, flexShrink: 0, border: `2px solid ${club.gold}` }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Space size={5} align="center">
                    <Text strong style={{ fontSize: 15, color: club.textPrimary }}>{loggedInPlayer.playerName}</Text>
                    <StarFilled style={{ color: club.gold, fontSize: 12 }} />
                  </Space>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                    <Text style={{ fontSize: 12, color: club.textMuted, ...scoreNum }}>ID: {loggedInPlayer.employeeId}</Text>
                    {loggedInPlayer.participationStatus === true  && <Tag color="success"  style={{ margin: 0, fontSize: 11 }}>Confirmed</Tag>}
                    {loggedInPlayer.participationStatus === false && <Tag color="error"    style={{ margin: 0, fontSize: 11 }}>Declined</Tag>}
                    {loggedInPlayer.participationStatus === null  && <Tag color="warning"  style={{ margin: 0, fontSize: 11 }}>Pending</Tag>}
                  </div>
                </div>
              </div>

              <Divider style={{ margin: "8px 0", borderColor: club.panelBorder }} />

              {/* Participation question */}
              <Text style={{ ...kicker, display: "block", fontSize: 10, color: club.goldSoft, marginBottom: 8 }}>
                Are you participating?
              </Text>

              <Row gutter={10} style={{ marginBottom: 8 }}>
                <Col span={12}>
                  <Button block size="large"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleUpdate(loggedInPlayer.playerId, editedComments[loggedInPlayer.playerId] ?? loggedInPlayer.comments ?? "", true)}
                    disabled={isUpdating}
                    style={loggedInPlayer.participationStatus === true
                      ? { background: club.pitch, borderColor: club.pitch, color: "#fff", fontWeight: 600, boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }
                      : { background: "rgba(255,255,255,0.03)", borderColor: `${club.pitch}55`, color: club.pitch, fontWeight: 500 }
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
                      ? { background: "#ff4d4f", borderColor: "#ff4d4f", color: "#fff", fontWeight: 600, boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }
                      : { background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.18)", color: club.textMuted, fontWeight: 500 }
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
          <Card className="jt-card jt-card--panel jt-team-card" style={{ height: "100%" }}
            styles={{ body: { padding: "16px 18px", height: "100%", display: "flex", flexDirection: "column" } }}>

            {/* Header row: title + compact status badge */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Space size={6} align="center">
                <TrophyOutlined style={{ fontSize: 15, color: club.gold }} />
                <Text style={{ ...kicker, fontSize: 11, color: club.goldSoft }}>Your Team</Text>
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
              <Text className="jt-team-helper" style={{ color: club.textMuted }}>
                {loggedInPlayer?.participationStatus === true
                  ? "You're confirmed — check back here for your team assignment."
                  : loggedInPlayer?.participationStatus === false
                  ? "You are currently marked as unavailable for this match."
                  : "Awaiting your response — let us know if you're in."}
              </Text>
            </div>

            <Button icon={<TeamOutlined />} block
              style={{
                marginTop: 12,
                height: 40,
                fontWeight: 700,
                letterSpacing: 0.3,
                background: `linear-gradient(135deg, ${club.goldSoft} 0%, ${club.gold} 100%)`,
                border: "none",
                color: club.navyDeep,
                boxShadow: "0 2px 10px rgba(198, 161, 91, 0.35)",
              }}
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

        {isMobileTable ? (
          filteredTableData.length === 0 ? (
            <Text type="secondary">No players found</Text>
          ) : (
            <Space direction="vertical" size={10} style={{ width: "100%" }}>
              {filteredTableData.map(r => {
                const isMe = r.playerId === Number(loginInfo.userId);
                const canEdit =
                  loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN") ||
                  isMe;
                const photoUrl = toAbsolutePlayerPhotoUrl(r.photoUrl);
                const statusTag =
                  r.participationStatus === true  ? <Tag color="success">Participating</Tag>   :
                  r.participationStatus === false ? <Tag color="error">Not Participating</Tag> :
                                                    <Tag color="warning">Pending</Tag>;
                return (
                  <div
                    key={r.key}
                    className={isMe ? "jt-mplayer-card jt-mplayer-card--me" : "jt-mplayer-card"}
                  >
                    {/* Identity + status */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <Avatar size={36} src={photoUrl} icon={!photoUrl ? <UserOutlined /> : undefined}
                        style={{ backgroundColor: photoUrl ? undefined : (isMe ? token.colorPrimary : "#14213d"), flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Space size={5} align="center" wrap>
                          <Text strong style={{ fontSize: 14 }}>{r.playerName}</Text>
                          {isMe && <StarFilled style={{ color: "#faad14", fontSize: 11 }} />}
                          {r.isCaptain && <Tag color="gold" style={{ margin: 0, fontSize: 10, padding: "0 4px", lineHeight: "18px" }}>C</Tag>}
                        </Space>
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>ID: {r.employeeId}</Text>
                        </div>
                      </div>
                      {statusTag}
                    </div>

                    {/* Action + comments */}
                    <Row gutter={8} align="middle">
                      <Col span={9}>
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
                      </Col>
                      <Col span={15}>
                        <DebouncedInput
                          isDisabled={!canEdit}
                          placeholder="Add your comments..."
                          debounceDuration={1000}
                          onChange={value => {
                            setEditedComments(prev => ({ ...prev, [r.playerId]: value }));
                            handleUpdate(r.playerId, value, r.participationStatus);
                          }}
                          value={editedComments[r.playerId] ?? r.comments ?? ""}
                        />
                      </Col>
                    </Row>
                  </div>
                );
              })}
            </Space>
          )
        ) : (
          <Table
            className="jt-participants-table"
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
        )}
      </Card>

      {/* ── Stat-box player list modal ───────────────────────────────── */}
      <Modal
        title={getModalTitle()}
        open={isStatusModalOpen}
        onCancel={() => setIsStatusModalOpen(false)}
        footer={null}
        width={modalWidth}
        styles={{
          content: {
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorder}`,
            borderRadius: 12,
          },
          header: {
            background: "transparent",
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            marginBottom: 12,
          },
          body: { background: "transparent" },
        }}
      >
        {selectedPlayers.length === 0 ? (
          <Text type="secondary">No players found for this status.</Text>
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              alignItems: "flex-start",
              justifyContent: playerColumns.length === 1 ? "center" : "flex-start",
              paddingBottom: 4,
            }}
          >
            {playerColumns.map((columnPlayers, columnIndex) => (
              <div
                key={`column-${columnIndex}`}
                style={{
                  minWidth: 240,
                  flex: "0 0 240px",
                  border: `1px solid ${token.colorBorder}`,
                  borderRadius: 8,
                  padding: "8px 10px",
                  background: token.colorBgElevated,
                }}
              >
                <Text
                  type="secondary"
                  style={{ display: "block", fontSize: 12, marginBottom: 8 }}
                >
                  Players {columnIndex * 10 + 1} - {columnIndex * 10 + columnPlayers.length}
                </Text>

                <List
                  size="small"
                  dataSource={columnPlayers}
                  renderItem={(player) => (
                    <List.Item
                      style={{
                        padding: "8px 0",
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            size="small"
                            src={toAbsolutePlayerPhotoUrl(player.photoUrl)}
                            icon={!player.photoUrl ? <UserOutlined /> : undefined}
                            style={{
                              background: player.photoUrl ? undefined : token.colorPrimaryBg,
                              color: token.colorPrimary,
                            }}
                          />
                        }
                        title={
                          <span style={{ fontSize: 13, color: token.colorText, fontWeight: 600 }}>
                            {player.playerName}
                          </span>
                        }
                        description={
                          <span style={{ color: token.colorTextSecondary }}>
                            ID: {player.employeeId}
                          </span>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            ))}
          </div>
        )}
      </Modal>

    </Space>
  );
}
