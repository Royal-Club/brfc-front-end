import React, { useMemo } from "react";
import { Alert, Avatar, Card, Col, Divider, Empty, Row, Space, Spin, Tag, Typography } from "antd";
import { CalendarOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { useGetFixturesQuery, useGetMatchEventsQuery } from "../../state/features/fixtures/fixturesSlice";
import { useGetTournamentSummaryQuery } from "../../state/features/tournaments/tournamentsSlice";
import { MatchEventType } from "../../state/features/fixtures/fixtureTypes";
import type { IFixture, IMatchEvent } from "../../state/features/fixtures/fixtureTypes";
import { getTeamInitials, getTeamLogoUrlFromSummary } from "./teamLogoUtils";

const { Text, Title } = Typography;

interface ViewerResultsTabProps {
  tournamentId: number;
}

const formatGoalMinute = (eventTime: number) => {
  const minutes = Math.floor((eventTime || 0) / 60);
  return `${minutes}'`;
};

const buildGoalEvents = (
  events: IMatchEvent[] = [],
  teamId: number

): Array<{ key: string; playerName: string; minute: string }> => {
  const goalEvents = events
    .filter((event) => event.eventType === MatchEventType.GOAL && event.teamId === teamId && event.playerId)
    .sort((left, right) => (left.eventTime || 0) - (right.eventTime || 0));

  return goalEvents.map((event, index) => ({
    key: `${teamId}-${event.playerId}-${event.eventTime}-${index}`,
    playerName: event.playerName || "Unknown",
    minute: formatGoalMinute(event.eventTime),
  }));
};

function ResultCard({ fixture, tournamentSummary }: { fixture: IFixture; tournamentSummary?: any }) {
  const homeWin = fixture.homeTeamScore > fixture.awayTeamScore;
  const awayWin = fixture.awayTeamScore > fixture.homeTeamScore;
  const isLive = fixture.matchStatus === "ONGOING" || fixture.matchStatus === "PAUSED";
  const { data: eventsResponse } = useGetMatchEventsQuery(
    { matchId: fixture.id },
    { skip: fixture.matchStatus === "SCHEDULED" }
  );

  const homeScorers = useMemo(
    () => buildGoalEvents(eventsResponse?.content, fixture.homeTeamId),
    [eventsResponse?.content, fixture.homeTeamId]
  );
  const awayScorers = useMemo(
    () => buildGoalEvents(eventsResponse?.content, fixture.awayTeamId),
    [eventsResponse?.content, fixture.awayTeamId]
  );
  const homeRecordedGoals = useMemo(
    () => homeScorers.length,
    [homeScorers]
  );
  const awayRecordedGoals = useMemo(
    () => awayScorers.length,
    [awayScorers]
  );
  const hasScorerMismatch =
    fixture.matchStatus === "COMPLETED" &&
    homeRecordedGoals !== fixture.homeTeamScore ||
    (fixture.matchStatus === "COMPLETED" && awayRecordedGoals !== fixture.awayTeamScore);

  const competitionLabel = fixture.groupName
    ? fixture.groupName.toUpperCase()
    : fixture.round != null
    ? `ROUND ${fixture.round}`
    : "RESULT";
  const playedDate = fixture.completedAt || fixture.matchDate;
  const homeTeamLogoUrl = getTeamLogoUrlFromSummary(tournamentSummary, fixture.homeTeamId);
  const awayTeamLogoUrl = getTeamLogoUrlFromSummary(tournamentSummary, fixture.awayTeamId);

  return (
    <Card
      size="small"
      style={{
        marginBottom: 18,
        borderRadius: 28,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
        background:
          "radial-gradient(circle at center, rgba(82,196,26,0.08) 0%, rgba(255,255,255,0.02) 42%, rgba(255,255,255,0.01) 100%)",
        boxShadow: "0 16px 36px rgba(0,0,0,0.28)",
      }}
      bodyStyle={{ padding: 0 }}
    >
      <div
        style={{
          padding: "18px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          textTransform: "uppercase",
        }}
      >
        <Text strong style={{ fontSize: 16, letterSpacing: 0.6, opacity: 0.7 }}>
          {competitionLabel}
        </Text>
        <Space size={10}>
          {isLive && <Tag color="green">LIVE</Tag>}
          {fixture.matchStatus === "PAUSED" && <Tag color="purple">PAUSED</Tag>}
          {playedDate && (
            <Text strong style={{ fontSize: 15, letterSpacing: 0.6, opacity: 0.8 }}>
              {new Date(playedDate).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </Text>
          )}
        </Space>
      </div>

      <div style={{ padding: "28px 24px 22px" }}>
        {hasScorerMismatch && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 18, borderRadius: 16 }}
            message="Scorer breakdown incomplete"
            description="The final score is saved, but not every goal has a recorded scorer event yet. Open the match details and record the missing goal events to complete the breakdown."
          />
        )}

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
                style={{
                  fontSize: 24,
                  color: homeWin ? "#ffffff" : "rgba(255,255,255,0.88)",
                }}
              >
                {fixture.homeTeamName}
              </Text>
              <Avatar
                size={82}
                src={homeTeamLogoUrl}
                style={{
                  background: "linear-gradient(180deg, #ffffff 0%, #ececec 100%)",
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
                background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Text strong style={{ fontSize: 40, lineHeight: 1, color: "#ffffff" }}>
                {fixture.homeTeamScore}
              </Text>
              <Text strong style={{ fontSize: 26, margin: "0 10px", opacity: 0.5 }}>
                -
              </Text>
              <Text strong style={{ fontSize: 40, lineHeight: 1, color: "#ffffff" }}>
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
                size={82}
                src={awayTeamLogoUrl}
                style={{
                  background: "linear-gradient(180deg, #ffffff 0%, #ececec 100%)",
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
                style={{
                  fontSize: 24,
                  color: awayWin ? "#ffffff" : "rgba(255,255,255,0.88)",
                }}
              >
                {fixture.awayTeamName}
              </Text>
            </div>
          </Col>
        </Row>

        {(homeScorers.length > 0 || awayScorers.length > 0 || fixture.venueName) && (
          <>
            <Divider style={{ margin: "24px 0 18px", borderColor: "rgba(255,255,255,0.06)" }} />
            <Row gutter={[16, 10]} align="top">
              <Col xs={24} md={11}>
                <Space direction="vertical" size={8} style={{ width: "100%", alignItems: "flex-end" }}>
                  {homeScorers.map((scorer) => (
                    <Space key={scorer.key} size={8} align="center">
                      <Text style={{ fontSize: 17, fontWeight: 600 }}>{scorer.playerName}</Text>
                      <Tag color="green" style={{ margin: 0, fontWeight: 700, minWidth: 46, textAlign: "center" }}>
                        {scorer.minute}
                      </Tag>
                      <span style={{ color: "#fadb14", fontSize: 16, lineHeight: 1 }}>⚽</span>
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
                <Space direction="vertical" size={8} style={{ width: "100%", alignItems: "flex-start" }}>
                  {awayScorers.map((scorer) => (
                    <Space key={scorer.key} size={8} align="center">
                      <span style={{ color: "#fadb14", fontSize: 16, lineHeight: 1 }}>⚽</span>
                      <Tag color="green" style={{ margin: 0, fontWeight: 700, minWidth: 46, textAlign: "center" }}>
                        {scorer.minute}
                      </Tag>
                      <Text style={{ fontSize: 17, fontWeight: 600 }}>{scorer.playerName}</Text>
                    </Space>
                  ))}
                </Space>
              </Col>
            </Row>
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

export default function ViewerResultsTab({ tournamentId }: ViewerResultsTabProps) {
  const { data, isLoading, isFetching } = useGetFixturesQuery({ tournamentId });
  const { data: tournamentSummary } = useGetTournamentSummaryQuery({ tournamentId });

  const sections = useMemo(() => {
    const fixtures = data?.content || [];
    const liveFixtures = fixtures
      .filter((fixture) => fixture.matchStatus === "ONGOING" || fixture.matchStatus === "PAUSED")
      .sort((left, right) => (left.matchDate ?? "").localeCompare(right.matchDate ?? ""));

    const completedFixtures = fixtures
      .filter((fixture) => fixture.matchStatus === "COMPLETED")
      .sort((left, right) => (right.completedAt ?? right.matchDate ?? "").localeCompare(left.completedAt ?? left.matchDate ?? ""));

    return [
      { key: "live", title: "Live Results", fixtures: liveFixtures, tagColor: "green", tagLabel: "live" },
      { key: "completed", title: "Completed Results", fixtures: completedFixtures, tagColor: "default", tagLabel: "result" },
    ].filter((section) => section.fixtures.length > 0);
  }, [data]);

  if (isLoading || isFetching) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (sections.length === 0) {
    return <Empty description="No live or completed results yet" style={{ padding: 48 }} />;
  }

  return (
    <div>
      {sections.map((section) => (
        <div key={section.key} style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
              paddingBottom: 6,
              borderBottom: "2px solid rgba(82,196,26,0.35)",
            }}
          >
            <Title level={5} style={{ margin: 0 }}>
              {section.title}
            </Title>
            <Tag color={section.tagColor}>{section.fixtures.length} {section.tagLabel}{section.fixtures.length !== 1 ? "s" : ""}</Tag>
          </div>
          {section.fixtures.map((f) => (
            <ResultCard key={f.id} fixture={f} tournamentSummary={tournamentSummary} />
          ))}
        </div>
      ))}
    </div>
  );
}
