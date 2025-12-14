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
  useGetGroupByIdQuery,
  useGetRoundByIdQuery,
  useGetGroupStandingsQuery,
} from "../../../../state/features/manualFixtures/manualFixturesSlice";
import { TournamentStructureResponse } from "../../../../state/features/manualFixtures/manualFixtureTypes";

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

  // Get standings for all groups in previous round
  const previousRoundGroups = previousRound?.groups || [];
  
  const assignedTeamIds = isDirectKnockout
    ? (round?.teams?.filter((t) => t.teamId !== null).map((t) => t.teamId!) || [])
    : (group?.teams?.filter((t) => t.teamId !== null).map((t) => t.teamId!) || []);
  
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
  console.log('[TeamAssignment] Tournament Structure:', tournamentStructure);
  console.log('[TeamAssignment] Rounds:', tournamentStructure?.rounds);

  tournamentStructure?.rounds.forEach((round) => {
    console.log(`[TeamAssignment] Processing round: ${round.roundName} (ID: ${round.id})`);
    console.log(`[TeamAssignment] Round has groups:`, round.groups);

    if (round.groups) {
      round.groups.forEach((grp) => {
        console.log(`[TeamAssignment]   Processing group: ${grp.groupName} (ID: ${grp.id})`);
        console.log(`[TeamAssignment]   Group has teams:`, grp.teams);

        if (grp.teams) {
          grp.teams.forEach((team: any) => {
            console.log(`[TeamAssignment]     Team: ${team.teamName}, teamId: ${team.teamId}, isPlaceholder: ${team.isPlaceholder}`);

            if (team.teamId && !team.isPlaceholder) {
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

              // Track all teams not in current group/round, including same-round teams
              if (!isCurrentGroup && !isCurrentRound) {
                console.log(`[TeamAssignment]     ✓ Adding team ${team.teamName} (${team.teamId}) from ${grp.groupName} to map. isSameRound: ${isSameRoundDifferentGroup}`);
                teamAssignmentMap.set(team.teamId, {
                  groupName: grp.groupName,
                  roundName: round.roundName,
                  groupId: grp.id,
                  roundId: round.id,
                  isSameRound: isSameRoundDifferentGroup,
                });
              } else {
                console.log(`[TeamAssignment]     ✗ Skipping team (current group or round)`);
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
          group.teams.forEach((team) => {
            if (team.teamId && !team.isPlaceholder) {
              if (!previousRoundTeams.find(t => t.teamId === team.teamId)) {
                previousRoundTeams.push({
                  teamId: team.teamId,
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
      if (previousRound.teams) {
        previousRound.teams.forEach((team) => {
          if (team.teamId && !team.isPlaceholder) {
            if (!previousRoundTeams.find(t => t.teamId === team.teamId)) {
              previousRoundTeams.push({
                teamId: team.teamId,
                teamName: team.teamName || "",
              });
            }
          }
        });
      }
    }

    return previousRoundTeams;
  }, [round, previousRound, teams]);

  // Filter teams - exclude those already assigned to current group/round
  // But keep all teams in the list to show which ones are disabled
  const allTeams = availableTeamsForAssignment;

  const handleTeamToggle = (teamId: number, checked: boolean) => {
    // Don't allow toggling if team is already assigned to another group
    const assignment = teamAssignmentMap.get(teamId);
    if (assignment) {
      if (assignment.isSameRound) {
        message.warning(`Team is already assigned to ${assignment.groupName} in the same round. Remove it from that group first.`);
      } else {
        message.warning(`Team is already assigned to ${assignment.groupName} in ${assignment.roundName}`);
      }
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
      // For direct knockout rounds, we might need a different endpoint
      // For now, show a message
      message.warning("Removing teams from direct knockout rounds is not yet supported");
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

        {/* Previous Round Results */}
        {previousRound && previousRoundGroups.length > 0 && (
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
                ?.filter((t) => t.teamId !== null)
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
                const isAssignedToOtherGroup = assignment !== undefined;
                // For same-round groups, disable teams that are in other groups of the same round
                // This prevents assigning the same team to multiple groups in the same round
                const isInSameRoundOtherGroup = !isDirectKnockout && assignment?.isSameRound === true;
                const isDisabled = isAlreadyAssigned || isAssignedToOtherGroup || isInSameRoundOtherGroup;

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
                          {isAssignedToOtherGroup && assignment && (
                            <Tag color={assignment.isSameRound ? "red" : "orange"} style={{ fontSize: 10 }}>
                              {assignment.isSameRound ? `⚠ ${assignment.groupName}` : `In ${assignment.groupName}`}
                            </Tag>
                          )}
                          {isAlreadyAssigned && (
                            <Tag color="blue" style={{ fontSize: 10 }}>
                              Current
                            </Tag>
                          )}
                        </Space>
                        {isAssignedToOtherGroup && assignment && (
                          <Text type="secondary" style={{ fontSize: 10, fontStyle: "italic" }}>
                            {assignment.isSameRound
                              ? `Already in ${assignment.groupName} (same round)`
                              : `Already assigned to ${assignment.groupName} in ${assignment.roundName}`
                            }
                          </Text>
                        )}
                        {performance && !isAssignedToOtherGroup && (
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
