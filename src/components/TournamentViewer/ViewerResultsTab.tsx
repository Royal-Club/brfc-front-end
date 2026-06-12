import React, { useMemo } from "react";
import {
  Alert,
  Avatar,
  Card,
  Col,
  Divider,
  Empty,
  Grid,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { CalendarOutlined, EnvironmentOutlined } from "@ant-design/icons";
import {
  useGetFixturesQuery,
  useGetMatchEventsQuery,
} from "../../state/features/fixtures/fixturesSlice";
import { useGetTournamentSummaryQuery } from "../../state/features/tournaments/tournamentsSlice";
import { MatchEventType } from "../../state/features/fixtures/fixtureTypes";
import type {
  IFixture,
  IMatchEvent,
} from "../../state/features/fixtures/fixtureTypes";
import { getTeamInitials, getTeamLogoUrlFromSummary } from "./teamLogoUtils";
import styles from "./ViewerFixturesTab.module.css";

const { Text, Title } = Typography;

interface ViewerResultsTabProps {
  tournamentId: number;
}

const formatGoalMinute = (
  event: IMatchEvent,
  matchStartedAt?: string | null,
) => {
  if (matchStartedAt && event.createdDate) {
    try {
      const startMs = new Date(matchStartedAt).getTime();
      const eventMs = new Date(event.createdDate).getTime();
      const diffSeconds = Math.floor((eventMs - startMs) / 1000);
      if (Number.isFinite(diffSeconds) && diffSeconds >= 0) {
        return `${Math.floor(diffSeconds / 60)}'`;
      }
    } catch {
      // Fallback to eventTime value.
    }
  }

  // In this app, eventTime is stored as match minute.
  const minutes = Number(event.eventTime) || 0;
  return `${Math.floor(minutes)}'`;
};

const buildGoalEvents = (
  events: IMatchEvent[] = [],
  teamId: number,
  matchStartedAt?: string | null,
): Array<{ key: string; playerName: string; minute: string }> => {
  const goalEvents = events
    .filter(
      (event) =>
        event.eventType === MatchEventType.GOAL &&
        event.teamId === teamId &&
        event.playerId,
    )
    .sort((left, right) => (left.eventTime || 0) - (right.eventTime || 0));

  return goalEvents.map((event, index) => ({
    key: `${teamId}-${event.playerId}-${event.eventTime}-${index}`,
    playerName: event.playerName || "Unknown",
    minute: formatGoalMinute(event, matchStartedAt),
  }));
};

const buildStageLabel = (label: string) => label.toUpperCase();

const getResultCardClassName = (status: string) => {
  if (status === "COMPLETED")
    return `${styles.matchCard} ${styles.matchCardCompleted}`;
  if (status === "ONGOING" || status === "PAUSED")
    return `${styles.matchCard} ${styles.matchCardLive}`;
  return styles.matchCard;
};

const formatPlayedDate = (value?: string | null) => {
  if (!value) return "DATE N/A";
  return new Date(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

function ResultCard({
  fixture,
  tournamentSummary,
  isMobile,
}: {
  fixture: IFixture;
  tournamentSummary?: any;
  isMobile: boolean;
}) {
  const homeWin = fixture.homeTeamScore > fixture.awayTeamScore;
  const awayWin = fixture.awayTeamScore > fixture.homeTeamScore;
  const isLive =
    fixture.matchStatus === "ONGOING" || fixture.matchStatus === "PAUSED";
  const { data: eventsResponse } = useGetMatchEventsQuery(
    { matchId: fixture.id },
    { skip: fixture.matchStatus === "SCHEDULED" },
  );

  const homeScorers = useMemo(
    () =>
      buildGoalEvents(
        eventsResponse?.content,
        fixture.homeTeamId,
        fixture.startedAt,
      ),
    [eventsResponse?.content, fixture.homeTeamId, fixture.startedAt],
  );
  const awayScorers = useMemo(
    () =>
      buildGoalEvents(
        eventsResponse?.content,
        fixture.awayTeamId,
        fixture.startedAt,
      ),
    [eventsResponse?.content, fixture.awayTeamId, fixture.startedAt],
  );
  const homeRecordedGoals = useMemo(() => homeScorers.length, [homeScorers]);
  const awayRecordedGoals = useMemo(() => awayScorers.length, [awayScorers]);
  const hasScorerMismatch =
    (fixture.matchStatus === "COMPLETED" &&
      homeRecordedGoals !== fixture.homeTeamScore) ||
    (fixture.matchStatus === "COMPLETED" &&
      awayRecordedGoals !== fixture.awayTeamScore);

  const competitionLabel = fixture.groupName
    ? fixture.groupName.toUpperCase()
    : fixture.round != null
      ? `ROUND ${fixture.round}`
      : "RESULT";
  const playedDate = fixture.completedAt || fixture.matchDate;
  const homeTeamLogoUrl = getTeamLogoUrlFromSummary(
    tournamentSummary,
    fixture.homeTeamId,
  );
  const awayTeamLogoUrl = getTeamLogoUrlFromSummary(
    tournamentSummary,
    fixture.awayTeamId,
  );

  return (
    <Card
      bordered={false}
      className={getResultCardClassName(fixture.matchStatus)}
      bodyStyle={{ padding: isMobile ? "14px 14px 16px" : "20px 22px 24px" }}
    >
      <div className={styles.cardTopRow}>
        <Tag className={styles.stageTag}>
          {buildStageLabel(competitionLabel)}
        </Tag>
        <Space size={8} wrap>
          {isLive && (
            <Tag className={styles.statusTag} color="green">
              LIVE
            </Tag>
          )}
          {fixture.matchStatus === "PAUSED" && (
            <Tag className={styles.statusTag} color="purple">
              PAUSED
            </Tag>
          )}
          {playedDate && (
            <Tag className={styles.statusTag} color="default">
              {formatPlayedDate(playedDate)}
            </Tag>
          )}
        </Space>
      </div>

      <div>
        {hasScorerMismatch && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 18, borderRadius: 16 }}
            message="Scorer breakdown incomplete"
            description="The final score is saved, but not every goal has a recorded scorer event yet. Open the match details and record the missing goal events to complete the breakdown."
          />
        )}

        {isMobile ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 6,
              }}
            >
              <Text
                strong
                className={styles.teamName}
                style={{
                  color: homeWin ? "#ffffff" : "rgba(255,255,255,0.88)",
                  lineHeight: 1.3,
                  flex: 1,
                  minWidth: 0,
                  wordBreak: "break-word",
                }}
              >
                {fixture.homeTeamName}
              </Text>
              <Avatar
                size={isMobile ? 40 : 58}
                src={homeTeamLogoUrl}
                style={{
                  background:
                    "linear-gradient(180deg, #ffffff 0%, #ececec 100%)",
                  color: "#1890ff",
                  fontWeight: 800,
                  fontSize: 11,
                  flexShrink: 0,
                }}
              >
                {getTeamInitials(fixture.homeTeamName, "T")}
              </Avatar>
            </div>

            <div
              style={{
                minWidth: 68,
                textAlign: "center",
                padding: "4px 6px",
                borderRadius: 10,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
                flexShrink: 0,
              }}
            >
              <Text
                strong
                style={{ fontSize: 13, lineHeight: 1, color: "#ffffff" }}
              >
                {fixture.homeTeamScore}
              </Text>
              <Text
                strong
                style={{ fontSize: 10, margin: "0 3px", opacity: 0.5 }}
              >
                -
              </Text>
              <Text
                strong
                style={{ fontSize: 13, lineHeight: 1, color: "#ffffff" }}
              >
                {fixture.awayTeamScore}
              </Text>
            </div>

            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 6,
              }}
            >
              <Avatar
                size={isMobile ? 40 : 58}
                src={awayTeamLogoUrl}
                style={{
                  background:
                    "linear-gradient(180deg, #ffffff 0%, #ececec 100%)",
                  color: "#1890ff",
                  fontWeight: 800,
                  fontSize: 11,
                  flexShrink: 0,
                }}
              >
                {getTeamInitials(fixture.awayTeamName, "T")}
              </Avatar>
              <Text
                strong
                className={styles.teamName}
                style={{
                  color: awayWin ? "#ffffff" : "rgba(255,255,255,0.88)",
                  lineHeight: 1.3,
                  textAlign: "left",
                  wordBreak: "break-word",
                }}
              >
                {fixture.awayTeamName}
              </Text>
            </div>
          </div>
        ) : (
          <Row align="middle" gutter={[16, 16]}>
            <Col xs={24} md={9}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 16,
                }}
              >
                <Text
                  strong
                  className={styles.teamName}
                  style={{
                    color: homeWin ? "#ffffff" : "rgba(255,255,255,0.88)",
                  }}
                >
                  {fixture.homeTeamName}
                </Text>
                <Avatar
                  size={isMobile ? 40 : 58}
                  src={homeTeamLogoUrl}
                  style={{
                    background:
                      "linear-gradient(180deg, #ffffff 0%, #ececec 100%)",
                    color: "#1890ff",
                    fontWeight: 800,
                    fontSize: 24,
                    boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
                  }}
                >
                  {getTeamInitials(fixture.homeTeamName, "T")}
                </Avatar>
              </div>
            </Col>

            <Col xs={24} md={6}>
              <div
                style={{
                  margin: "0 auto",
                  minWidth: 160,
                  maxWidth: 200,
                  textAlign: "center",
                  padding: "16px 22px",
                  borderRadius: 28,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Text
                  strong
                  style={{ fontSize: 40, lineHeight: 1, color: "#ffffff" }}
                >
                  {fixture.homeTeamScore}
                </Text>
                <Text
                  strong
                  style={{ fontSize: 26, margin: "0 10px", opacity: 0.5 }}
                >
                  -
                </Text>
                <Text
                  strong
                  style={{ fontSize: 40, lineHeight: 1, color: "#ffffff" }}
                >
                  {fixture.awayTeamScore}
                </Text>
              </div>
            </Col>

            <Col xs={24} md={9}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 16,
                }}
              >
                <Avatar
                  size={isMobile ? 40 : 58}
                  src={awayTeamLogoUrl}
                  style={{
                    background:
                      "linear-gradient(180deg, #ffffff 0%, #ececec 100%)",
                    color: "#1890ff",
                    fontWeight: 800,
                    fontSize: 24,
                    boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
                  }}
                >
                  {getTeamInitials(fixture.awayTeamName, "T")}
                </Avatar>
                <Text
                  strong
                  className={styles.teamName}
                  style={{
                    color: awayWin ? "#ffffff" : "rgba(255,255,255,0.88)",
                  }}
                >
                  {fixture.awayTeamName}
                </Text>
              </div>
            </Col>
          </Row>
        )}

        {(homeScorers.length > 0 ||
          awayScorers.length > 0 ||
          fixture.venueName) && (
          <>
            <Divider
              style={{
                margin: isMobile ? "14px 0 12px" : "24px 0 18px",
                borderColor: "rgba(255,255,255,0.06)",
              }}
            />
            {isMobile ? (
              <div style={{ display: "flex", gap: 8, width: "100%" }}>
                {/* Home scorers - left side */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    alignItems: "flex-start",
                  }}
                >
                  {homeScorers.map((scorer) => (
                    <div
                      key={scorer.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        minWidth: 0,
                        width: "100%",
                      }}
                    >
                      <span
                        style={{
                          color: "#fadb14",
                          fontSize: 13,
                          lineHeight: 1,
                          flexShrink: 0,
                        }}
                      >
                        ⚽
                      </span>
                      <Tag
                        color="green"
                        style={{
                          margin: 0,
                          fontWeight: 700,
                          fontSize: 11,
                          padding: "0 5px",
                          flexShrink: 0,
                        }}
                      >
                        {scorer.minute}
                      </Tag>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          wordBreak: "break-word",
                        }}
                      >
                        {scorer.playerName}
                      </Text>
                    </div>
                  ))}
                </div>
                {/* Divider */}
                <div
                  style={{
                    width: 1,
                    background: "rgba(255,255,255,0.08)",
                    flexShrink: 0,
                  }}
                />
                {/* Away scorers - right side */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    alignItems: "flex-end",
                  }}
                >
                  {awayScorers.map((scorer) => (
                    <div
                      key={scorer.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        minWidth: 0,
                        width: "100%",
                        justifyContent: "flex-end",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          wordBreak: "break-word",
                          textAlign: "right",
                        }}
                      >
                        {scorer.playerName}
                      </Text>
                      <Tag
                        color="green"
                        style={{
                          margin: 0,
                          fontWeight: 700,
                          fontSize: 11,
                          padding: "0 5px",
                          flexShrink: 0,
                        }}
                      >
                        {scorer.minute}
                      </Tag>
                      <span
                        style={{
                          color: "#fadb14",
                          fontSize: 13,
                          lineHeight: 1,
                          flexShrink: 0,
                        }}
                      >
                        ⚽
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Row gutter={[16, 10]} align="top">
                <Col xs={24} md={11}>
                  <Space
                    direction="vertical"
                    size={8}
                    style={{ width: "100%", alignItems: "flex-end" }}
                  >
                    {homeScorers.map((scorer) => (
                      <Space key={scorer.key} size={8} align="center">
                        <Text style={{ fontSize: 17, fontWeight: 600 }}>
                          {scorer.playerName}
                        </Text>
                        <Tag
                          color="green"
                          style={{
                            margin: 0,
                            fontWeight: 700,
                            minWidth: 46,
                            textAlign: "center",
                          }}
                        >
                          {scorer.minute}
                        </Tag>
                        <span
                          style={{
                            color: "#fadb14",
                            fontSize: 16,
                            lineHeight: 1,
                          }}
                        >
                          ⚽
                        </span>
                      </Space>
                    ))}
                  </Space>
                </Col>
                <Col xs={0} md={2}>
                  <div
                    style={{
                      height: "100%",
                      minHeight: 56,
                      width: 1,
                      background: "rgba(255,255,255,0.08)",
                      margin: "0 auto",
                    }}
                  />
                </Col>
                <Col xs={24} md={11}>
                  <Space
                    direction="vertical"
                    size={8}
                    style={{ width: "100%", alignItems: "flex-start" }}
                  >
                    {awayScorers.map((scorer) => (
                      <Space key={scorer.key} size={8} align="center">
                        <span
                          style={{
                            color: "#fadb14",
                            fontSize: 16,
                            lineHeight: 1,
                          }}
                        >
                          ⚽
                        </span>
                        <Tag
                          color="green"
                          style={{
                            margin: 0,
                            fontWeight: 700,
                            minWidth: 46,
                            textAlign: "center",
                          }}
                        >
                          {scorer.minute}
                        </Tag>
                        <Text style={{ fontSize: 17, fontWeight: 600 }}>
                          {scorer.playerName}
                        </Text>
                      </Space>
                    ))}
                  </Space>
                </Col>
              </Row>
            )}
            {fixture.venueName && (
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <EnvironmentOutlined style={{ marginRight: 4 }} />
                  {fixture.venueName}
                </Text>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

export default function ViewerResultsTab({
  tournamentId,
}: ViewerResultsTabProps) {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.sm;
  const { data, isLoading, isFetching } = useGetFixturesQuery({ tournamentId });
  const { data: tournamentSummary } = useGetTournamentSummaryQuery({
    tournamentId,
  });

  const sections = useMemo(() => {
    const fixtures = data?.content || [];
    const liveFixtures = fixtures
      .filter(
        (fixture) =>
          fixture.matchStatus === "ONGOING" || fixture.matchStatus === "PAUSED",
      )
      .sort((left, right) =>
        (left.matchDate ?? "").localeCompare(right.matchDate ?? ""),
      );

    const completedFixtures = fixtures
      .filter((fixture) => fixture.matchStatus === "COMPLETED")
      .sort((left, right) =>
        (right.completedAt ?? right.matchDate ?? "").localeCompare(
          left.completedAt ?? left.matchDate ?? "",
        ),
      );

    return [
      {
        key: "live",
        title: "Live Results",
        fixtures: liveFixtures,
        tagColor: "green",
        tagLabel: "live",
      },
      {
        key: "completed",
        title: "Completed Results",
        fixtures: completedFixtures,
        tagColor: "default",
        tagLabel: "result",
      },
    ].filter((section) => section.fixtures.length > 0);
  }, [data]);

  if (isLoading || isFetching) {
    return (
      <div className={styles.loadingWrap}>
        <Spin size="large" />
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <Empty
        description="No live or completed results yet"
        className={styles.emptyWrap}
      />
    );
  }

  return (
    <div className={styles.pageWrap}>
      <div className={styles.contentWrap}>
        {sections.map((section) => (
          <section key={section.key} className={styles.groupSection}>
            <div className={styles.groupHeader}>
              <div className={styles.groupTitleWrap}>
                <Title level={5} className={styles.groupTitle}>
                  {section.title}
                </Title>
                {!isMobile && <div className={styles.groupDivider} />}
              </div>
              <Tag className={styles.groupCountTag} color={section.tagColor}>
                {section.fixtures.length} {section.tagLabel}
                {section.fixtures.length !== 1 ? "s" : ""}
              </Tag>
            </div>
            {section.fixtures.map((f) => (
              <ResultCard
                key={f.id}
                fixture={f}
                tournamentSummary={tournamentSummary}
                isMobile={isMobile}
              />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
