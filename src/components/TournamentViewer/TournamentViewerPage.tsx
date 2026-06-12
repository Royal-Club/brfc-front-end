import React, { useEffect, useMemo, useState } from "react";
import { Empty, Grid, Layout, Select, Space, Tabs, Typography } from "antd";
import {
  BarChartOutlined,
  BookOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  DownOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  TeamOutlined,
  TrophyOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import ViewerHomeTab from "./ViewerHomeTab";
import ViewerFixturesTab from "./ViewerFixturesTab";
import ViewerResultsTab from "./ViewerResultsTab";
import ViewerTableTab from "./ViewerTableTab";
import ViewerPlayersTab from "./ViewerPlayersTab";
import ViewerRulesTab from "./ViewerRulesTab";
import StatsLeaderboardPanel from "../Tournaments/Statistics/StatsLeaderboardPanel";
import {
  useGetTournamentsQuery,
  useGetTournamentSummaryQuery,
} from "../../state/features/tournaments/tournamentsSlice";
import { Link } from "react-router-dom";
import { showBdLocalTime } from "../../utils/utils";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import styles from "./TournamentViewerPage.module.css";

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
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const loginInfo = useSelector(selectLoginInfo);
  const isLoggedIn = Boolean(loginInfo.token);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("home");

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

  const selectedTournamentDateTime = selectedTournament?.tournamentDate
    ? showBdLocalTime(selectedTournament.tournamentDate)
    : "Date/time not set";

  const { data: summaryData } = useGetTournamentSummaryQuery(
    { tournamentId: selectedId ?? 0 },
    { skip: !selectedId },
  );
  const hasRules = Boolean(summaryData?.content?.[0]?.rules?.trim());

  useEffect(() => {
    if (tournaments.length === 0) {
      if (selectedId !== null) {
        setSelectedId(null);
      }
      return;
    }

    const selectedTournamentStillAvailable =
      selectedId != null && tournaments.some((t) => t.id === selectedId);

    if (selectedTournamentStillAvailable) {
      return;
    }

    const defaultTournament = tournaments.find((t) => t.defaultTournament);
    setSelectedId((defaultTournament ?? tournaments[0]).id);
  }, [selectedId, tournaments]);

  const handleSelect = (id: number) => {
    setSelectedId(id);
    setActiveTab("home");
  };

  const tabItems = [
    {
      key: "home",
      label: (
        <span>
          <HomeOutlined style={{ marginRight: 6 }} />
          Home
        </span>
      ),
      children: selectedId ? (
        <ViewerHomeTab tournamentId={selectedId} />
      ) : null,
    },
    ...(hasRules
      ? [
          {
            key: "rules",
            label: (
              <span>
                <BookOutlined style={{ marginRight: 6 }} />
                Rules
              </span>
            ),
            children: selectedId ? (
              <ViewerRulesTab tournamentId={selectedId} />
            ) : null,
          },
        ]
      : []),
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
      className={styles.viewerLayout}
      style={{
        minHeight: hasHeader ? "calc(100vh - 64px)" : "100vh",
      }}
    >
      {/* Content */}
      <Content className={styles.viewerContent}>
        <div className={styles.topBar}>
          <div className={styles.topBarInner}>
            {/* Left: Tournament Info */}
            {!isMobile && (
              <div className={styles.infoBlock}>
                <div className={styles.tournamentName}>
                  {selectedTournament?.name || "Select Tournament"}
                </div>

                {selectedTournament && (
                  <Space size={16} wrap className={styles.infoMetaRow}>
                    <Text className={styles.infoMetaText}>
                      <CalendarOutlined style={{ marginRight: 6 }} />
                      {selectedTournamentDateTime}
                    </Text>
                    <Text className={styles.infoMetaText}>
                      <EnvironmentOutlined style={{ marginRight: 6 }} />
                      {selectedTournament.venueName || "Venue not set"}
                    </Text>
                  </Space>
                )}
              </div>
            )}

            {/* Right: Select & Login */}
            <div className={styles.controlsRow}>
              <Select
                className={`tournament-portal-select-custom ${styles.tournamentSelect}`}
                showSearch
                loading={tournamentsLoading}
                placeholder="Select tournament"
                value={selectedId ?? undefined}
                onChange={handleSelect}
                suffixIcon={<DownOutlined />}
                style={{
                  width: isMobile ? "auto" : 250,
                  flex: isMobile ? 1 : "none",
                  minWidth: 0,
                }}
                optionFilterProp="searchLabel"
                options={tournaments.map((t) => ({
                  value: t.id,
                  searchLabel: `${t.name} ${(t.tournamentStatus || "UNKNOWN").toUpperCase()}`,
                  label: (
                    <span
                      className={styles.optionLabel}
                      title={`${t.name} (${(t.tournamentStatus || "UNKNOWN").toUpperCase()})`}
                    >
                      {`${t.name} (${(t.tournamentStatus || "UNKNOWN").toUpperCase()})`}
                    </span>
                  ),
                }))}
              />
              {!isLoggedIn && (
                <Link to="/login" className={styles.loginLink}>
                  <button
                    className="tournament-login-button"
                    style={{
                      whiteSpace: "nowrap",
                      minWidth: isMobile ? "88px" : "auto",
                    }}
                  >
                    LOGIN
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {selectedId ? (
          <div className={styles.tabsOuter}>
            <div
              className={styles.tabsInner}
              style={{ maxWidth: VIEWER_CONTENT_MAX_WIDTH }}
            >
              {isMobile && (
                <div className={styles.mobileInfoBlock}>
                  <div className={styles.mobileTournamentName}>
                    {selectedTournament?.name || "Select Tournament"}
                  </div>

                  {selectedTournament && (
                    <Space size={8} wrap className={styles.mobileMetaRow}>
                      <Text className={styles.mobileMetaText}>
                        <CalendarOutlined style={{ marginRight: 6 }} />
                        {selectedTournamentDateTime}
                      </Text>
                      <Text className={styles.mobileMetaText}>
                        <EnvironmentOutlined style={{ marginRight: 6 }} />
                        {selectedTournament.venueName || "Venue not set"}
                      </Text>
                    </Space>
                  )}
                </div>
              )}
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                centered
                className="tournament-viewer-tabs"
                size={isMobile ? "small" : "middle"}
                style={{ marginTop: 6 }}
              />
            </div>
          </div>
        ) : (
          <div className={styles.emptyStateWrap}>
            <Empty
              image={<TrophyOutlined className={styles.emptyIcon} />}
              imageStyle={{ height: 64 }}
              description={
                <span>
                  <Text type="secondary" className={styles.emptyDescription}>
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
