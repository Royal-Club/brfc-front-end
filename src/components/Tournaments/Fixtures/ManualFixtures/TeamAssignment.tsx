import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Button,
  Space,
  message,
  Alert,
  Typography,
  Checkbox,
  Row,
  Col,
  Card,
  Empty,
  Tag,
  Divider,
  Popconfirm,
} from "antd";
import {
  UserAddOutlined,
  TeamOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  useAssignTeamsToGroupMutation,
  useAssignTeamsToRoundMutation,
  useRemoveTeamFromGroupMutation,
  useRemoveTeamFromRoundMutation,
  useGetGroupByIdQuery,
  useGetRoundByIdQuery,
  useGetGroupStandingsQuery,
} from "../../../../state/features/manualFixtures/manualFixturesSlice";
import { TournamentStructureResponse } from "../../../../state/features/manualFixtures/manualFixtureTypes";
import { useGetFixturesQuery } from "../../../../state/features/fixtures/fixturesSlice";
import { IFixture } from "../../../../state/features/fixtures/fixtureTypes";

const { Text, Title } = Typography;

interface TeamAssignmentProps {
  groupId: number | null;
  roundId: number | null;
  roundType?: "GROUP_BASED" | "DIRECT_KNOCKOUT";
  teams: Array<{ teamId: number; teamName: string }>;
  tournamentStructure?: TournamentStructureResponse;
  isModalVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TeamAssignment({
  groupId,
  roundId,
  roundType,
  teams,
  tournamentStructure,
  isModalVisible,
  onClose,
  onSuccess,
}: TeamAssignmentProps) {
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);

  const [assignTeamsToGroup, { isLoading: isAssigningToGroup }] = useAssignTeamsToGroupMutation();
  const [assignTeamsToRound, { isLoading: isAssigningToRound }] = useAssignTeamsToRoundMutation();
  const [removeTeam, { isLoading: isRemoving }] = useRemoveTeamFromGroupMutation();
  const [removeTeamFromRound] = useRemoveTeamFromRoundMutation();

  const { data: groupData, isLoading: isFetchingGroup } = useGetGroupByIdQuery(
    { groupId: groupId! },
    { skip: !groupId }
  );

  const { data: roundData, isLoading: isFetchingRound } = useGetRoundByIdQuery(
    { roundId: roundId! },
    { skip: !roundId }
  );

  const group = groupData?.content;
  const round = roundData?.content;
  
  const isDirectKnockout = roundType === "DIRECT_KNOCKOUT" || round?.roundType === "DIRECT_KNOCKOUT";
  
  // Find previous round
  const previousRound = round && round.sequenceOrder && round.sequenceOrder > 1
    ? tournamentStructure?.rounds.find((r) => r.sequenceOrder === round.sequenceOrder - 1)
    : null;
  
  // Get tournament ID from round or tournament structure
  const tournamentId = round?.tournamentId || tournamentStructure?.tournamentId;
  
  // Fetch fixtures to calculate standings for DIRECT_KNOCKOUT rounds
  const { data: fixturesData } = useGetFixturesQuery(
    { tournamentId: tournamentId! },
    { skip: !tournamentId || !previousRound || previousRound.roundType !== "DIRECT_KNOCKOUT" }
  );
  const fixtures = fixturesData?.content || [];

  // Get standings for all groups in previous round
  const previousRoundGroups = previousRound?.groups || [];
  
  const assignedTeamIds = isDirectKnockout
    ? (round?.teams?.filter((t) => {
        const identifier = t.teamId ?? t.id;
        return identifier !== null && identifier !== undefined;
      }).map((t) => t.teamId ?? t.id) || [])
    : (group?.teams?.filter((t) => {
        const identifier = t.teamId ?? t.id;
        return identifier !== null && identifier !== undefined;
      }).map((t) => t.teamId ?? t.id) || []);
  
  const isAssigning = isAssigningToGroup || isAssigningToRound;
  const isFetching = isFetchingGroup || isFetchingRound;

  // Create a map of all teams assigned to groups across the tournament
  const teamAssignmentMap = new Map<number, {
    groupName: string;
    roundName: string;
    groupId: number;
    roundId: number;
    isSameRound?: boolean;
  }>();

  // Find the current round to check for same-round assignments
  const currentRound = tournamentStructure?.rounds.find((r) => {
    if (isDirectKnockout) {
      return r.id === roundId;
    } else {
      return r.groups?.some((g) => g.id === groupId);
    }
  });

  // Iterate through all rounds and groups to find team assignments
  // IMPORTANT: Only track teams from the SAME round to prevent conflicts
  // Teams from previous rounds should be available for import
  console.log('[TeamAssignment] Tournament Structure:', tournamentStructure);
  console.log('[TeamAssignment] Rounds:', tournamentStructure?.rounds);

  tournamentStructure?.rounds.forEach((round) => {
    console.log(`[TeamAssignment] Processing round: ${round.roundName} (ID: ${round.id})`);
    console.log(`[TeamAssignment] Round has groups:`, round.groups);

    // Only process teams from the SAME round as the current assignment
    // Skip previous rounds - teams from previous rounds should be available for import
    const isSameRound = currentRound && round.id === currentRound.id;
    if (!isSameRound) {
      console.log(`[TeamAssignment]   Skipping round ${round.roundName} (different round - teams should be available for import)`);
      return;
    }

    if (round.groups) {
      round.groups.forEach((grp) => {
        console.log(`[TeamAssignment]   Processing group: ${grp.groupName} (ID: ${grp.id})`);
        console.log(`[TeamAssignment]   Group has teams:`, grp.teams);

        if (grp.teams) {
          grp.teams.forEach((team: any) => {
            // Use teamId if available, otherwise use id
            const teamIdentifier = team.teamId ?? team.id;
            console.log(`[TeamAssignment]     Team: ${team.teamName}, teamId: ${teamIdentifier}, isPlaceholder: ${team.isPlaceholder}`);

            if (teamIdentifier && !team.isPlaceholder) {
              // Only track if not the current group (for group assignment) or current round (for round assignment)
              const isCurrentGroup = !isDirectKnockout && groupId === grp.id;
              const isCurrentRound = isDirectKnockout && roundId === round.id;

              // For group-based rounds, track teams in other groups of the SAME round
              // This is critical - teams in same round should be disabled
              const isSameRoundDifferentGroup = !isDirectKnockout &&
                currentRound &&
                round.id === currentRound.id &&
                grp.id !== groupId;

              console.log(`[TeamAssignment]     isCurrentGroup: ${isCurrentGroup}, isCurrentRound: ${isCurrentRound}, isSameRoundDifferentGroup: ${isSameRoundDifferentGroup}`);

              // Only track teams from the SAME round (different groups)
              // Teams from previous rounds are allowed and should NOT be in this map
              if (!isCurrentGroup && !isCurrentRound && isSameRoundDifferentGroup) {
                console.log(`[TeamAssignment]     ✓ Adding team ${team.teamName} (${teamIdentifier}) from ${grp.groupName} to map (same round, different group)`);
                teamAssignmentMap.set(teamIdentifier, {
                  groupName: grp.groupName,
                  roundName: round.roundName,
                  groupId: grp.id,
                  roundId: round.id,
                  isSameRound: true,
                });
              } else {
                console.log(`[TeamAssignment]     ✗ Skipping team (current group/round or different round)`);
              }
            }
          });
        } else {
          console.log(`[TeamAssignment]   No teams in group ${grp.groupName}`);
        }
      });
    } else {
      console.log(`[TeamAssignment] No groups in round ${round.roundName}`);
    }
  });

  console.log('[TeamAssignment] Current Round:', currentRound?.roundName);
  console.log('[TeamAssignment] Current Group ID:', groupId);
  console.log('[TeamAssignment] Team Assignment Map:', Array.from(teamAssignmentMap.entries()));

  // Create a map of team performance from previous round
  const teamPerformanceMap = new Map<number, {
    groupName?: string;
    position?: number;
    points?: number;
    wins?: number;
    draws?: number;
    losses?: number;
    goalDifference?: number;
    matchesPlayed?: number;
  }>();

  previousRoundGroups.forEach((group) => {
    if (group.standings) {
      group.standings.forEach((standing) => {
        if (standing.teamId) {
          teamPerformanceMap.set(standing.teamId, {
            groupName: group.groupName,
            position: standing.position ?? undefined,
            points: standing.points ?? undefined,
            wins: standing.wins ?? undefined,
            draws: standing.draws ?? undefined,
            losses: standing.losses ?? undefined,
            goalDifference: standing.goalDifference ?? undefined,
            matchesPlayed: standing.matchesPlayed ?? undefined,
          });
        }
      });
    }
  });

  useEffect(() => {
    if (isModalVisible) {
      setSelectedTeamIds([]);
    }
  }, [isModalVisible]);

  // Filter teams based on round sequence
  // For Round 1 (sequenceOrder === 1), show all tournament teams
  // For Round 2+, show only teams that advanced from the previous round
  const availableTeamsForAssignment = useMemo(() => {
    // If no round data or it's Round 1, show all tournament teams
    if (!round || !round.sequenceOrder || round.sequenceOrder === 1) {
      return teams;
    }

    // For Round 2+, get teams from the previous round
    if (!previousRound) {
      // No previous round found, return empty array (shouldn't happen, but handle gracefully)
      console.warn(`No previous round found for round ${round.roundName} (sequence ${round.sequenceOrder})`);
      return [];
    }

    // Get teams from previous round based on round type
    const previousRoundTeams: Array<{ teamId: number; teamName: string }> = [];

    if (previousRound.roundType === "GROUP_BASED" && previousRound.groups) {
      // For GROUP_BASED rounds, get all teams from all groups' standings
      // If standings exist, use them (more accurate as they show actual participation)
      // Otherwise, fall back to teams in groups
      previousRound.groups.forEach((group) => {
        if (group.standings && group.standings.length > 0) {
          // Use standings (shows teams that actually played)
          group.standings.forEach((standing) => {
            if (standing.teamId && !previousRoundTeams.find(t => t.teamId === standing.teamId)) {
              previousRoundTeams.push({
                teamId: standing.teamId,
                teamName: standing.teamName,
              });
            }
          });
        } else if (group.teams) {
          // Fall back to teams in group if no standings
          // Teams can have either teamId or id field
          group.teams.forEach((team) => {
            // Use teamId if available, otherwise use id
            const teamIdentifier = team.teamId ?? team.id;
            if (teamIdentifier && !team.isPlaceholder) {
              if (!previousRoundTeams.find(t => t.teamId === teamIdentifier)) {
                previousRoundTeams.push({
                  teamId: teamIdentifier,
                  teamName: team.teamName || "",
                });
              }
            }
          });
        }
      });
    } else if (previousRound.roundType === "DIRECT_KNOCKOUT") {
      // For DIRECT_KNOCKOUT rounds, get all teams from the round
      // Teams are stored directly in the round's teams field
      // Teams can have either teamId or id field
      if (previousRound.teams) {
        previousRound.teams.forEach((team) => {
          // Use teamId if available, otherwise use id
          const teamIdentifier = team.teamId ?? team.id;
          if (teamIdentifier && !team.isPlaceholder) {
            if (!previousRoundTeams.find(t => t.teamId === teamIdentifier)) {
              previousRoundTeams.push({
                teamId: teamIdentifier,
                teamName: team.teamName || "",
              });
            }
          }
        });
      }
    }

    return previousRoundTeams;
  }, [round, previousRound, teams]);

  // Calculate standings for DIRECT_KNOCKOUT previous round from fixtures
  const previousRoundStandings = useMemo(() => {
    if (!previousRound || previousRound.roundType !== "DIRECT_KNOCKOUT" || !previousRound.teams) {
      return [];
    }

    // Get matches for the previous round
    const roundMatches = fixtures.filter((f: IFixture) => {
      const matchesTournament = f.tournamentId === tournamentId;
      if (!matchesTournament) return false;
      const fixtureRoundNumber = f.roundNumber ?? f.round;
      const matchesByRoundNumber = fixtureRoundNumber === previousRound.roundNumber;
      const matchesByRoundId = f.round === previousRound.id;
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

    // Initialize team stats from previousRound.teams
    previousRound.teams.forEach((team: any) => {
      const identifier = team.teamId ?? team.id;
      if (identifier && !team.isPlaceholder) {
        teamStats[identifier] = {
          teamId: identifier,
          teamName: team.teamName || `Team ${identifier}`,
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

    // Process completed matches
    roundMatches.forEach((match: IFixture) => {
      if (match.matchStatus !== "COMPLETED") return;

      const homeTeamId = match.homeTeamId;
      const awayTeamId = match.awayTeamId;
      const homeScore = match.homeTeamScore || 0;
      const awayScore = match.awayTeamScore || 0;

      // Initialize teams from matches if not already in stats
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

    // Convert to array and sort by points, goal difference, goals for
    return Object.values(teamStats)
      .filter((stat) => stat.matchesPlayed > 0 || previousRound.teams?.some((t: any) => (t.teamId ?? t.id) === stat.teamId))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      })
      .map((stat, index) => ({
        ...stat,
        position: index + 1,
      }));
  }, [previousRound, fixtures, tournamentId]);

  // Filter teams - exclude those already assigned to current group/round
  // But keep all teams in the list to show which ones are disabled
  const allTeams = availableTeamsForAssignment;

  const handleTeamToggle = (teamId: number, checked: boolean) => {
    // Don't allow toggling if team is already assigned to another group in the SAME round
    // Teams from previous rounds are allowed
    const assignment = teamAssignmentMap.get(teamId);
    if (assignment && assignment.isSameRound) {
      message.warning(`Team is already assigned to ${assignment.groupName} in the same round. Remove it from that group first.`);
      return;
    }

    // Also check if already assigned to current group/round
    if (assignedTeamIds.includes(teamId)) {
      message.warning("Team is already assigned to this group/round");
      return;
    }

    if (checked) {
      setSelectedTeamIds([...selectedTeamIds, teamId]);
    } else {
      setSelectedTeamIds(selectedTeamIds.filter((id) => id !== teamId));
    }
  };

  const handleAssignTeams = async () => {
    if (isDirectKnockout) {
      if (!roundId) {
        message.error("No round selected");
        return;
      }
    } else {
      if (!groupId) {
        message.error("No group selected");
        return;
      }
    }

    if (selectedTeamIds.length === 0) {
      message.warning("Please select at least one team");
      return;
    }

    try {
      if (isDirectKnockout) {
        await assignTeamsToRound({
          roundId: roundId!,
          teamIds: selectedTeamIds,
        }).unwrap();
      } else {
        await assignTeamsToGroup({
          groupId: groupId!,
          teamIds: selectedTeamIds,
        }).unwrap();
      }

      message.success(`${selectedTeamIds.length} team(s) assigned successfully`);
      setSelectedTeamIds([]);
      onSuccess();
    } catch (error: any) {
      console.error("Failed to assign teams:", error);
      // Error already shown by API slice
    }
  };

  const handleRemoveTeam = async (teamId: number, teamName?: string) => {
    if (isDirectKnockout) {
      if (!roundId) {
        message.error("No round selected");
        return;
      }

      try {
        await removeTeamFromRound({ roundId, teamId }).unwrap();
        message.success(`Team "${teamName || 'Team'}" removed successfully`);
        onSuccess();
      } catch (error: any) {
        console.error("Failed to remove team:", error);
        // Error already shown by API slice
      }
      return;
    }

    if (!groupId) {
      message.error("No group selected");
      return;
    }

    try {
      await removeTeam({ groupId, teamId }).unwrap();
      message.success(`Team "${teamName || 'Team'}" removed successfully`);
      onSuccess();
    } catch (error: any) {
      console.error("Failed to remove team:", error);
      // Error already shown by API slice
    }
  };

  const handleCancel = () => {
    setSelectedTeamIds([]);
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <UserAddOutlined style={{ fontSize: 20, color: "#1890ff" }} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>
            Assign Teams to {isDirectKnockout ? (round?.roundName || "Round") : (group?.groupName || "Group")}
          </span>
        </Space>
      }
      open={isModalVisible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Close
        </Button>,
        <Button
          key="assign"
          type="primary"
          icon={<UserAddOutlined />}
          loading={isAssigning}
          onClick={handleAssignTeams}
          disabled={selectedTeamIds.length === 0}
        >
          Assign {selectedTeamIds.length > 0 ? `${selectedTeamIds.length} ` : ""}Team(s)
        </Button>,
      ]}
    >
      <div style={{ marginTop: 16 }}>
        {(group || round) && (
          <Alert
            message="Team Assignment"
            description={
              <Space direction="vertical" size={4}>
                {isDirectKnockout ? (
                  <>
                    <Text>
                      Round: <Text strong>{round?.roundName}</Text>
                    </Text>
                    <Text>
                      Type: <Text strong>Direct Knockout</Text>
                    </Text>
                    <Text>
                      Current Teams: <Text strong>{assignedTeamIds.length}</Text>
                    </Text>
                    {previousRound && (
                      <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
                        Teams from: {previousRound.roundName} (Sequence {previousRound.sequenceOrder})
                      </Text>
                    )}
                    {round && round.sequenceOrder && round.sequenceOrder > 1 && (
                      <Alert
                        message="Advanced Teams Only"
                        description={`Only teams from ${previousRound?.roundName || "the previous round"} can be assigned to this round.`}
                        type="info"
                        showIcon
                        style={{ marginTop: 8, fontSize: 12 }}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <Text>
                      Group: <Text strong>{group?.groupName}</Text>
                    </Text>
                    {group?.maxTeams && (
                      <Text>
                        Current: <Text strong>{assignedTeamIds.length}</Text> /{" "}
                        <Text strong>{group.maxTeams}</Text> (max)
                      </Text>
                    )}
                  </>
                )}
              </Space>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Previous Round Results - GROUP_BASED */}
        {previousRound && previousRound.roundType === "GROUP_BASED" && previousRoundGroups.length > 0 && (
          <Card
            size="small"
            title={
              <Space>
                <Text strong>Previous Round: {previousRound.roundName}</Text>
                <Tag color="blue">{previousRoundGroups.length} Group{previousRoundGroups.length !== 1 ? 's' : ''}</Tag>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {previousRoundGroups.map((group) => (
                <Card
                  key={group.id}
                  size="small"
                  type="inner"
                  title={
                    <Space>
                      <Text strong>{group.groupName}</Text>
                      {group.standings && group.standings.length > 0 && (
                        <Tag color="green">{group.standings.length} Teams</Tag>
                      )}
                    </Space>
                  }
                >
                  {group.standings && group.standings.length > 0 ? (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                            <th style={{ padding: "4px 8px", textAlign: "left" }}>Pos</th>
                            <th style={{ padding: "4px 8px", textAlign: "left" }}>Team</th>
                            <th style={{ padding: "4px 8px", textAlign: "center" }}>P</th>
                            <th style={{ padding: "4px 8px", textAlign: "center" }}>W</th>
                            <th style={{ padding: "4px 8px", textAlign: "center" }}>D</th>
                            <th style={{ padding: "4px 8px", textAlign: "center" }}>L</th>
                            <th style={{ padding: "4px 8px", textAlign: "center" }}>GD</th>
                            <th style={{ padding: "4px 8px", textAlign: "center" }}>Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.standings.map((standing) => (
                            <tr
                              key={standing.teamId}
                              style={{
                                borderBottom: "1px solid #f0f0f0",
                              }}
                            >
                              <td style={{ padding: "4px 8px" }}>
                                <Tag color={standing.position === 1 ? "gold" : standing.position === 2 ? "default" : undefined}>
                                  {standing.position}
                                </Tag>
                              </td>
                              <td style={{ padding: "4px 8px" }}>
                                <Text strong={standing.position !== null && standing.position !== undefined && standing.position <= 2}>
                                  {standing.teamName}
                                </Text>
                              </td>
                              <td style={{ padding: "4px 8px", textAlign: "center" }}>
                                {standing.matchesPlayed}
                              </td>
                              <td style={{ padding: "4px 8px", textAlign: "center" }}>
                                {standing.wins}
                              </td>
                              <td style={{ padding: "4px 8px", textAlign: "center" }}>
                                {standing.draws}
                              </td>
                              <td style={{ padding: "4px 8px", textAlign: "center" }}>
                                {standing.losses}
                              </td>
                              <td style={{ padding: "4px 8px", textAlign: "center" }}>
                                <Text style={{ color: standing.goalDifference && standing.goalDifference > 0 ? "#52c41a" : standing.goalDifference && standing.goalDifference < 0 ? "#ff4d4f" : undefined }}>
                                  {standing.goalDifference && standing.goalDifference > 0 ? `+${standing.goalDifference}` : standing.goalDifference}
                                </Text>
                              </td>
                              <td style={{ padding: "4px 8px", textAlign: "center" }}>
                                <Text strong>{standing.points}</Text>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Text type="secondary">No standings available</Text>
                  )}
                </Card>
              ))}
            </Space>
          </Card>
        )}

        {/* Previous Round Results - DIRECT_KNOCKOUT */}
        {previousRound && previousRound.roundType === "DIRECT_KNOCKOUT" && previousRoundStandings.length > 0 && (
            <Card
              size="small"
              title={
                <Space>
                  <Text strong>Previous Round: {previousRound.roundName}</Text>
                  <Tag color="blue">Direct Knockout</Tag>
                  <Tag color="green">{previousRoundStandings.length} Team{previousRoundStandings.length !== 1 ? 's' : ''}</Tag>
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              {previousRoundStandings.length > 0 ? (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <th style={{ padding: "4px 8px", textAlign: "left" }}>Pos</th>
                        <th style={{ padding: "4px 8px", textAlign: "left" }}>Team</th>
                        <th style={{ padding: "4px 8px", textAlign: "center" }}>P</th>
                        <th style={{ padding: "4px 8px", textAlign: "center" }}>W</th>
                        <th style={{ padding: "4px 8px", textAlign: "center" }}>D</th>
                        <th style={{ padding: "4px 8px", textAlign: "center" }}>L</th>
                        <th style={{ padding: "4px 8px", textAlign: "center" }}>GD</th>
                        <th style={{ padding: "4px 8px", textAlign: "center" }}>Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previousRoundStandings.map((standing: any) => (
                        <tr
                          key={standing.teamId}
                          style={{
                            borderBottom: "1px solid #f0f0f0",
                          }}
                        >
                          <td style={{ padding: "4px 8px" }}>
                            <Tag color={standing.position === 1 ? "gold" : standing.position === 2 ? "default" : undefined}>
                              {standing.position}
                            </Tag>
                          </td>
                          <td style={{ padding: "4px 8px" }}>
                            <Text strong={standing.position !== null && standing.position !== undefined && standing.position <= 2}>
                              {standing.teamName}
                            </Text>
                          </td>
                          <td style={{ padding: "4px 8px", textAlign: "center" }}>
                            {standing.matchesPlayed}
                          </td>
                          <td style={{ padding: "4px 8px", textAlign: "center" }}>
                            {standing.wins}
                          </td>
                          <td style={{ padding: "4px 8px", textAlign: "center" }}>
                            {standing.draws}
                          </td>
                          <td style={{ padding: "4px 8px", textAlign: "center" }}>
                            {standing.losses}
                          </td>
                          <td style={{ padding: "4px 8px", textAlign: "center" }}>
                            <Text style={{ color: standing.goalDifference && standing.goalDifference > 0 ? "#52c41a" : standing.goalDifference && standing.goalDifference < 0 ? "#ff4d4f" : undefined }}>
                              {standing.goalDifference && standing.goalDifference > 0 ? `+${standing.goalDifference}` : standing.goalDifference}
                            </Text>
                          </td>
                          <td style={{ padding: "4px 8px", textAlign: "center" }}>
                            <Text strong>{standing.points}</Text>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Text type="secondary">No teams available</Text>
              )}
            </Card>
        )}

        {/* Currently Assigned Teams */}
        {assignedTeamIds.length > 0 && (
          <Card
            size="small"
            title={
              <Space>
                <TeamOutlined />
                <Text strong>Currently Assigned Teams</Text>
                <Tag color="blue">{assignedTeamIds.length}</Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  (Remove teams from Group Details)
                </Text>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={[8, 8]}>
              {(isDirectKnockout ? round?.teams : group?.teams)
                ?.filter((t) => {
                  const identifier = t.teamId ?? t.id;
                  return identifier !== null && identifier !== undefined;
                })
                .map((team) => {
                  const teamIdentifier = team.teamId ?? team.id;
                  return { ...team, teamId: teamIdentifier };
                })
                .map((team) => (
                  <Col key={team.id} xs={24} sm={12} md={8}>
                    <Card
                      size="small"
                      style={{
                        borderColor: "#1890ff",
                      }}
                    >
                      <Space>
                        <TeamOutlined />
                        <Text strong>{team.teamName}</Text>
                      </Space>
                    </Card>
                  </Col>
                ))}
            </Row>
          </Card>
        )}

        <Divider />

        {/* Available Teams */}
        <Card
          size="small"
          title={
            <Space>
              <Text strong>
                {round && round.sequenceOrder && round.sequenceOrder > 1 
                  ? `Teams from ${previousRound?.roundName || "Previous Round"}` 
                  : "All Teams"}
              </Text>
              <Tag color="green">{allTeams.filter(t => !teamAssignmentMap.has(t.teamId) && !assignedTeamIds.includes(t.teamId)).length} available</Tag>
              {teamAssignmentMap.size > 0 && (
                <Tag color="orange">{teamAssignmentMap.size} already assigned</Tag>
              )}
              {selectedTeamIds.length > 0 && (
                <Tag color="blue">{selectedTeamIds.length} selected</Tag>
              )}
            </Space>
          }
        >
          {allTeams.length > 0 ? (
            <Row gutter={[8, 8]}>
              {allTeams.map((team) => {
                const performance = teamPerformanceMap.get(team.teamId);
                const assignment = teamAssignmentMap.get(team.teamId);
                const isAlreadyAssigned = assignedTeamIds.includes(team.teamId);
                // Only disable if team is assigned to another group in the SAME round
                // Teams from previous rounds should be available for import
                const isAssignedToOtherGroupInSameRound = assignment !== undefined && assignment.isSameRound === true;
                const isDisabled = isAlreadyAssigned || isAssignedToOtherGroupInSameRound;

                return (
                  <Col key={team.teamId} xs={24} sm={12} md={8}>
                    <Checkbox
                      checked={selectedTeamIds.includes(team.teamId)}
                      disabled={isDisabled}
                      onChange={(e) => handleTeamToggle(team.teamId, e.target.checked)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: `1px solid ${
                          isDisabled
                            ? "#d9d9d9"
                            : selectedTeamIds.includes(team.teamId)
                            ? "#1890ff"
                            : "#d9d9d9"
                        }`,
                        borderRadius: 6,
                        transition: "all 0.3s",
                        opacity: isDisabled ? 0.6 : 1,
                      }}
                    >
                      <Space direction="vertical" size={2} style={{ width: "100%" }}>
                        <Space>
                          <TeamOutlined />
                          <Text
                            strong={performance?.position !== undefined && performance.position <= 2}
                            type={isDisabled ? "secondary" : undefined}
                          >
                            {team.teamName}
                          </Text>
                          {isAssignedToOtherGroupInSameRound && assignment && (
                            <Tag color="red" style={{ fontSize: 10 }}>
                              ⚠ {assignment.groupName}
                            </Tag>
                          )}
                          {isAlreadyAssigned && (
                            <Tag color="blue" style={{ fontSize: 10 }}>
                              Current
                            </Tag>
                          )}
                        </Space>
                        {isAssignedToOtherGroupInSameRound && assignment && (
                          <Text type="secondary" style={{ fontSize: 10, fontStyle: "italic" }}>
                            Already in {assignment.groupName} (same round)
                          </Text>
                        )}
                        {performance && !isAssignedToOtherGroupInSameRound && (
                          <Space size={4} style={{ fontSize: 11 }}>
                            {performance.groupName && (
                              <Tag color="blue" style={{ fontSize: 10 }}>
                                {performance.groupName}
                              </Tag>
                            )}
                            {performance.position && (
                              <Tag color={performance.position === 1 ? "gold" : performance.position === 2 ? "default" : undefined} style={{ fontSize: 10 }}>
                                Pos: {performance.position}
                              </Tag>
                            )}
                            {performance.points !== undefined && (
                              <Text type="secondary" style={{ fontSize: 10 }}>
                                {performance.points} pts
                              </Text>
                            )}
                            {performance.goalDifference !== undefined && (
                              <Text type="secondary" style={{ fontSize: 10, color: performance.goalDifference > 0 ? "#52c41a" : performance.goalDifference < 0 ? "#ff4d4f" : undefined }}>
                                GD: {performance.goalDifference > 0 ? `+${performance.goalDifference}` : performance.goalDifference}
                              </Text>
                            )}
                          </Space>
                        )}
                      </Space>
                    </Checkbox>
                  </Col>
                );
              })}
            </Row>
          ) : (
            <Empty
              description="No teams available"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Card>
      </div>
    </Modal>
  );
}
