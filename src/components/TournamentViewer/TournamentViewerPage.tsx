import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Empty,
  Grid,
  Layout,
  Select,
  Space,
  Tabs,
  Tag,
  Typography,
  theme,
} from "antd";
import {
  BarChartOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  DownOutlined,
  TeamOutlined,
  TrophyOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import ViewerFixturesTab from "./ViewerFixturesTab";
import ViewerResultsTab from "./ViewerResultsTab";
import ViewerTableTab from "./ViewerTableTab";
import ViewerPlayersTab from "./ViewerPlayersTab";
import StatsLeaderboardPanel from "../Tournaments/Statistics/StatsLeaderboardPanel";
import { useGetTournamentsQuery } from "../../state/features/tournaments/tournamentsSlice";
import { Link } from "react-router-dom";

const { Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const VIEWER_CONTENT_MAX_WIDTH = 1180;

const statusOrder: Record<string, number> = {
  ONGOING: 0,
  ACTIVE: 1,
  UPCOMING: 2,
  CONCLUDED: 3,
  INACTIVE: 4,
};

export default function TournamentViewerPage({
  hasHeader = true,
}: {
  hasHeader?: boolean;
}) {
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("fixtures");

  const { data: tournamentsData, isLoading: tournamentsLoading } =
    useGetTournamentsQuery({
      offSet: 0,
      pageSize: 200,
      sortedBy: "tournamentDate",
      sortDirection: "DESC",
    });

  const tournaments = useMemo(() => {
    const list = tournamentsData?.content?.tournaments || [];
    return [...list].sort(
      (a, b) =>
        (statusOrder[a.tournamentStatus?.toUpperCase() ?? ""] ?? 5) -
        (statusOrder[b.tournamentStatus?.toUpperCase() ?? ""] ?? 5),
    );
  }, [tournamentsData]);

  const selectedTournament = useMemo(
    () => tournaments.find((t) => t.id === selectedId) || null,
    [selectedId, tournaments],
  );

  const isSelectedTournamentLive =
    selectedTournament?.tournamentStatus?.toUpperCase() === "ONGOING" ||
    selectedTournament?.tournamentStatus?.toUpperCase() === "ACTIVE";

  useEffect(() => {
    if (!selectedId && tournaments.length > 0) {
      setSelectedId(tournaments[0].id);
    }
  }, [selectedId, tournaments]);

  const handleSelect = (id: number) => {
    setSelectedId(id);
    setActiveTab("fixtures");
  };

  const tabItems = [
    {
      key: "fixtures",
      label: (
        <span>
          <CalendarOutlined style={{ marginRight: 6 }} />
          Fixtures
        </span>
      ),
      children: selectedId ? (
        <ViewerFixturesTab tournamentId={selectedId} />
      ) : null,
    },
    {
      key: "results",
      label: (
        <span>
          <CheckCircleOutlined style={{ marginRight: 6 }} />
          Results
        </span>
      ),
      children: selectedId ? (
        <ViewerResultsTab tournamentId={selectedId} />
      ) : null,
    },
    {
      key: "table",
      label: (
        <span>
          <UnorderedListOutlined style={{ marginRight: 6 }} />
          Table
        </span>
      ),
      children: selectedId ? (
        <ViewerTableTab tournamentId={selectedId} />
      ) : null,
    },
    {
      key: "stats",
      label: (
        <span>
          <BarChartOutlined style={{ marginRight: 6 }} />
          Stats
        </span>
      ),
      children: selectedId ? (
        <StatsLeaderboardPanel
          tournamentId={selectedId}
          isActive={activeTab === "stats"}
        />
      ) : null,
    },
    {
      key: "players",
      label: (
        <span>
          <TeamOutlined style={{ marginRight: 6 }} />
          Players
        </span>
      ),
      children: selectedId ? (
        <ViewerPlayersTab tournamentId={selectedId} />
      ) : null,
    },
  ];

  return (
    <Layout
      style={{
        height: "100%",
        minHeight: hasHeader ? "calc(100vh - 64px)" : "100vh",
      }}
    >
      {/* Content */}
      <Content
        style={{ overflow: "auto", display: "flex", flexDirection: "column" }}
      >
        <div
          style={{
            padding: isMobile ? "12px 16px" : "16px 24px",
            background: "#0a0a0a",
            borderBottom: "1px solid #1f1f1f",
            color: "#ffffff",
          }}
        >
          <div
            style={{
              maxWidth: 1300,
              margin: "0 auto",
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "flex-start" : "center",
              justifyContent: "space-between",
              gap: isMobile ? "12px" : "16px",
            }}
          >
            {/* Left: Branding */}
            {!isMobile && (
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "1.25rem",
                  letterSpacing: "1px",
                  flex: "1",
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {selectedTournament?.name || "Select Tournament"}
              </div>
            )}

            {/* Right: Select & Login */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                width: isMobile ? "100%" : "auto",
              }}
            >
              <Select
                className="tournament-portal-select-custom"
                showSearch
                loading={tournamentsLoading}
                placeholder="Select tournament"
                value={selectedId ?? undefined}
                onChange={handleSelect}
                suffixIcon={<DownOutlined />}
                style={{
                  width: isMobile ? "100%" : 250,
                  flex: isMobile ? 1 : "none",
                }}
                optionFilterProp="label"
                options={tournaments.map((t) => ({
                  value: t.id,

                  label: `${t.name} (${(t.tournamentStatus || "UNKNOWN").toUpperCase()})`,
                }))}
              />
              <Link to="/login">
                <button
                  className="tournament-login-button"
                  style={{
                    whiteSpace: "nowrap",
                    minWidth: isMobile ? "80px" : "auto",
                  }}
                >
                  LOGIN
                </button>
              </Link>
            </div>
          </div>
        </div>

        {selectedId ? (
          <>
            <div style={{ padding: "0 20px", flex: 1 }}>
              <div
                style={{
                  maxWidth: VIEWER_CONTENT_MAX_WIDTH,
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  items={tabItems}
                  centered
                  className="tournament-viewer-tabs"
                  size={isMobile ? "small" : "middle"}
                  style={{ marginTop: 4 }}
                />
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Empty
              image={
                <TrophyOutlined style={{ fontSize: 64, color: "#d4af37" }} />
              }
              imageStyle={{ height: 64 }}
              description={
                <span>
                  <Text type="secondary">
                    Select a tournament from the dropdown to view fixtures,
                    results, standings and stats
                  </Text>
                </span>
              }
            />
          </div>
        )}
      </Content>
    </Layout>
  );
}
