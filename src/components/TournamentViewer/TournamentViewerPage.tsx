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

  const { data: tournamentsData, isLoading: tournamentsLoading } = useGetTournamentsQuery({
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
        (statusOrder[b.tournamentStatus?.toUpperCase() ?? ""] ?? 5)
    );
  }, [tournamentsData]);

  const selectedTournament = useMemo(
    () => tournaments.find((t) => t.id === selectedId) || null,
    [selectedId, tournaments]
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
          <CalendarOutlined />
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
          <CheckCircleOutlined />
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
          <UnorderedListOutlined />
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
          <BarChartOutlined />
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
          <TeamOutlined />
          Players
        </span>
      ),
      children: selectedId ? (
        <ViewerPlayersTab tournamentId={selectedId} />
      ) : null,
    },
  ];

  return (
    <Layout style={{ height: "100%", minHeight: hasHeader ? "calc(100vh - 64px)" : "100vh" }}>
      {/* Content */}
      <Content style={{ overflow: "auto", display: "flex", flexDirection: "column" }}>
        <div
          style={{
            padding: "12px 20px 8px",
            borderBottom: `1px solid ${token.colorBorder}`,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: VIEWER_CONTENT_MAX_WIDTH,
              margin: "0 auto",
              position: "relative",
              minHeight: isMobile ? undefined : 48,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <Title level={4} style={{ margin: 0, color: "#ffffff" }}>
                {selectedTournament?.name || "Select Tournament"}
              </Title>
              {selectedTournament && (
                <Space
                  size={8}
                  wrap
                  style={{ marginTop: 4, justifyContent: "center", display: "flex" }}
                >
                  {selectedTournament.tournamentStatus && (
                    <Tag color={isSelectedTournamentLive ? "success" : "default"} style={{ margin: 0 }}>
                      {selectedTournament.tournamentStatus.toUpperCase()}
                    </Tag>
                  )}
                  {selectedTournament.tournamentDate && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <CalendarOutlined style={{ marginRight: 4 }} />
                      {new Date(selectedTournament.tournamentDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  )}
                  {selectedTournament.venueName && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      @ {selectedTournament.venueName}
                    </Text>
                  )}
                </Space>
              )}
            </div>

            <div
              style={{
                position: isMobile ? "static" : "absolute",
                right: 0,
                top: isMobile ? undefined : "50%",
                transform: isMobile ? undefined : "translateY(-50%)",
                display: "flex",
                justifyContent: isMobile ? "center" : "flex-end",
                marginTop: isMobile ? 12 : 0,
              }}
            >
              <Select
                className="tournament-portal-select"
                showSearch
                loading={tournamentsLoading}
                placeholder="Select tournament"
                value={selectedId ?? undefined}
                onChange={handleSelect}
                suffixIcon={<DownOutlined style={{ color: "#08341f" }} />}
                style={{ width: isMobile ? "100%" : 250 }}
                optionFilterProp="label"
                options={tournaments.map((t) => ({
                  value: t.id,
                  label: `${t.name} (${(t.tournamentStatus || "UNKNOWN").toUpperCase()})`,
                }))}
              />
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
              image={<TrophyOutlined style={{ fontSize: 64, color: "#d4af37" }} />}
              imageStyle={{ height: 64 }}
              description={
                <span>
                  <Text type="secondary">
                    Select a tournament from the dropdown to view fixtures, results,
                    standings and stats
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
