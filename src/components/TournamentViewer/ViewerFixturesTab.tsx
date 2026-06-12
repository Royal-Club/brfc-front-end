import React, { useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Empty,
  Grid,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { CalendarOutlined, EnvironmentOutlined } from "@ant-design/icons";
import moment from "moment";
import { useGetFixturesQuery } from "../../state/features/fixtures/fixturesSlice";
import { useGetTournamentSummaryQuery } from "../../state/features/tournaments/tournamentsSlice";
import type { IFixture } from "../../state/features/fixtures/fixtureTypes";
import { getTeamInitials, getTeamLogoUrlFromSummary } from "./teamLogoUtils";
import styles from "./ViewerFixturesTab.module.css";

const { Text, Title } = Typography;

interface ViewerFixturesTabProps {
  tournamentId: number;
}

const matchStatusTag = (status: string) => {
  switch (status) {
    case "ONGOING":
      return <Badge status="processing" text={<Text className={styles.liveStatusText}>LIVE</Text>} />;
    case "PAUSED":
      return <Tag className={styles.statusTag} color="purple">PAUSED</Tag>;
    case "COMPLETED":
      return <Tag className={styles.statusTag} color="default">FT</Tag>;
    default:
      return <Tag className={styles.statusTag} color="blue">UPCOMING</Tag>;
  }
};

const buildGroupLabel = (fixture: IFixture) => {
  if (fixture.groupName) return fixture.groupName;
  if (fixture.round != null) return `Round ${fixture.round}`;
  return "To Be Announced";
};

const buildStageLabel = (label: string) => label.toUpperCase();

const formatMatchDate = (matchDate?: string) => {
  if (!matchDate) return "TO BE ANNOUNCED";

  return moment.utc(matchDate).local().format("DD MMM YYYY, HH:mm");
};

const normalizeFilterLabel = (label: string) => label.toUpperCase();

const getMatchCardClassName = (status: string) => {
  if (status === "COMPLETED") return `${styles.matchCard} ${styles.matchCardCompleted}`;
  if (status === "ONGOING") return `${styles.matchCard} ${styles.matchCardLive}`;
  return styles.matchCard;
};

function MatchCard({ fixture, tournamentSummary, isMobile }: { fixture: IFixture; tournamentSummary?: any; isMobile: boolean }) {
  const groupLabel = buildGroupLabel(fixture);
  const isAnnounced = Boolean(fixture.matchDate);
  const homeTeamLogoUrl = getTeamLogoUrlFromSummary(tournamentSummary, fixture.homeTeamId);
  const awayTeamLogoUrl = getTeamLogoUrlFromSummary(tournamentSummary, fixture.awayTeamId);

  return (
    <Card
      bordered={false}
      className={getMatchCardClassName(fixture.matchStatus)}
      bodyStyle={{ padding: isMobile ? "14px 14px 16px" : "20px 22px 24px" }}
    >
      <div className={styles.cardTopRow}>
        <Tag className={styles.stageTag}>
          {buildStageLabel(groupLabel)}
        </Tag>
        <Space size={8} wrap>
          {matchStatusTag(fixture.matchStatus)}
          <Text className={styles.cardTopMeta}>
            {isAnnounced ? "MATCH SCHEDULED" : "TO BE ANNOUNCED"}
          </Text>
        </Space>
      </div>

      <div className={styles.teamsGrid}>
        <div className={`${styles.teamBlock} ${styles.teamHome}`}>
          <Text strong className={styles.teamName}>
            {fixture.homeTeamName || "TBA"}
          </Text>
          <Avatar
            size={isMobile ? 40 : 58}
            src={homeTeamLogoUrl}
            className={styles.teamLogo}
          >
            {getTeamInitials(fixture.homeTeamName)}
          </Avatar>
        </div>

        <div className={styles.vsWrap}>
          <span className={styles.vsBadge}>VS</span>
        </div>

        <div className={`${styles.teamBlock} ${styles.teamAway}`}>
          <Avatar
            size={isMobile ? 40 : 58}
            src={awayTeamLogoUrl}
            className={styles.teamLogo}
          >
            {getTeamInitials(fixture.awayTeamName)}
          </Avatar>
          <Text strong className={styles.teamName}>
            {fixture.awayTeamName || "TBA"}
          </Text>
        </div>
      </div>

      <div className={styles.cardMetaRow}>
        <Text className={styles.metaItem}>
          <CalendarOutlined />
          {formatMatchDate(fixture.matchDate)}
        </Text>
        {fixture.venueName && (
          <Text className={styles.metaItem}>
            <EnvironmentOutlined />
            {fixture.venueName}
          </Text>
        )}
      </div>
    </Card>
  );
}

export default function ViewerFixturesTab({ tournamentId }: ViewerFixturesTabProps) {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.sm;
  const { data, isLoading, isFetching } = useGetFixturesQuery({ tournamentId });
  const { data: tournamentSummary } = useGetTournamentSummaryQuery({ tournamentId });
  const [activeFilter, setActiveFilter] = useState("ALL");

  const fixtures = useMemo(
    () => [...(data?.content || [])].sort((left, right) =>
      (left.matchDate ?? "").localeCompare(right.matchDate ?? "")
    ),
    [data]
  );

  const filters = useMemo(() => {
    const labels = Array.from(new Set(fixtures.map((fixture) => buildGroupLabel(fixture))));
    return ["ALL", ...labels];
  }, [fixtures]);

  const groups = useMemo(() => {
    const visibleFixtures = activeFilter === "ALL"
      ? fixtures
      : fixtures.filter((fixture) => buildGroupLabel(fixture) === activeFilter);

    const map = new Map<string, IFixture[]>();
    for (const fixture of visibleFixtures) {
      const key = buildGroupLabel(fixture);
      const list = map.get(key) || [];
      list.push(fixture);
      map.set(key, list);
    }

    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [activeFilter, fixtures]);

  if (isLoading || isFetching) {
    return (
      <div className={styles.loadingWrap}>
        <Spin size="large" />
      </div>
    );
  }

  if (groups.length === 0) {
    return <Empty description="No fixtures available" className={styles.emptyWrap} />;
  }

  return (
    <div className={styles.pageWrap}>
      <div className={styles.header}>
        <Title level={2} className={styles.title}>
          Tournament Fixtures
        </Title>
        <Text className={styles.subtitle}>
          Schedule & Match Details
        </Text>
      </div>

      <div className={styles.contentWrap}>
        <div className={styles.filterBar}>
          {filters.map((filter) => {
            const isActive = filter === activeFilter;
            return (
              <Button
                key={filter}
                type="text"
                onClick={() => setActiveFilter(filter)}
                className={`${styles.filterButton} ${isActive ? styles.filterButtonActive : ""}`}
              >
                {normalizeFilterLabel(filter)}
              </Button>
            );
          })}
        </div>

        {groups.map(([groupName, fixtures]) => (
          <section key={groupName} className={styles.groupSection}>
            <div className={styles.groupHeader}>
              <div className={styles.groupTitleWrap}>
                <Title level={4} className={styles.groupTitle}>
                  {groupName}
                </Title>
                {!isMobile && <div className={styles.groupDivider} />}
              </div>
              <Tag className={styles.groupCountTag}>
                {fixtures.length} MATCH{fixtures.length !== 1 ? "ES" : ""}
              </Tag>
            </div>
            {fixtures.map((f) => (
              <MatchCard key={f.id} fixture={f} tournamentSummary={tournamentSummary} isMobile={isMobile} />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
