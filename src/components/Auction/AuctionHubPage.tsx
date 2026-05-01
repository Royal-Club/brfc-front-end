import React from "react";
import { Card, Typography, List, Tag, Button, Space, Empty, Spin, Steps, Badge } from "antd";
import { FireOutlined, TeamOutlined, SettingOutlined, UserAddOutlined, TrophyOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useGetTournamentsQuery } from "../../state/features/tournaments/tournamentsSlice";
import { useGetAuctionSessionQuery } from "../../state/features/auction/auctionSlice";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { IoTournamentSingleSummaryType } from "../../state/features/tournaments/tournamentTypes";

const { Title, Text, Paragraph } = Typography;

const SESSION_STATUS_BADGE: Record<string, React.ReactElement> = {
  RUNNING: <Badge status="processing" text="LIVE" />,
  PAUSED: <Badge status="warning" text="PAUSED" />,
  COMPLETED: <Badge status="success" text="COMPLETED" />,
  NOT_STARTED: <Badge status="default" text="NOT STARTED" />,
};

const TournamentAuctionCard: React.FC<{ tournament: IoTournamentSingleSummaryType; isAdmin: boolean }> = ({ tournament, isAdmin }) => {
  const navigate = useNavigate();
  const { data: session } = useGetAuctionSessionQuery(tournament.id, {
    // Skip if we can't get session — just show nothing for status
  });
  const sessionBadge = session?.status ? SESSION_STATUS_BADGE[session.status] : null;

  return (
    <Card style={{ width: "100%" }} size="small">
      <Space direction="vertical" style={{ width: "100%" }}>
        <Space style={{ justifyContent: "space-between", width: "100%" }}>
          <Space>
            <TrophyOutlined />
            <Text strong style={{ fontSize: 16 }}>{tournament.name}</Text>
            <Tag color="orange">{tournament.tournamentStatus || "UPCOMING"}</Tag>
            <Tag color="magenta">Auction Mode</Tag>
            {sessionBadge}
          </Space>
          <Text type="secondary">{tournament.venueName}</Text>
        </Space>

        <Space wrap>
          <Button
            icon={<UserAddOutlined />}
            onClick={() => navigate(`/auction/register/${tournament.id}`)}
          >
            Register for Auction
          </Button>
          <Button
            icon={<PlayCircleOutlined />}
            type="primary"
            onClick={() => navigate(`/auction/live/${tournament.id}`)}
          >
            Live Auction
          </Button>
          <Button
            icon={<TrophyOutlined />}
            onClick={() => navigate(`/auction/results/${tournament.id}`)}
          >
            Results
          </Button>
          {isAdmin && (
            <>
              <Button
                icon={<SettingOutlined />}
                onClick={() => navigate(`/auction/settings/${tournament.id}`)}
              >
                Settings
              </Button>
              <Button
                icon={<TeamOutlined />}
                onClick={() => navigate(`/auction/players/${tournament.id}`)}
              >
                Player Pool
              </Button>
              <Button
                onClick={() => navigate(`/auction/team-budgets/${tournament.id}`)}
              >
                Team Budgets
              </Button>
              <Button
                onClick={() => navigate(`/auction/registrations/${tournament.id}`)}
              >
                Registrations
              </Button>
            </>
          )}
        </Space>
      </Space>
    </Card>
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

  const auctionTournaments = tournamentsData?.content?.tournaments?.filter(
    (t: IoTournamentSingleSummaryType) => t.auctionMode
  ) || [];

  if (isLoading) return <Spin tip="Loading tournaments..." style={{ display: "block", margin: "100px auto" }} />;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <Title level={3}><FireOutlined /> Auction Hub</Title>
      <Paragraph type="secondary">
        Select a tournament to manage or participate in its player auction.
      </Paragraph>

      {isAdmin && (
        <Card size="small" style={{ marginBottom: 24, background: "rgba(24,144,255,0.05)" }}>
          <Title level={5}>Admin Quick Guide</Title>
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
        </Card>
      )}

      {auctionTournaments.length === 0 ? (
        <Empty description="No auction-mode tournaments found. Create one from Tournaments page with 'Auction Mode' enabled." />
      ) : (
        <List
          dataSource={auctionTournaments}
          renderItem={(tournament: IoTournamentSingleSummaryType) => (
            <List.Item>
              <TournamentAuctionCard tournament={tournament} isAdmin={isAdmin} />
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default AuctionHubPage;
