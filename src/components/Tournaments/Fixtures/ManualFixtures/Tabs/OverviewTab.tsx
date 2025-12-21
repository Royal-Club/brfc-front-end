import React, { useMemo, useEffect, useState, useCallback } from "react";
import {
  Card,
  Empty,
  Typography,
  Space,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Divider,
  Spin,
  theme,
} from "antd";
import {
  TrophyOutlined,
  TeamOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  FireOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { TournamentStructureResponse, RoundType, RoundStatus, GroupStandingResponse } from "../../../../../state/features/manualFixtures/manualFixtureTypes";
import { useGetGroupStandingsQuery } from "../../../../../state/features/manualFixtures/manualFixturesSlice";
import { useGetFixturesQuery } from "../../../../../state/features/fixtures/fixturesSlice";
import { IFixture } from "../../../../../state/features/fixtures/fixtureTypes";
import { formatMatchTime, isMatchOngoing } from "../../../../../utils/matchTimeUtils";

const { Text, Title } = Typography;

interface OverviewTabProps {
  tournamentId: number;
  tournamentStructure?: TournamentStructureResponse;
  isLoading: boolean;
  onRefresh: () => void;
  isActive?: boolean;
}

interface TeamStanding {
  id: number;
  teamId: number;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
  roundName: string;
  groupName?: string;
  isAdvanced?: boolean;
}

export default function OverviewTab({
  tournamentId,
  tournamentStructure,
  isLoading,
  onRefresh,
  isActive = false,
}: OverviewTabProps) {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Fetch all fixtures for calculating direct knockout standings
  const {
    data: fixturesData,
    isLoading: fixturesLoading,
    refetch: refetchFixtures,
  } = useGetFixturesQuery(
    { tournamentId },
    { skip: !isActive }
  );

  const fixtures = fixturesData?.content || [];

  // Get ongoing matches
  const ongoingMatches = useMemo(() => {
    return fixtures.filter((f) => isMatchOngoing(f.matchStatus));
  }, [fixtures]);

  // Update time every second for ongoing matches display
  useEffect(() => {
    if (ongoingMatches.length > 0 && isActive) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [ongoingMatches.length, isActive]);

  // Refetch fixtures when tab becomes active
  useEffect(() => {
    if (isActive) {
      refetchFixtures();
    }
  }, [isActive, refetchFixtures]);

  // Get all groups to fetch standings
  const allGroups = useMemo(() => {
    if (!tournamentStructure) return [];
    const groups: Array<{ groupId: number; groupName: string; roundName: string; roundId: number }> = [];
    tournamentStructure.rounds.forEach((round) => {
      if (round.groups) {
        round.groups.forEach((group) => {
          groups.push({
            groupId: group.id,
            groupName: group.groupName,
            roundName: round.roundName,
            roundId: round.id,
          });
        });
      }
    });
    return groups;
  }, [tournamentStructure]);

  // Calculate standings for direct knockout rounds
  const directKnockoutStandings = useMemo(() => {
    if (!tournamentStructure || !fixtures.length) return [];

    const standings: TeamStanding[] = [];

    tournamentStructure.rounds.forEach((round) => {
      if (round.roundType === RoundType.DIRECT_KNOCKOUT) {
        const roundMatches = fixtures.filter((f) => {
          const matchesTournament = f.tournamentId === tournamentId;
          if (!matchesTournament) return false;
          const fixtureRoundNumber = f.roundNumber ?? f.round;
          const matchesByRoundNumber = fixtureRoundNumber === round.roundNumber;
          const matchesByRoundId = f.round === round.id;
          return matchesByRoundNumber || matchesByRoundId;
        });

        const teamStats: Record<number, {
          teamId: number;
          teamName: string;
          matchesPlayed: number;
          wins: number;
          draws: number;
          losses: number;
          goalsFor: number;
          goalsAgainst: number;
          goalDifference: number;
          points: number;
        }> = {};

        // Initialize team stats from round.teams if available
        if (round.teams) {
          round.teams.forEach((team: any) => {
            if (!team.isPlaceholder && team.teamId) {
              teamStats[team.teamId] = {
                teamId: team.teamId,
                teamName: team.teamName || "",
                matchesPlayed: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                goalDifference: 0,
                points: 0,
              };
            }
          });
        }

        // Process completed matches
        roundMatches.forEach((match) => {
          if (match.matchStatus !== "COMPLETED") return;

          const homeTeamId = match.homeTeamId;
          const awayTeamId = match.awayTeamId;
          const homeScore = match.homeTeamScore || 0;
          const awayScore = match.awayTeamScore || 0;

          // Initialize teams if not already in stats
          if (!teamStats[homeTeamId]) {
            teamStats[homeTeamId] = {
              teamId: homeTeamId,
              teamName: match.homeTeamName || `Team ${homeTeamId}`,
              matchesPlayed: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              goalDifference: 0,
              points: 0,
            };
          }

          if (!teamStats[awayTeamId]) {
            teamStats[awayTeamId] = {
              teamId: awayTeamId,
              teamName: match.awayTeamName || `Team ${awayTeamId}`,
              matchesPlayed: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              goalDifference: 0,
              points: 0,
            };
          }

          // Update home team stats
          teamStats[homeTeamId].matchesPlayed++;
          teamStats[homeTeamId].goalsFor += homeScore;
          teamStats[homeTeamId].goalsAgainst += awayScore;
          teamStats[homeTeamId].goalDifference = teamStats[homeTeamId].goalsFor - teamStats[homeTeamId].goalsAgainst;

          if (homeScore > awayScore) {
            teamStats[homeTeamId].wins++;
            teamStats[homeTeamId].points += 3;
          } else if (homeScore === awayScore) {
            teamStats[homeTeamId].draws++;
            teamStats[homeTeamId].points += 1;
          } else {
            teamStats[homeTeamId].losses++;
          }

          // Update away team stats
          teamStats[awayTeamId].matchesPlayed++;
          teamStats[awayTeamId].goalsFor += awayScore;
          teamStats[awayTeamId].goalsAgainst += homeScore;
          teamStats[awayTeamId].goalDifference = teamStats[awayTeamId].goalsFor - teamStats[awayTeamId].goalsAgainst;

          if (awayScore > homeScore) {
            teamStats[awayTeamId].wins++;
            teamStats[awayTeamId].points += 3;
          } else if (awayScore === homeScore) {
            teamStats[awayTeamId].draws++;
            teamStats[awayTeamId].points += 1;
          } else {
            teamStats[awayTeamId].losses++;
          }
        });

        // Convert to array and sort
        const roundStandings = Object.values(teamStats)
          .filter((stat) => stat.matchesPlayed > 0)
          .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            return b.goalsFor - a.goalsFor;
          })
          .map((stat, index) => ({
            ...stat,
            position: index + 1,
            id: stat.teamId,
            roundName: round.roundName,
          }));

        standings.push(...roundStandings);
      }
    });

    return standings;
  }, [tournamentStructure, fixtures, tournamentId]);

  // Helper component to fetch group standings
  const GroupStandingsFetcher: React.FC<{
    groupId: number;
    groupName: string;
    roundName: string;
    isActive: boolean;
    onStandingsLoaded: (standings: GroupStandingResponse[], groupName: string, roundName: string) => void;
  }> = ({ groupId, groupName, roundName, isActive: isTabActive, onStandingsLoaded }) => {
    const { data } = useGetGroupStandingsQuery(
      { groupId },
      { skip: !isTabActive }
    );

    useEffect(() => {
      if (data?.content) {
        onStandingsLoaded(data.content, groupName, roundName);
      }
    }, [data, groupName, roundName, onStandingsLoaded]);

    return null;
  };

  // State to store all group standings
  const [groupStandingsMap, setGroupStandingsMap] = useState<
    Record<string, { groupName: string; roundName: string; standings: GroupStandingResponse[] }>
  >({});

  const handleStandingsLoaded = useCallback(
    (standings: GroupStandingResponse[], groupName: string, roundName: string) => {
      const key = `${roundName}-${groupName}`;
      setGroupStandingsMap((prev) => ({
        ...prev,
        [key]: { groupName, roundName, standings },
      }));
    },
    []
  );

  // Combine all standings
  const allStandings = useMemo(() => {
    const combined: TeamStanding[] = [];

    // Add group standings
    Object.values(groupStandingsMap).forEach(({ groupName, roundName, standings }) => {
      standings.forEach((standing: GroupStandingResponse) => {
        combined.push({
          id: standing.id,
          teamId: standing.teamId,
          teamName: standing.teamName,
          matchesPlayed: standing.matchesPlayed,
          wins: standing.wins,
          draws: standing.draws,
          losses: standing.losses,
          goalsFor: standing.goalsFor,
          goalsAgainst: standing.goalsAgainst,
          goalDifference: standing.goalDifference,
          points: standing.points,
          position: standing.position || 0,
          roundName,
          groupName,
          isAdvanced: standing.isAdvanced,
        });
      });
    });

    // Add direct knockout standings
    combined.push(...directKnockoutStandings);

    return combined;
  }, [groupStandingsMap, directKnockoutStandings]);

  // Calculate tournament statistics
  const tournamentStats = useMemo(() => {
    if (!tournamentStructure) {
      return {
        totalRounds: 0,
        totalGroups: 0,
        totalTeams: 0,
        totalMatches: 0,
        completedMatches: 0,
        ongoingRounds: 0,
        completedRounds: 0,
      };
    }

    const totalGroups = tournamentStructure.rounds.reduce(
      (sum, round) => sum + (round.groups?.length || 0),
      0
    );

    const uniqueTeams = new Set<number>();
    tournamentStructure.rounds.forEach((round) => {
      if (round.teams) {
        round.teams.forEach((team: any) => {
          if (!team.isPlaceholder && team.teamId) {
            uniqueTeams.add(team.teamId);
          }
        });
      }
      if (round.groups) {
        round.groups.forEach((group) => {
          if (group.teams) {
            group.teams.forEach((team: any) => {
              if (!team.isPlaceholder && team.teamId) {
                uniqueTeams.add(team.teamId);
              }
            });
          }
        });
      }
    });

    const ongoingRounds = tournamentStructure.rounds.filter(
      (r) => r.status === RoundStatus.ONGOING
    ).length;
    const completedRounds = tournamentStructure.rounds.filter(
      (r) => r.status === RoundStatus.COMPLETED
    ).length;

    return {
      totalRounds: tournamentStructure.totalRounds || tournamentStructure.rounds.length,
      totalGroups,
      totalTeams: uniqueTeams.size,
      totalMatches: tournamentStructure.totalMatches || 0,
      completedMatches: tournamentStructure.completedMatches || 0,
      ongoingRounds,
      completedRounds,
    };
  }, [tournamentStructure]);

  // Group standings by round and group
  const standingsByRoundAndGroup = useMemo(() => {
    const grouped: Record<string, Record<string, TeamStanding[]>> = {};

    allStandings.forEach((standing) => {
      const roundKey = standing.roundName;
      const groupKey = standing.groupName || "Direct Knockout";

      if (!grouped[roundKey]) {
        grouped[roundKey] = {};
      }
      if (!grouped[roundKey][groupKey]) {
        grouped[roundKey][groupKey] = [];
      }

      grouped[roundKey][groupKey].push(standing);
    });

    // Sort standings within each group
    Object.keys(grouped).forEach((roundKey) => {
      Object.keys(grouped[roundKey]).forEach((groupKey) => {
        grouped[roundKey][groupKey].sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
          return b.goalsFor - a.goalsFor;
        });
        // Update positions after sorting
        grouped[roundKey][groupKey].forEach((standing, index) => {
          standing.position = index + 1;
        });
      });
    });

    return grouped;
  }, [allStandings]);

  // Get sorted rounds (later rounds first)
  const sortedRounds = useMemo(() => {
    if (!tournamentStructure) return [];
    return [...tournamentStructure.rounds].sort(
      (a, b) => (b.sequenceOrder || 0) - (a.sequenceOrder || 0)
    );
  }, [tournamentStructure]);

  const standingsColumns = [
    {
      title: "Pos",
      dataIndex: "position",
      key: "position",
      width: 60,
      render: (pos: number, record: TeamStanding) => (
        <div style={{ textAlign: "center" }}>
          {pos <= 3 && pos > 0 ? (
            <Tag color={pos === 1 ? "gold" : pos === 2 ? "#C0C0C0" : "#CD7F32"}>
              {pos}
            </Tag>
          ) : (
            <Text strong>{pos}</Text>
          )}
        </div>
      ),
    },
    {
      title: "Team",
      dataIndex: "teamName",
      key: "teamName",
      render: (name: string, record: TeamStanding) => (
        <Space>
          <Text strong>{name}</Text>
          {record.isAdvanced && (
            <Tag color="green" icon={<TrophyOutlined />}>
              Advanced
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "P",
      dataIndex: "matchesPlayed",
      key: "matchesPlayed",
      width: 50,
      align: "center" as const,
    },
    {
      title: "W",
      dataIndex: "wins",
      key: "wins",
      width: 50,
      align: "center" as const,
      render: (wins: number) => <Text style={{ color: token.colorSuccess }}>{wins}</Text>,
    },
    {
      title: "D",
      dataIndex: "draws",
      key: "draws",
      width: 50,
      align: "center" as const,
    },
    {
      title: "L",
      dataIndex: "losses",
      key: "losses",
      width: 50,
      align: "center" as const,
      render: (losses: number) => <Text style={{ color: token.colorError }}>{losses}</Text>,
    },
    {
      title: "GF",
      dataIndex: "goalsFor",
      key: "goalsFor",
      width: 60,
      align: "center" as const,
    },
    {
      title: "GA",
      dataIndex: "goalsAgainst",
      key: "goalsAgainst",
      width: 60,
      align: "center" as const,
    },
    {
      title: "GD",
      dataIndex: "goalDifference",
      key: "goalDifference",
      width: 70,
      align: "center" as const,
      render: (gd: number) => (
        <Text strong style={{ color: gd > 0 ? token.colorSuccess : gd < 0 ? token.colorError : token.colorText }}>
          {gd > 0 ? `+${gd}` : gd}
        </Text>
      ),
    },
    {
      title: "Pts",
      dataIndex: "points",
      key: "points",
      width: 70,
      align: "center" as const,
      render: (pts: number) => (
        <Text strong style={{ fontSize: 16, color: token.colorPrimary }}>
          {pts}
        </Text>
      ),
    },
  ];

  if (!tournamentStructure || tournamentStructure.rounds.length === 0) {
    return (
      <Card style={{ margin: 24 }}>
        <Empty
          description={
            <div>
              <Text type="secondary">No tournament structure yet.</Text>
              <br />
              <Text type="secondary">Create rounds and groups to see standings.</Text>
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <div className="overview-tab-container" style={{ padding: 24 }}>
      {/* Render group standings fetchers */}
      {allGroups.map((group) => (
        <GroupStandingsFetcher
          key={`${group.roundId}-${group.groupId}`}
          groupId={group.groupId}
          groupName={group.groupName}
          roundName={group.roundName}
          isActive={isActive}
          onStandingsLoaded={handleStandingsLoaded}
        />
      ))}

      <Spin spinning={isLoading || fixturesLoading}>
        {/* Stat Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="Total Rounds"
                value={tournamentStats.totalRounds}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: token.colorPrimary }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="Total Groups"
                value={tournamentStats.totalGroups}
                prefix={<TeamOutlined />}
                valueStyle={{ color: token.colorSuccess }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="Total Teams"
                value={tournamentStats.totalTeams}
                prefix={<TeamOutlined />}
                valueStyle={{ color: token.colorInfo }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="Total Matches"
                value={tournamentStats.totalMatches}
                prefix={<PlayCircleOutlined />}
                valueStyle={{ color: token.colorWarning }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="Completed Matches"
                value={tournamentStats.completedMatches}
                suffix={`/ ${tournamentStats.totalMatches}`}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: token.colorSuccess }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="Ongoing Rounds"
                value={tournamentStats.ongoingRounds}
                prefix={<FireOutlined />}
                valueStyle={{ color: token.colorError }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="Completed Rounds"
                value={tournamentStats.completedRounds}
                suffix={`/ ${tournamentStats.totalRounds}`}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: token.colorSuccess }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="Progress"
                value={tournamentStats.totalMatches > 0 
                  ? Math.round((tournamentStats.completedMatches / tournamentStats.totalMatches) * 100)
                  : 0}
                suffix="%"
                prefix={<BarChartOutlined />}
                valueStyle={{ color: token.colorPrimary }}
              />
            </Card>
          </Col>
        </Row>

        {/* Ongoing Matches Section */}
        {ongoingMatches.length > 0 && (
          <Card
            title={
              <Space>
                <PlayCircleOutlined style={{ color: token.colorSuccess }} />
                <Text strong style={{ fontSize: 18 }}>Live Matches</Text>
                <Tag color="success">{ongoingMatches.length}</Tag>
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              {ongoingMatches.map((match: IFixture) => {
                const _ = currentTime; // Reference currentTime to trigger re-render
                const matchTime = formatMatchTime(
                  match.matchStatus,
                  match.startedAt,
                  match.elapsedTimeSeconds,
                  match.completedAt
                );
                return (
                  <Card
                    key={match.id}
                    size="small"
                    hoverable
                    onClick={() => navigate(`/fixtures/${match.id}`)}
                    style={{
                      cursor: "pointer",
                      border: `1px solid ${token.colorSuccess}`,
                      backgroundColor: token.colorSuccessBg,
                    }}
                  >
                    <Space style={{ width: "100%", justifyContent: "space-between" }}>
                      <Space>
                        <PlayCircleOutlined style={{ color: token.colorSuccess }} />
                        <Text strong>{match.homeTeamName}</Text>
                        <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                          {match.homeTeamScore} - {match.awayTeamScore}
                        </Text>
                        <Text strong>{match.awayTeamName}</Text>
                      </Space>
                      {matchTime && (
                        <Tag
                          color="success"
                          style={{
                            fontSize: 14,
                            fontWeight: "bold",
                            padding: "4px 12px",
                            cursor: "pointer",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/fixtures/${match.id}`);
                          }}
                        >
                          {matchTime}
                        </Tag>
                      )}
                    </Space>
                  </Card>
                );
              })}
            </Space>
          </Card>
        )}

        {/* Standings by Round and Group */}
        {Object.keys(standingsByRoundAndGroup).length === 0 ? (
          <Card>
            <Empty
              description={
                <div>
                  <Text type="secondary">No standings available yet.</Text>
                  <br />
                  <Text type="secondary">
                    Complete some matches to see standings.
                  </Text>
                </div>
              }
            />
          </Card>
        ) : (
          <Space direction="vertical" size={24} style={{ width: "100%" }}>
            {sortedRounds.map((round) => {
              const roundStandings = standingsByRoundAndGroup[round.roundName];
              if (!roundStandings || Object.keys(roundStandings).length === 0) {
                return null;
              }

              return (
                <Card
                  key={round.id}
                  title={
                    <Space>
                      <TrophyOutlined />
                      <Text strong style={{ fontSize: 18 }}>{round.roundName}</Text>
                      <Tag color={
                        round.status === RoundStatus.COMPLETED
                          ? "success"
                          : round.status === RoundStatus.ONGOING
                          ? "processing"
                          : "default"
                      }>
                        {round.status}
                      </Tag>
                    </Space>
                  }
                  extra={
                    <Text type="secondary">
                      Round {round.roundNumber} • {round.roundType.replace("_", " ")}
                    </Text>
                  }
                >
                  <Space direction="vertical" size={16} style={{ width: "100%" }}>
                    {round.roundType === RoundType.GROUP_BASED ? (
                      // Group-based rounds - show standings by group
                      Object.keys(roundStandings)
                        .sort()
                        .map((groupName) => {
                          const groupStandings = roundStandings[groupName];
                          if (groupStandings.length === 0) return null;

                          return (
                            <div key={groupName}>
                              <Divider orientation="left">
                                <Space>
                                  <TeamOutlined />
                                  <Text strong style={{ fontSize: 16 }}>{groupName}</Text>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    ({groupStandings.length} {groupStandings.length === 1 ? "team" : "teams"})
                                  </Text>
                                </Space>
                              </Divider>
                              <div className="standings-table-wrapper">
                                <Table
                                  columns={standingsColumns}
                                  dataSource={groupStandings}
                                  rowKey={(record) => `${record.roundName}-${record.groupName}-${record.teamId}`}
                                  pagination={false}
                                  size="middle"
                                  style={{
                                    backgroundColor: token.colorFillSecondary,
                                    borderRadius: 8,
                                  }}
                                  rowClassName={(record, index) => {
                                    if (index === 0) return "first-place-row";
                                    if (index === 1) return "second-place-row";
                                    if (index === 2) return "third-place-row";
                                    return "";
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      // Direct knockout rounds
                      (() => {
                        const knockoutStandings = roundStandings["Direct Knockout"] || [];
                        if (knockoutStandings.length === 0) return null;

                        return (
                          <div className="standings-table-wrapper">
                            <Table
                              columns={standingsColumns}
                              dataSource={knockoutStandings}
                              rowKey={(record) => `${record.roundName}-${record.teamId}`}
                              pagination={false}
                              size="middle"
                              style={{
                                backgroundColor: "#fafafa",
                                borderRadius: 8,
                              }}
                              rowClassName={(record, index) => {
                                if (index === 0) return "first-place-row";
                                if (index === 1) return "second-place-row";
                                if (index === 2) return "third-place-row";
                                return "";
                              }}
                            />
                          </div>
                        );
                      })()
                    )}
                  </Space>
                </Card>
              );
            })}
          </Space>
        )}
      </Spin>

      <style>{`
        .first-place-row {
          background-color: ${token.colorWarningBg} !important;
          border-left: 4px solid ${token.colorWarning};
        }
        .second-place-row {
          background-color: ${token.colorSuccessBg} !important;
          border-left: 4px solid ${token.colorSuccess};
        }
        .third-place-row {
          background-color: ${token.colorWarningBg} !important;
          border-left: 4px solid ${token.colorWarning};
        }
        .ant-table-tbody > tr:hover > td {
          background-color: ${token.colorPrimaryBg} !important;
        }

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .overview-tab-container {
            padding: 12px !important;
          }

          .standings-table-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            margin-left: -12px;
            margin-right: -12px;
            padding-left: 12px;
            padding-right: 12px;
          }

          .standings-table-wrapper .ant-table {
            min-width: 600px;
          }

          .ant-card {
            margin-left: 0 !important;
            margin-right: 0 !important;
          }

          .ant-card-body {
            padding: 12px !important;
          }

          .ant-statistic-title {
            font-size: 12px !important;
          }

          .ant-statistic-content-value {
            font-size: 18px !important;
          }
        }

        @media (max-width: 480px) {
          .overview-tab-container {
            padding: 8px !important;
          }

          .standings-table-wrapper {
            margin-left: -8px;
            margin-right: -8px;
            padding-left: 8px;
            padding-right: 8px;
          }

          .ant-card-body {
            padding: 8px !important;
          }

          .ant-card-head-title {
            font-size: 14px !important;
          }

          .ant-card-extra {
            font-size: 11px !important;
          }

          .ant-statistic-title {
            font-size: 11px !important;
          }

          .ant-statistic-content-value {
            font-size: 16px !important;
          }

          .ant-divider-inner-text {
            font-size: 13px !important;
          }
        }
      `}</style>
    </div>
  );
}
