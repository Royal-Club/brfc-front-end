import React, { useMemo } from "react";
import { Alert, Avatar, Button, Card, List, Space, Spin, Tabs, Tag, Tooltip, Typography } from "antd";
import {
  EditOutlined,
  FireOutlined,
  ReloadOutlined,
  RiseOutlined,
  StopOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  useAggregateTournamentStatisticsMutation,
  useGetPlayerStatisticsQuery,
} from "../../../state/features/statistics/statisticsSlice";
import { useGetFixturesQuery } from "../../../state/features/fixtures/fixturesSlice";
import { useGetTournamentSummaryQuery } from "../../../state/features/tournaments/tournamentsSlice";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import type { IPlayerStatisticsData } from "../../../state/features/statistics/statisticsTypes";

const { Text, Title } = Typography;

interface StatsLeaderboardPanelProps {
  tournamentId: number;
  isActive?: boolean;
}

interface LeaderboardRow {
  key: string;
  playerName: string;
  teamName: string;
  value: number;
}

const rankAvatarColor = (rank: number) => {
  if (rank === 1) return "#d4af37";
  if (rank === 2) return "#9ca3af";
  if (rank === 3) return "#b87333";
  return "#1677ff";
};

const buildScorerRows = (
  players: IPlayerStatisticsData[] = [],
  teamLookup: Map<number, string>
): LeaderboardRow[] =>
  players
    .filter((player) => player.statistics.goalsScored > 0)
    .sort((left, right) => right.statistics.goalsScored - left.statistics.goalsScored)
    .map((player) => ({
      key: `scorer-${player.playerId}`,
      playerName: player.playerName,
      teamName: teamLookup.get(player.playerId) || "-",
      value: player.statistics.goalsScored,
    }));

const buildAssistRows = (
  players: IPlayerStatisticsData[] = [],
  teamLookup: Map<number, string>
): LeaderboardRow[] =>
  players
    .filter((player) => player.statistics.assists > 0)
    .sort((left, right) => right.statistics.assists - left.statistics.assists)
    .map((player) => ({
      key: `assist-${player.playerId}`,
      playerName: player.playerName,
      teamName: teamLookup.get(player.playerId) || "-",
      value: player.statistics.assists,
    }));

const buildCardRows = (
  players: IPlayerStatisticsData[] = [],
  teamLookup: Map<number, string>,
  cardType: "yellow" | "red"
): LeaderboardRow[] => {
  const readValue = (player: IPlayerStatisticsData) =>
    cardType === "yellow"
      ? player.statistics.yellowCards
      : player.statistics.redCards;

  return players
    .filter((player) => readValue(player) > 0)
    .sort((left, right) => {
      const difference = readValue(right) - readValue(left);
      if (difference !== 0) {
        return difference;
      }

      if (cardType === "yellow") {
        return right.statistics.redCards - left.statistics.redCards;
      }

      return right.statistics.yellowCards - left.statistics.yellowCards;
    })
    .map((player) => ({
      key: `${cardType}-${player.playerId}`,
      playerName: player.playerName,
      teamName: teamLookup.get(player.playerId) || "-",
      value: readValue(player),
    }));
};

interface CompletedMatch {
  id: number;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamScore: number;
  awayTeamScore: number;
}

function LeaderboardSection({
  title,
  icon,
  rows,
  loading,
  error,
  emptyMessage,
  valueTitle,
  accentColor,
  onSync,
  isSyncing,
  isAdmin,
  completedMatches,
  onNavigate,
  showCompletedMatchesHelp = true,
}: {
  title: string;
  icon: React.ReactNode;
  rows: LeaderboardRow[];
  loading: boolean;
  error: unknown;
  emptyMessage: string;
  valueTitle: string;
  accentColor: string;
  onSync?: () => void;
  isSyncing?: boolean;
  isAdmin?: boolean;
  completedMatches?: CompletedMatch[];
  onNavigate?: (matchId: number) => void;
  showCompletedMatchesHelp?: boolean;
}) {
  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message={`Unable to load ${title.toLowerCase()}`}
        description="Please refresh and try again."
      />
    );
  }

  return (
    <Spin spinning={loading}>
      <Card
        bordered={false}
        style={{
          borderRadius: 34,
          background: "linear-gradient(135deg, rgba(14,18,34,0.96) 0%, rgba(19,27,46,0.92) 100%)",
          boxShadow: "0 22px 44px rgba(0,0,0,0.28)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        bodyStyle={{ padding: "22px 22px 18px" }}
      >
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              paddingBottom: 16,
              marginBottom: 6,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
              <Avatar
                size={56}
                style={{
                  background: "linear-gradient(180deg, #ebfff2 0%, #dff7eb 100%)",
                  color: accentColor,
                  fontWeight: 900,
                  fontSize: 22,
                  border: "3px solid rgba(255,255,255,0.75)",
                  boxShadow: "0 12px 24px rgba(0,0,0,0.18)",
                }}
              >
                {icon}
              </Avatar>
              <div style={{ minWidth: 0 }}>
                <Title level={4} style={{ margin: 0, color: "#ffffff" }}>
                  {title}
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Ranked by {valueTitle.toLowerCase()}
                </Text>
              </div>
            </div>
            {isAdmin && onSync && (
              <Tooltip title="Re-sync statistics from recorded match events">
                <Button
                  icon={<ReloadOutlined />}
                  size="small"
                  loading={isSyncing}
                  onClick={onSync}
                >
                  Sync Stats
                </Button>
              </Tooltip>
            )}
          </div>
          {rows.length > 0 ? (
            <List
              dataSource={rows}
              renderItem={(row, index) => (
                <List.Item style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                    <Avatar
                      size={30}
                      style={{
                        backgroundColor: rankAvatarColor(index + 1),
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text strong style={{ display: "block", color: "rgba(255,255,255,0.94)" }}>
                        {row.playerName}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {row.teamName || "-"}
                      </Text>
                    </div>
                    <Tag
                      style={{
                        margin: 0,
                        minWidth: 52,
                        textAlign: "center",
                        borderRadius: 999,
                        border: "none",
                        background: "rgba(255,255,255,0.06)",
                        color: accentColor,
                        fontWeight: 800,
                        padding: "4px 12px",
                      }}
                    >
                      {row.value}
                    </Tag>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <Text type="secondary">{emptyMessage}</Text>
              {showCompletedMatchesHelp && completedMatches && completedMatches.length > 0 && (
                <Card
                  size="small"
                  title={
                    <Text strong>
                      <EditOutlined style={{ marginRight: 6 }} />
                      Completed matches — record events here
                    </Text>
                  }
                >
                  <List
                    size="small"
                    dataSource={completedMatches}
                    renderItem={(match) => (
                      <List.Item
                        actions={[
                          <Button
                            key="record"
                            type="primary"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => onNavigate && onNavigate(match.id)}
                          >
                            Record Events
                          </Button>,
                        ]}
                      >
                        <Text>
                          {match.homeTeamName}{" "}
                          <Tag color="blue">
                            {match.homeTeamScore} – {match.awayTeamScore}
                          </Tag>{" "}
                          {match.awayTeamName}
                        </Text>
                      </List.Item>
                    )}
                  />
                </Card>
              )}
            </Space>
          )}
        </Space>
      </Card>
    </Spin>
  );
}

export default function StatsLeaderboardPanel({
  tournamentId,
  isActive = false,
}: StatsLeaderboardPanelProps) {
  const navigate = useNavigate();
  const loginInfo = useSelector(selectLoginInfo);
  const isAdmin =
    loginInfo.roles.includes("ADMIN") ||
    loginInfo.roles.includes("SUPERADMIN") ||
    loginInfo.roles.includes("COORDINATOR");
  const [aggregateStats, { isLoading: isAggregating }] =
    useAggregateTournamentStatisticsMutation();
  const playerStatisticsQuery = useGetPlayerStatisticsQuery(
    { tournamentId, limit: 200 },
    { skip: !isActive || !tournamentId, refetchOnMountOrArgChange: true }
  );
  const tournamentSummaryQuery = useGetTournamentSummaryQuery(
    { tournamentId },
    { skip: !isActive || !tournamentId }
  );
  const fixturesQuery = useGetFixturesQuery(
    { tournamentId },
    { skip: !isActive || !tournamentId }
  );

  // Build list of completed matches that may need event recording
  const completedMatches: CompletedMatch[] = useMemo(() => {
    return (fixturesQuery.data?.content || [])
      .filter((f) => f.matchStatus === "COMPLETED")
      .map((f) => ({
        id: f.id,
        homeTeamName: f.homeTeamName || `Team ${f.homeTeamId}`,
        awayTeamName: f.awayTeamName || `Team ${f.awayTeamId}`,
        homeTeamScore: f.homeTeamScore ?? 0,
        awayTeamScore: f.awayTeamScore ?? 0,
      }));
  }, [fixturesQuery.data]);

  const handleNavigateToMatch = (matchId: number) => {
    navigate(`/fixtures/${matchId}`);
  };

  const playerTeamLookup = useMemo(() => {
    const map = new Map<number, string>();
    const tournament = tournamentSummaryQuery.data?.content?.[0];

    (tournament?.teams || []).forEach((team) => {
      (team.players || []).forEach((player) => {
        if (!map.has(player.playerId)) {
          map.set(player.playerId, team.teamName);
        }
      });
    });

    return map;
  }, [tournamentSummaryQuery.data]);

  const topScorers = useMemo(
    () => buildScorerRows(playerStatisticsQuery.data?.content, playerTeamLookup),
    [playerStatisticsQuery.data, playerTeamLookup]
  );
  const topAssists = useMemo(
    () => buildAssistRows(playerStatisticsQuery.data?.content, playerTeamLookup),
    [playerStatisticsQuery.data, playerTeamLookup]
  );
  const yellowCardLeaders = useMemo(
    () =>
      buildCardRows(
        playerStatisticsQuery.data?.content,
        playerTeamLookup,
        "yellow"
      ),
    [playerStatisticsQuery.data, playerTeamLookup]
  );
  const redCardLeaders = useMemo(
    () =>
      buildCardRows(
        playerStatisticsQuery.data?.content,
        playerTeamLookup,
        "red"
      ),
    [playerStatisticsQuery.data, playerTeamLookup]
  );

  return (
    <Tabs
      defaultActiveKey="top-scorers"
      className="tournament-subtabs"
      items={[
        {
          key: "top-scorers",
          label: "Top Scorers",
          children: (
            <LeaderboardSection
              title="Top Scorers"
              icon={<FireOutlined style={{ color: "#ff4d4f", fontSize: 18 }} />}
              rows={topScorers}
              loading={playerStatisticsQuery.isLoading || playerStatisticsQuery.isFetching}
              error={playerStatisticsQuery.error}
              emptyMessage="No goal scorers found for this tournament."
              valueTitle="Goals"
              accentColor="#ff4d4f"
              onSync={() => aggregateStats({ tournamentId })}
              isSyncing={isAggregating}
              isAdmin={isAdmin}
              completedMatches={completedMatches}
              onNavigate={handleNavigateToMatch}
            />
          ),
        },
        {
          key: "most-assists",
          label: "Most Assists",
          children: (
            <LeaderboardSection
              title="Most Assists"
              icon={<RiseOutlined style={{ color: "#52c41a", fontSize: 18 }} />}
              rows={topAssists}
              loading={playerStatisticsQuery.isLoading || playerStatisticsQuery.isFetching}
              error={playerStatisticsQuery.error}
              emptyMessage="No assists found for this tournament."
              valueTitle="Assists"
              accentColor="#52c41a"
              onSync={() => aggregateStats({ tournamentId })}
              isSyncing={isAggregating}
              isAdmin={isAdmin}
              completedMatches={completedMatches}
              onNavigate={handleNavigateToMatch}
            />
          ),
        },
        {
          key: "yellow-cards",
          label: "Yellow Cards",
          children: (
            <LeaderboardSection
              title="Yellow Cards"
              icon={<WarningOutlined style={{ color: "#faad14", fontSize: 18 }} />}
              rows={yellowCardLeaders}
              loading={playerStatisticsQuery.isLoading || playerStatisticsQuery.isFetching}
              error={playerStatisticsQuery.error}
              emptyMessage="No yellow cards found for this tournament."
              valueTitle="Cards"
              accentColor="#faad14"
              onSync={() => aggregateStats({ tournamentId })}
              isSyncing={isAggregating}
              isAdmin={isAdmin}
              completedMatches={completedMatches}
              onNavigate={handleNavigateToMatch}
            />
          ),
        },
        {
          key: "red-cards",
          label: "Red Cards",
          children: (
            <LeaderboardSection
              title="Red Cards"
              icon={<StopOutlined style={{ color: "#cf1322", fontSize: 18 }} />}
              rows={redCardLeaders}
              loading={playerStatisticsQuery.isLoading || playerStatisticsQuery.isFetching}
              error={playerStatisticsQuery.error}
              emptyMessage="No red cards found for this tournament"
              valueTitle="Cards"
              accentColor="#cf1322"
              onSync={() => aggregateStats({ tournamentId })}
              isSyncing={isAggregating}
              isAdmin={isAdmin}
              completedMatches={completedMatches}
              onNavigate={handleNavigateToMatch}
              showCompletedMatchesHelp={false}
            />
          ),
        },
      ]}
    />
  );
}
