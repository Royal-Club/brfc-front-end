import React from "react";
import { Typography, Button, Space, Empty, Spin, Steps, Row, Col, Tooltip, Collapse, Dropdown } from "antd";
import type { MenuProps } from "antd";
import {
  FireOutlined,
  TeamOutlined,
  SettingOutlined,
  UserAddOutlined,
  TrophyOutlined,
  PlayCircleOutlined,
  EnvironmentOutlined,
  SolutionOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useGetTournamentsQuery } from "../../state/features/tournaments/tournamentsSlice";
import { useGetAuctionSessionQuery, useGetAuctionSettingsQuery, useGetAuctionDashboardQuery } from "../../state/features/auction/auctionSlice";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { IoTournamentSingleSummaryType } from "../../state/features/tournaments/tournamentTypes";
import { AuctionPage, AuctionHeader, PanelCard, StatusPill, ac } from "./AuctionAtoms";

const { Text } = Typography;

const TournamentAuctionCard: React.FC<{ tournament: IoTournamentSingleSummaryType; isAdmin: boolean }> = ({
  tournament,
  isAdmin,
}) => {
  const navigate = useNavigate();
  // Poll the session so the hub reflects live state without a manual refresh.
  const { data: session } = useGetAuctionSessionQuery(tournament.id, { pollingInterval: 15000 });
  const { data: settings } = useGetAuctionSettingsQuery(tournament.id);
  const isLive = session?.status === "RUNNING" || session?.status === "PAUSED";
  // Only pull live counts while the auction is actually running.
  const { data: dashboard } = useGetAuctionDashboardQuery(tournament.id, {
    skip: !isLive,
    pollingInterval: isLive ? 10000 : 0,
  });

  const registrationClosed = session?.status === "COMPLETED";
  const notStarted = !session?.status || session.status === "NOT_STARTED";
  const scheduled = settings?.scheduledStartTime ? new Date(settings.scheduledStartTime) : null;
  const accent = session?.status === "RUNNING" ? ac.pitch : ac.gold;

  const adminMenu: MenuProps = {
    items: [
      { key: "settings", icon: <SettingOutlined />, label: "Settings" },
      { key: "players", icon: <TeamOutlined />, label: "Player Pool" },
      { key: "team-budgets", icon: <TrophyOutlined />, label: "Team Budgets" },
      { key: "registrations", icon: <SolutionOutlined />, label: "Registrations" },
    ],
    onClick: ({ key }) => navigate(`/auction/${key}/${tournament.id}`),
  };

  return (
    <PanelCard accent={accent} bodyStyle={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Status row + admin menu */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <Space size={6} wrap>
          <StatusPill status={tournament.tournamentStatus || "UPCOMING"} />
          {session?.status === "RUNNING" ? (
            <span className="auction-live-chip">Live</span>
          ) : (
            session?.status && <StatusPill status={session.status} />
          )}
        </Space>
        {isAdmin && (
          <Dropdown menu={adminMenu} trigger={["click"]} placement="bottomRight">
            <Button type="text" size="small" icon={<MoreOutlined />} style={{ color: ac.textMuted }} aria-label="Manage auction" />
          </Dropdown>
        )}
      </div>

      {/* Name */}
      <Text
        strong
        ellipsis={{ tooltip: tournament.name }}
        style={{ fontSize: 17, color: ac.textPrimary, lineHeight: 1.3 }}
      >
        {tournament.name}
      </Text>

      {/* Venue */}
      <Space size={8}>
        <EnvironmentOutlined style={{ color: ac.gold, fontSize: 13 }} />
        <Text style={{ fontSize: 12.5, color: ac.textMuted }} ellipsis={{ tooltip: tournament.venueName }}>
          {tournament.venueName || "—"}
        </Text>
      </Space>

      {/* Scheduled start (before it begins) */}
      {notStarted && scheduled && (
        <Space size={8}>
          <ClockCircleOutlined style={{ color: ac.gold, fontSize: 13 }} />
          <Text style={{ fontSize: 12.5, color: ac.textMuted }}>
            Starts {scheduled.toLocaleString()}
          </Text>
        </Space>
      )}

      {/* Live mini-stats */}
      {isLive && dashboard && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12 }}>
          <Text style={{ color: ac.textMuted }}>Round <Text strong style={{ color: ac.gold }}>{session?.roundNumber ?? 1}</Text></Text>
          <Text style={{ color: ac.textMuted }}>Sold <Text strong style={{ color: ac.pitch }}>{dashboard.soldCount ?? 0}</Text></Text>
          <Text style={{ color: ac.textMuted }}>Left <Text strong style={{ color: ac.info }}>{dashboard.remainingCount ?? 0}</Text></Text>
        </div>
      )}

      {/* Primary actions */}
      <Space wrap size={8} style={{ marginTop: 2 }}>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => navigate(`/auction/live/${tournament.id}`)}
          style={isLive ? { background: ac.pitch, borderColor: ac.pitch } : undefined}
        >
          {isLive ? "Watch Live" : "Live Auction"}
        </Button>
        <Tooltip title={registrationClosed ? "Auction is completed. Registration is closed." : undefined}>
          <Button
            icon={<UserAddOutlined />}
            onClick={() => navigate(`/auction/register/${tournament.id}`)}
            disabled={registrationClosed}
          >
            Register
          </Button>
        </Tooltip>
        <Button icon={<TrophyOutlined />} onClick={() => navigate(`/auction/results/${tournament.id}`)}>
          Results
        </Button>
      </Space>
    </PanelCard>
  );
};

const AuctionHubPage: React.FC = () => {
  const loginInfo = useSelector(selectLoginInfo);
  const isAdmin = loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN");

  const { data: tournamentsData, isLoading } = useGetTournamentsQuery({
    offSet: 0,
    pageSize: 50,
    sortedBy: "tournamentDate",
    sortDirection: "DESC",
  });

  const auctionTournaments =
    tournamentsData?.content?.tournaments?.filter((t: IoTournamentSingleSummaryType) => t.auctionMode) || [];

  if (isLoading) return <Spin tip="Loading tournaments..." style={{ display: "block", margin: "100px auto" }} />;

  return (
    <AuctionPage>
      <AuctionHeader
        icon={<FireOutlined />}
        title="Auction Hub"
        subtitle="Select a tournament to manage or participate in its player auction."
      />

      {/* Tournaments first — the primary content */}
      {auctionTournaments.length === 0 ? (
        <PanelCard>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text style={{ color: ac.textMuted }}>
                No auction-mode tournaments found. Create one from the Tournaments page with 'Auction Mode' enabled.
              </Text>
            }
          />
        </PanelCard>
      ) : (
        <Row gutter={[16, 16]}>
          {auctionTournaments.map((tournament: IoTournamentSingleSummaryType) => (
            <Col key={tournament.id} xs={24} md={12} xl={8}>
              <TournamentAuctionCard tournament={tournament} isAdmin={isAdmin} />
            </Col>
          ))}
        </Row>
      )}

      {/* Admin quick guide — collapsed by default so it stays out of the way */}
      {isAdmin && (
        <Collapse
          className="auction-guide-collapse"
          expandIconPosition="end"
          items={[
            {
              key: "guide",
              label: (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                  <BulbOutlined style={{ color: ac.gold }} />
                  Admin Quick Guide — how to run an auction
                </span>
              ),
              children: (
                <Steps
                  size="small"
                  direction="vertical"
                  items={[
                    { title: "Create Tournament", description: "Toggle 'Auction Mode' ON when creating" },
                    { title: "Configure Settings", description: "Set team budget, timer, bid increment, squad size" },
                    { title: "Open Registrations", description: "Share the registration link with players" },
                    { title: "Approve & Build Pool", description: "Approve registrations → Add to player pool" },
                    { title: "Set Team Budgets", description: "Assign teams, owners, and budgets" },
                    { title: "Start Live Auction", description: "Go to Live Auction and click Start" },
                  ]}
                />
              ),
            },
          ]}
        />
      )}
    </AuctionPage>
  );
};

export default AuctionHubPage;
