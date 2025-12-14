import React, { useCallback, useEffect, useState } from "react";
import {
  Card,
  Space,
  Button,
  Typography,
  Tag,
  Row,
  Col,
  Statistic,
  message,
  Drawer,
  Empty,
  Tooltip,
  Popconfirm,
  Divider,
  Alert,
  Table,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  TrophyOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserAddOutlined,
  BarChartOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../../../../state/store";
import {
  setSelectedNode,
  setShowRoundModal,
  setShowGroupModal,
  setShowTeamAssignment,
  setShowMatchGeneration,
  setShowRoundMatchGeneration,
  setShowDetailsDrawer,
  setShowTeamAdvancement,
  setRoundToComplete,
  closeAllModals,
} from "../../../../../state/features/manualFixtures/manualFixturesUISlice";
import { TournamentStructureResponse, RoundStatus, RoundType, TournamentRoundResponse } from "../../../../../state/features/manualFixtures/manualFixtureTypes";
import TournamentFlowVisualization from "../TournamentFlowVisualization";
import RoundManagement from "../RoundManagement";
import GroupManagement from "../GroupManagement";
import TeamAssignment from "../TeamAssignment";
import GroupMatchGenerationModal from "../GroupMatchGenerationModal";
import RoundMatchGenerationModal from "../RoundMatchGenerationModal";
import GroupMatchesView from "../GroupMatchesView";
import TeamAdvancementModal from "../TeamAdvancementModal";
import {
  useDeleteRoundMutation,
  useDeleteGroupMutation,
  useStartRoundMutation,
  useCompleteRoundMutation,
  useGetGroupStandingsQuery,
  useCreateGroupMutation,
  useRemoveTeamFromGroupMutation,
} from "../../../../../state/features/manualFixtures/manualFixturesSlice";
import { useGetFixturesQuery } from "../../../../../state/features/fixtures/fixturesSlice";
import { IFixture } from "../../../../../state/features/fixtures/fixtureTypes";
import { formatMatchTime, isMatchOngoing } from "../../../../../utils/matchTimeUtils";
import { GroupFormat } from "../../../../../state/features/manualFixtures/manualFixtureTypes";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

interface InteractiveTournamentTabProps {
  tournamentId: number;
  teams: Array<{ teamId: number; teamName: string }>;
  tournamentStructure?: TournamentStructureResponse;
  isLoading: boolean;
  onRefresh: () => void;
  isActive?: boolean;
}

export default function InteractiveTournamentTab({
  tournamentId,
  teams,
  tournamentStructure,
  isLoading,
  onRefresh,
  isActive = false,
}: InteractiveTournamentTabProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Get UI state from Redux
  const {
    selectedNode,
    showRoundModal,
    showGroupModal,
    showTeamAssignment,
    showMatchGeneration,
    showRoundMatchGeneration,
    showDetailsDrawer,
    showTeamAdvancement,
    roundToComplete,
  } = useSelector((state: RootState) => state.manualFixturesUI);

  const [deleteRound] = useDeleteRoundMutation();
  const [deleteGroup] = useDeleteGroupMutation();
  const [startRound, { isLoading: isStartingRound }] = useStartRoundMutation();
  const [completeRound, { isLoading: isCompletingRound }] = useCompleteRoundMutation();
  const [removeTeamFromGroup, { isLoading: isRemovingTeam }] = useRemoveTeamFromGroupMutation();
  const [createGroup] = useCreateGroupMutation();

  // Get standings for selected group (only when group is selected)
  const { data: standingsData } = useGetGroupStandingsQuery(
    { groupId: selectedNode?.type === "group" ? selectedNode.id : 0 },
    { skip: selectedNode?.type !== "group" || !selectedNode.id }
  );

  // Fetch fixtures for the tournament to show ongoing matches
  // Only fetch when tab is active to avoid unnecessary API calls
  const { data: fixturesData, refetch: refetchFixtures } = useGetFixturesQuery(
    { tournamentId },
    { skip: !isActive }
  );
  const fixtures = fixturesData?.content || [];
  
  // Check if there are ongoing matches for display purposes
  const hasOngoingMatches = fixtures.some(
    (f) => f.matchStatus === "ONGOING" || f.matchStatus === "PAUSED"
  );
  
  // Update time every second for ongoing matches display (client-side only, no API calls)
  useEffect(() => {
    if (!hasOngoingMatches || !isActive) return;
    
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [hasOngoingMatches, isActive]);
  
  // Refetch fixtures when tab becomes active
  useEffect(() => {
    if (isActive) {
      refetchFixtures();
    }
  }, [isActive, refetchFixtures]);

  // Close drawer when selectedNode becomes null
  useEffect(() => {
    if (!selectedNode && showDetailsDrawer) {
      dispatch(setShowDetailsDrawer(false));
    }
  }, [selectedNode, showDetailsDrawer, dispatch]);
  
  const finalFixtures = fixtures;

  const handleNodeClick = useCallback((nodeId: string, nodeType: string, data: any) => {
    if (nodeType === "roundNode") {
      const roundId = parseInt(nodeId.replace("round-", ""));
      const round = tournamentStructure?.rounds.find((r) => r.id === roundId);
      if (round) {
        dispatch(setSelectedNode({
          type: "round",
          id: roundId,
          data: round,
        }));
        dispatch(setShowDetailsDrawer(true));
      }
    } else if (nodeType === "groupNode") {
      const groupId = parseInt(nodeId.replace("group-", ""));
      const round = tournamentStructure?.rounds.find((r) =>
        r.groups?.some((g) => g.id === groupId)
      );
      const group = round?.groups?.find((g) => g.id === groupId);
      if (group && round) {
        dispatch(setSelectedNode({
          type: "group",
          id: groupId,
          data: { ...group, roundId: round.id },
        }));
        dispatch(setShowDetailsDrawer(true));
      }
    }
  }, [tournamentStructure, dispatch]);

  const handleCreateRound = () => {
    dispatch(setSelectedNode(null));
    dispatch(setShowRoundModal(true));
  };

  const handleEditRound = (roundId?: number) => {
    if (roundId) {
      dispatch(setSelectedNode({ type: "round", id: roundId, data: {} }));
    }
    dispatch(setShowRoundModal(true));
  };

  const handleDeleteRound = async (roundId: number) => {
    try {
      // Close drawer and modals before deleting
      dispatch(closeAllModals());
      
      await deleteRound({ roundId }).unwrap();
      message.success("Round deleted successfully");
      onRefresh();
    } catch (error: any) {
      // Error handled by API slice
    }
  };

  const handleStartRound = async (roundId: number) => {
    try {
      await startRound({ roundId }).unwrap();
      message.success("Round started successfully");
      dispatch(setSelectedNode(null));
      onRefresh();
    } catch (error: any) {
      // Error message already shown by API slice
      // Additional handling if needed
      if (error?.data?.message?.includes("previous round")) {
        // Error already displayed by API slice
      }
    }
  };

  const handleCompleteRound = async (roundId: number) => {
    // Find the round to show in modal
    const round = tournamentStructure?.rounds.find((r) => r.id === roundId);
    if (!round) return;

    // Validate that all matches are completed
    const allMatchesCompleted = round.totalMatches > 0 && round.completedMatches === round.totalMatches;
    
    // For group-based rounds, also check that all groups have completed matches
    if (round.roundType === RoundType.GROUP_BASED && round.groups) {
      const allGroupsCompleted = round.groups.every((group) => {
        return group.totalMatches > 0 && group.completedMatches === group.totalMatches;
      });

      if (!allGroupsCompleted) {
        const incompleteGroups = round.groups.filter(
          (group) => !(group.totalMatches > 0 && group.completedMatches === group.totalMatches)
        );
        message.error(
          `Cannot complete round. The following groups have incomplete matches: ${incompleteGroups.map(g => g.groupName).join(", ")}`
        );
        return;
      }
    }

    if (!allMatchesCompleted) {
      message.error(
        `Cannot complete round. Progress: ${round.completedMatches} / ${round.totalMatches} matches completed.`
      );
      return;
    }

    // Check if round has next round
    const nextRound = tournamentStructure?.rounds.find(
      (r) => r.sequenceOrder === round.sequenceOrder + 1
    );
    
    // If no next round, complete directly without team selection
    if (!nextRound) {
      try {
        const result = await completeRound({
          roundId,
          recalculateStandings: true,
        }).unwrap();
        message.success("Round completed successfully");
        dispatch(setSelectedNode(null));
        dispatch(setShowDetailsDrawer(false));
        onRefresh();
      } catch (error: any) {
        // Show backend error message if available
        const errorMessage = error?.data?.message || error?.message || "Failed to complete round. Please ensure all matches are completed.";
        message.error(errorMessage);
      }
      return;
    }

    // Show team selection modal for advancement
    dispatch(setRoundToComplete(round));
    dispatch(setShowTeamAdvancement(true));
  };

  const handleConfirmAdvancement = async (selectedTeamIds: number[]) => {
    if (!roundToComplete) return;

    if (selectedTeamIds.length === 0) {
      message.warning("Please select at least one team to advance");
      return;
    }

    // Re-validate that all matches are completed before submitting
    const allMatchesCompleted = roundToComplete.totalMatches > 0 && roundToComplete.completedMatches === roundToComplete.totalMatches;
    
    // For group-based rounds, also check that all groups have completed matches
    if (roundToComplete.roundType === RoundType.GROUP_BASED && roundToComplete.groups) {
      const allGroupsCompleted = roundToComplete.groups.every((group) => {
        return group.totalMatches > 0 && group.completedMatches === group.totalMatches;
      });

      if (!allGroupsCompleted) {
        const incompleteGroups = roundToComplete.groups.filter(
          (group) => !(group.totalMatches > 0 && group.completedMatches === group.totalMatches)
        );
        message.error(
          `Cannot complete round. The following groups have incomplete matches: ${incompleteGroups.map(g => g.groupName).join(", ")}`
        );
        return;
      }
    }

    if (!allMatchesCompleted) {
      message.error(
        `Cannot complete round. Progress: ${roundToComplete.completedMatches} / ${roundToComplete.totalMatches} matches completed.`
      );
      return;
    }

    try {
      const result = await completeRound({
        roundId: roundToComplete.id,
        recalculateStandings: true,
        selectedTeamIds: selectedTeamIds,
      }).unwrap();

      message.success(
        `Round completed! ${result.content?.teamsAdvanced || 0} teams advanced to ${result.content?.targetRoundName || "next round"}`
      );
      dispatch(setSelectedNode(null));
      dispatch(setShowDetailsDrawer(false));
      dispatch(setRoundToComplete(null));
      dispatch(setShowTeamAdvancement(false));
      onRefresh();
    } catch (error: any) {
      // Show backend error message if available
      const errorMessage = error?.data?.message || error?.message || "Failed to complete round. Please ensure all matches are completed.";
      message.error(errorMessage);
    }
  };


  const handleCreateGroup = async (roundId: number) => {
    const round = tournamentStructure?.rounds.find((r) => r.id === roundId);
    if (!round || round.roundType !== RoundType.GROUP_BASED) return;

    // Get existing groups to determine next group name
    const existingGroups = round.groups || [];
    const groupLetters = existingGroups.map(g => g.groupName).filter(name => /^Group [A-Z]$/.test(name));
    const nextLetter = String.fromCharCode(65 + groupLetters.length); // A, B, C, etc.

    try {
      await createGroup({
        roundId,
        groupName: `Group ${nextLetter}`,
        groupFormat: GroupFormat.ROUND_ROBIN_SINGLE,
        maxTeams: 4,
      }).unwrap();
      message.success(`Group ${nextLetter} created successfully`);
      // Wait a bit for cache invalidation to complete, then refresh
      setTimeout(() => {
        onRefresh();
      }, 100);
    } catch (error: any) {
      // Error handled by API slice
    }
  };

  const handleEditGroup = (groupId: number, roundId: number) => {
    dispatch(setSelectedNode({ type: "group", id: groupId, data: { roundId } }));
    dispatch(setShowGroupModal(true));
  };

  const handleDeleteGroup = async (groupId: number) => {
    try {
      // Close drawer and clear selected node BEFORE deleting to prevent queries on deleted group
      dispatch(setShowDetailsDrawer(false));
      dispatch(setSelectedNode(null));
      
      await deleteGroup({ groupId }).unwrap();
      message.success("Group deleted successfully");
      onRefresh();
    } catch (error: any) {
      // Error handled by API slice
    }
  };

  const handleRemoveTeamFromGroup = async (groupId: number, teamId: number, teamName?: string) => {
    try {
      await removeTeamFromGroup({ groupId, teamId }).unwrap();
      message.success(`Team "${teamName || 'Team'}" removed successfully`);
      // Wait a bit for cache invalidation to complete, then refresh
      setTimeout(() => {
        onRefresh();
      }, 100);
    } catch (error: any) {
      // Error handled by API slice
    }
  };

  const handleAssignTeams = (groupId: number) => {
    // Find the group in tournament structure
    const round = tournamentStructure?.rounds.find((r) =>
      r.groups?.some((g) => g.id === groupId)
    );
    const group = round?.groups?.find((g) => g.id === groupId);
    
    if (group && round) {
      // Check if group already has teams
      const hasTeams = group.teams && group.teams.filter((t: any) => !t.isPlaceholder).length > 0;
      if (hasTeams) {
        message.warning("Teams already assigned to this group. Remove existing teams first.");
        return;
      }
      
      dispatch(setSelectedNode({ type: "group", id: groupId, data: { ...group, roundId: round.id } }));
      dispatch(setShowTeamAssignment(true));
    }
  };

  const handleGenerateMatches = (groupId: number, groupName: string, teamCount: number) => {
    // Ensure selectedNode is set correctly for the modal
    const round = tournamentStructure?.rounds.find((r) => 
      r.groups?.some((g) => g.id === groupId)
    );
    const group = round?.groups?.find((g) => g.id === groupId);
    if (group && round) {
      dispatch(setSelectedNode({ 
        type: "group", 
        id: groupId, 
        data: { 
          groupName, 
          teamCount,
          roundId: round.id 
        } 
      }));
    } else {
      dispatch(setSelectedNode({ type: "group", id: groupId, data: { groupName, teamCount } }));
    }
    dispatch(setShowMatchGeneration(true));
  };

  const handleGenerateRoundMatches = (roundId: number) => {
    const round = tournamentStructure?.rounds.find((r) => r.id === roundId);
    if (!round) return;

    if (round.roundType === RoundType.GROUP_BASED) {
      // For group-based rounds, generate matches for all groups
      const groups = round.groups || [];
      if (groups.length === 0) {
        message.warning("No groups found in this round. Create groups first.");
        return;
      }
      
      // Check if all groups have at least 2 teams
      const groupsWithEnoughTeams = groups.filter((g: any) => {
        const teamCount = g.teams?.filter((t: any) => !t.isPlaceholder).length || 0;
        return teamCount >= 2;
      });

      if (groupsWithEnoughTeams.length === 0) {
        message.warning("No groups have enough teams (minimum 2) to generate matches.");
        return;
      }

      // For now, show a message - in future could batch generate
      message.info(`This will generate matches for ${groupsWithEnoughTeams.length} group(s). Please generate matches for each group individually from Group Details.`);
    } else {
      // For direct knockout rounds, open the round match generation modal
      const teamCount = round.teams?.filter((t: any) => !t.isPlaceholder).length || 0;
      dispatch(setSelectedNode({ type: "round", id: roundId, data: round }));
      dispatch(setShowRoundMatchGeneration(true));
    }
  };

  const getStatusColor = (status: RoundStatus) => {
    switch (status) {
      case RoundStatus.NOT_STARTED:
        return "blue";
      case RoundStatus.ONGOING:
        return "orange";
      case RoundStatus.COMPLETED:
        return "green";
    }
  };

  const getStatusIcon = (status: RoundStatus) => {
    switch (status) {
      case RoundStatus.NOT_STARTED:
        return <ClockCircleOutlined />;
      case RoundStatus.ONGOING:
        return <PlayCircleOutlined />;
      case RoundStatus.COMPLETED:
        return <CheckCircleOutlined />;
    }
  };

  const renderRoundDetails = () => {
    if (!selectedNode || selectedNode.type !== "round") return null;

    const round = tournamentStructure?.rounds.find((r) => r.id === selectedNode.id);
    if (!round) return null;

    // Get ongoing matches for this round
    // Match by tournamentId, roundNumber (fixture.round or fixture.roundNumber), or round ID
    const roundOngoingMatches = finalFixtures.filter((f) => {
      // Ensure tournamentId matches
      const matchesTournament = f.tournamentId === tournamentId;
      if (!matchesTournament) return false;
      
      // Try multiple matching strategies for round
      const fixtureRoundNumber = f.roundNumber ?? f.round; // Use roundNumber if available, fallback to round
      const matchesByRoundNumber = fixtureRoundNumber === round.roundNumber;
      const matchesByRoundId = f.round === round.id;
      const matchesRound = matchesByRoundNumber || matchesByRoundId;
      
      // Check if match is ongoing
      const isOngoing = isMatchOngoing(f.matchStatus);
      
      return matchesRound && isOngoing;
    });

    const isGroupBased = round.roundType === RoundType.GROUP_BASED;
    const canStart = round.status === RoundStatus.NOT_STARTED;
    // Can complete only if round is ONGOING and all matches are completed
    // Once round is COMPLETED, the button should not show
    const allMatchesCompleted = round.totalMatches > 0 && round.completedMatches === round.totalMatches;
    const canComplete = round.status === RoundStatus.ONGOING && allMatchesCompleted;
    
    // Check if this is the last round
    const isLastRound = tournamentStructure 
      ? round.sequenceOrder === tournamentStructure.totalRounds
      : false;

    // Get all matches for this round to calculate standings (for DIRECT_KNOCKOUT rounds)
    const roundMatches = finalFixtures.filter((f) => {
      const matchesTournament = f.tournamentId === tournamentId;
      if (!matchesTournament) return false;
      const fixtureRoundNumber = f.roundNumber ?? f.round;
      const matchesByRoundNumber = fixtureRoundNumber === round.roundNumber;
      const matchesByRoundId = f.round === round.id;
      const matches = matchesByRoundNumber || matchesByRoundId;
      
      // Debug logging
      if (matches && isGroupBased === false) {
        console.log('Round match found:', {
          fixtureId: f.id,
          fixtureRound: f.round,
          fixtureRoundNumber: f.roundNumber,
          roundId: round.id,
          roundNumber: round.roundNumber,
          matchStatus: f.matchStatus,
          homeTeam: f.homeTeamName,
          awayTeam: f.awayTeamName
        });
      }
      
      return matches;
    });

    // Calculate standings for DIRECT_KNOCKOUT rounds
    const calculateRoundStandings = () => {
      if (isGroupBased || roundMatches.length === 0) return [];

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

      // Process completed matches and initialize teams from matches if not already in teamStats
      roundMatches.forEach((match) => {
        if (match.matchStatus !== "COMPLETED") return;

        const homeTeamId = match.homeTeamId;
        const awayTeamId = match.awayTeamId;
        const homeScore = match.homeTeamScore || 0;
        const awayScore = match.awayTeamScore || 0;

        // Initialize home team if not already in stats
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

        // Initialize away team if not already in stats
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
        if (teamStats[homeTeamId]) {
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
        }

        // Update away team stats
        if (teamStats[awayTeamId]) {
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
        }
      });

      // Convert to array and sort by points, goal difference, goals for
      const standings = Object.values(teamStats)
        .filter((stat) => stat.matchesPlayed > 0)
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
          return b.goalsFor - a.goalsFor;
        })
        .map((stat, index) => ({
          ...stat,
          position: index + 1,
          id: stat.teamId, // Use teamId as id for table rowKey
        }));

      return standings;
    };

    const roundStandings = !isGroupBased ? calculateRoundStandings() : [];

    // Check if previous round is completed (for starting validation)
    const previousRound = round.sequenceOrder && round.sequenceOrder > 1
      ? tournamentStructure?.rounds.find((r) => r.sequenceOrder === round.sequenceOrder - 1)
      : null;
    const canStartRound = canStart && (round.sequenceOrder === 1 || (previousRound?.status === RoundStatus.COMPLETED));
    const startRoundReason = !canStart
      ? `Round is already ${round.status}`
      : previousRound && previousRound.status !== RoundStatus.COMPLETED
      ? `Previous round "${previousRound.roundName}" must be completed first`
      : null;

    return (
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div>
          <Title level={4}>{round.roundName}</Title>
          <Space>
            <Tag color={getStatusColor(round.status)}>
              {getStatusIcon(round.status)} {round.status}
            </Tag>
            <Text type="secondary">Sequence: {round.sequenceOrder}</Text>
            <Text type="secondary">Matches: {round.completedMatches} / {round.totalMatches}</Text>
          </Space>
        </div>

        <Divider />

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Statistic title="Type" value={round.roundType} />
          </Col>
        </Row>

        <Divider />

        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          {canStart && (
            <>
              <Tooltip title={startRoundReason || undefined}>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleStartRound(round.id)}
                  loading={isStartingRound}
                  disabled={!canStartRound}
                  block
                >
                  Start Round
                </Button>
              </Tooltip>
              {startRoundReason && (
                <Alert
                  message={startRoundReason}
                  type="warning"
                  showIcon
                  style={{ marginTop: 8 }}
                />
              )}
            </>
          )}

          {canComplete && (
            <>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleCompleteRound(round.id)}
                block
                disabled={!allMatchesCompleted && round.status === RoundStatus.ONGOING}
              >
                Complete Round & Advance Teams
              </Button>
              {round.status === RoundStatus.ONGOING && !allMatchesCompleted && (
                <Alert
                  message="Cannot Complete Round"
                  description={`All matches must be completed first. Progress: ${round.completedMatches} / ${round.totalMatches} matches completed.`}
                  type="warning"
                  showIcon
                  style={{ marginTop: 8 }}
                />
              )}
            </>
          )}


          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditRound(round.id)}
            block
          >
            Edit Round
          </Button>

          {isGroupBased && (
            <Button
              icon={<PlusOutlined />}
              onClick={() => handleCreateGroup(round.id)}
              block
            >
              Add Group
            </Button>
          )}

          {!isGroupBased && canStart && (
            <>
              <Button
                icon={<UserAddOutlined />}
                onClick={() => {
                  dispatch(setSelectedNode({ type: "round", id: round.id, data: round }));
                  dispatch(setShowTeamAssignment(true));
                }}
                block
              >
                Assign Teams
              </Button>
              {round.teams && round.teams.length >= 2 && round.totalMatches === 0 && (
                <Button
                  icon={<ThunderboltOutlined />}
                  onClick={() => {
                    dispatch(setSelectedNode({ type: "round", id: round.id, data: round }));
                    dispatch(setShowRoundMatchGeneration(true));
                  }}
                  block
                >
                  Generate Matches
                </Button>
              )}
            </>
          )}

          <Popconfirm
            title="Delete this round?"
            description="All groups and matches will be deleted."
            onConfirm={() => handleDeleteRound(round.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} block>
              Delete Round
            </Button>
          </Popconfirm>
        </Space>

        {/* Standings for DIRECT_KNOCKOUT rounds */}
        {!isGroupBased && (
          <>
            <Divider />
            <div>
              <Title level={5}>
                <BarChartOutlined /> Standings
              </Title>
              {roundStandings.length > 0 ? (
                <Table
                  columns={[
                    { title: "Pos", dataIndex: "position", key: "position", width: 60 },
                    { title: "Team", dataIndex: "teamName", key: "teamName" },
                    { title: "P", dataIndex: "matchesPlayed", key: "matchesPlayed", width: 60 },
                    { title: "W", dataIndex: "wins", key: "wins", width: 60 },
                    { title: "D", dataIndex: "draws", key: "draws", width: 60 },
                    { title: "L", dataIndex: "losses", key: "losses", width: 60 },
                    { title: "GF", dataIndex: "goalsFor", key: "goalsFor", width: 60 },
                    { title: "GA", dataIndex: "goalsAgainst", key: "goalsAgainst", width: 60 },
                    {
                      title: "GD",
                      dataIndex: "goalDifference",
                      key: "goalDifference",
                      width: 70,
                      render: (gd: number) => (
                        <Text strong style={{ color: gd > 0 ? "#52c41a" : gd < 0 ? "#ff4d4f" : undefined }}>
                          {gd > 0 ? `+${gd}` : gd}
                        </Text>
                      ),
                    },
                    { title: "Pts", dataIndex: "points", key: "points", width: 70, render: (pts: number) => <Text strong>{pts}</Text> },
                  ]}
                  dataSource={roundStandings}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              ) : (
                <Empty 
                  description={
                    roundMatches.length === 0 
                      ? "No matches found for this round. Generate matches to see standings."
                      : "No completed matches yet. Complete some matches to see standings."
                  }
                  style={{ padding: "20px 0" }}
                />
              )}
            </div>
          </>
        )}

        {/* Ongoing Matches Section */}
        {roundOngoingMatches.length > 0 && (
          <>
            <Divider>Live Matches ({roundOngoingMatches.length})</Divider>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              {roundOngoingMatches.map((match: IFixture) => {
                // Use currentTime to force re-render when time updates
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
                      border: "1px solid #52c41a",
                      backgroundColor: "#f6ffed",
                    }}
                  >
                    <Space style={{ width: "100%", justifyContent: "space-between" }}>
                      <Space>
                        <PlayCircleOutlined style={{ color: "#52c41a" }} />
                        <Text strong>{match.homeTeamName}</Text>
                        <Text style={{ fontWeight: "bold" }}>
                          {match.homeTeamScore} - {match.awayTeamScore}
                        </Text>
                        <Text strong>{match.awayTeamName}</Text>
                      </Space>
                      {matchTime && (
                        <Tag
                          color="green"
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
          </>
        )}

        {isGroupBased && round.groups && round.groups.length > 0 && (
          <>
            <Divider>Groups ({round.groups.length})</Divider>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              {round.groups.map((group) => (
                <Card
                  key={group.id}
                  size="small"
                  title={group.groupName}
                  extra={
                    <Button
                      size="small"
                      onClick={() => {
                        dispatch(setSelectedNode({
                          type: "group",
                          id: group.id,
                          data: { ...group, roundId: round.id },
                        }));
                      }}
                    >
                      View
                    </Button>
                  }
                >
                  <Space>
                    <Text type="secondary">Teams: {group.teams.length}</Text>
                    <Text type="secondary">Matches: {group.completedMatches} / {group.totalMatches}</Text>
                  </Space>
                </Card>
              ))}
            </Space>
          </>
        )}
      </Space>
    );
  };

  const renderGroupDetails = () => {
    if (!selectedNode || selectedNode.type !== "group") return null;

    // Get fresh group data from tournament structure
    const round = tournamentStructure?.rounds.find((r) => 
      r.groups?.some((g) => g.id === selectedNode.id)
    );
    const group = round?.groups?.find((g) => g.id === selectedNode.id);
    if (!round || !group) return null;

    // Get ongoing matches for this group
    // Match by tournamentId, groupName, and roundNumber
    const groupOngoingMatches = finalFixtures.filter((f) => {
      // Ensure tournamentId matches
      const matchesTournament = f.tournamentId === tournamentId;
      if (!matchesTournament) return false;
      
      // Match by groupName
      const matchesGroup = f.groupName === group.groupName;
      if (!matchesGroup) return false;
      
      // Try multiple matching strategies for round
      const fixtureRoundNumber = f.roundNumber ?? f.round; // Use roundNumber if available, fallback to round
      const matchesByRoundNumber = fixtureRoundNumber === round.roundNumber;
      const matchesByRoundId = f.round === round.id;
      const matchesRound = matchesByRoundNumber || matchesByRoundId;
      
      // Check if match is ongoing
      const isOngoing = isMatchOngoing(f.matchStatus);
      
      return matchesRound && isOngoing;
    });

    const teamCount = group.teams?.filter((t: any) => !t.isPlaceholder).length || 0;
    const canGenerateMatches = teamCount >= 2;

    // Use standings from hook called at component level
    const standings = standingsData?.content || [];

    const standingsColumns = [
      { title: "Pos", dataIndex: "position", key: "position", width: 60 },
      { title: "Team", dataIndex: "teamName", key: "teamName" },
      { title: "P", dataIndex: "matchesPlayed", key: "matchesPlayed", width: 60 },
      { title: "W", dataIndex: "wins", key: "wins", width: 60 },
      { title: "D", dataIndex: "draws", key: "draws", width: 60 },
      { title: "L", dataIndex: "losses", key: "losses", width: 60 },
      { title: "GF", dataIndex: "goalsFor", key: "goalsFor", width: 60 },
      { title: "GA", dataIndex: "goalsAgainst", key: "goalsAgainst", width: 60 },
      {
        title: "GD",
        dataIndex: "goalDifference",
        key: "goalDifference",
        width: 70,
        render: (gd: number) => (
          <Text strong style={{ color: gd > 0 ? "#52c41a" : gd < 0 ? "#ff4d4f" : undefined }}>
            {gd > 0 ? `+${gd}` : gd}
          </Text>
        ),
      },
      { title: "Pts", dataIndex: "points", key: "points", width: 70, render: (pts: number) => <Text strong>{pts}</Text> },
    ];

    return (
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div>
          <Title level={4}>{group.groupName}</Title>
          <Space>
            <Tag color={getStatusColor(group.status)}>
              {getStatusIcon(group.status)} {group.status}
            </Tag>
            <Text type="secondary">Teams: {teamCount}</Text>
            <Text type="secondary">Matches: {group.completedMatches} / {group.totalMatches}</Text>
          </Space>
        </div>

        <Divider />

        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={() => handleGenerateMatches(selectedNode.id, group.groupName, teamCount)}
            disabled={!canGenerateMatches}
            block
          >
            Generate Matches
          </Button>

          <Button
            icon={<UserAddOutlined />}
            onClick={() => handleAssignTeams(selectedNode.id)}
            block
          >
            Assign Teams
          </Button>

          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditGroup(selectedNode.id, group.roundId)}
            block
          >
            Edit Group
          </Button>

          <Popconfirm
            title="Delete this group?"
            description="All matches and standings will be deleted."
            onConfirm={() => handleDeleteGroup(selectedNode.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} block>
              Delete Group
            </Button>
          </Popconfirm>
        </Space>

        <Divider />

        <div>
          <Title level={5}>Teams ({group.teams?.length || 0})</Title>
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            {group.teams?.map((team: any, idx: number) => {
              const isPlaceholder = team.isPlaceholder || false;
              // Always show remove icon for non-placeholder teams
              // teamId is the actual team ID, id is the group-team relationship ID
              // Check both teamId and id - sometimes the API might return id instead of teamId
              const teamId = team.teamId ?? team.id;
              
              return (
                <Card
                  key={team.id || idx}
                  size="small"
                  style={{
                    borderColor: isPlaceholder ? "#faad14" : "#1890ff",
                  }}
                >
                  <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <Space>
                      {isPlaceholder ? <ClockCircleOutlined /> : <TeamOutlined />}
                      <Text strong={!isPlaceholder}>
                        {team.teamName || team.placeholderName || "TBD"}
                      </Text>
                      {isPlaceholder && (
                        <Tag color="orange" style={{ fontSize: 10 }}>Placeholder</Tag>
                      )}
                    </Space>
                    {!isPlaceholder && teamId && (
                      <Popconfirm
                        title="Remove Team"
                        description={`Are you sure you want to remove "${team.teamName || 'this team'}" from ${group.groupName}?`}
                        onConfirm={() => handleRemoveTeamFromGroup(selectedNode.id, teamId, team.teamName ?? undefined)}
                        okText="Remove"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          loading={isRemovingTeam}
                          title="Remove team from group"
                        />
                      </Popconfirm>
                    )}
                  </Space>
                </Card>
              );
            })}
          </Space>
        </div>

        {standings.length > 0 && (
          <>
            <Divider />
            <div>
              <Title level={5}>Standings</Title>
              <Table
                columns={standingsColumns}
                dataSource={standings}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </div>
          </>
        )}

        {/* Ongoing Matches Section */}
        {groupOngoingMatches.length > 0 && (
          <>
            <Divider>Live Matches ({groupOngoingMatches.length})</Divider>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              {groupOngoingMatches.map((match: IFixture) => {
                // Use currentTime to force re-render when time updates
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
                      border: "1px solid #52c41a",
                      backgroundColor: "#f6ffed",
                    }}
                  >
                    <Space style={{ width: "100%", justifyContent: "space-between" }}>
                      <Space>
                        <PlayCircleOutlined style={{ color: "#52c41a" }} />
                        <Text strong>{match.homeTeamName}</Text>
                        <Text style={{ fontWeight: "bold" }}>
                          {match.homeTeamScore} - {match.awayTeamScore}
                        </Text>
                        <Text strong>{match.awayTeamName}</Text>
                      </Space>
                      {matchTime && (
                        <Tag
                          color="green"
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
          </>
        )}
      </Space>
    );
  };


  // Render empty state and modals together
  const renderEmptyState = !tournamentStructure || tournamentStructure.rounds.length === 0;

  return (
    <div style={{ height: "calc(100vh - 200px)", position: "relative" }}>
      {renderEmptyState ? (
        <Card style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Empty
            description={
              <div style={{ textAlign: "center" }}>
                <Text type="secondary">No tournament structure yet.</Text>
                <br />
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={handleCreateRound}
                  style={{ marginTop: 16 }}
                >
                  Add First Round
                </Button>
              </div>
            }
          />
        </Card>
      ) : (
        <>
          {/* Visualization - Full Height */}
          <TournamentFlowVisualization
            tournamentStructure={tournamentStructure}
            fixtures={finalFixtures}
            onNodeClick={handleNodeClick}
            onCreateRound={handleCreateRound}
            onCreateGroup={handleCreateGroup}
            onAssignTeams={handleAssignTeams}
            onGenerateMatches={handleGenerateRoundMatches}
            onRefresh={onRefresh}
          />

          {/* Details Drawer */}
          <Drawer
        title={
          selectedNode?.type === "round" ? (
            <Space>
              <TrophyOutlined />
              Round Details
            </Space>
          ) : (
            <Space>
              <TeamOutlined />
              Group Details
            </Space>
          )
        }
        placement="right"
        width={400}
        open={showDetailsDrawer && selectedNode !== null}
        onClose={() => {
          dispatch(setShowDetailsDrawer(false));
          dispatch(setSelectedNode(null));
        }}
      >
        {selectedNode?.type === "round" ? renderRoundDetails() : renderGroupDetails()}
      </Drawer>
        </>
      )}

      {/* Modals - Always render so they work even when there's no tournament structure */}
      <RoundManagement
        tournamentId={tournamentId}
        roundId={selectedNode?.type === "round" ? selectedNode.id : null}
        isModalVisible={showRoundModal}
        onClose={() => {
          dispatch(setShowRoundModal(false));
          dispatch(setSelectedNode(null));
        }}
        onSuccess={() => {
          onRefresh();
          dispatch(setShowRoundModal(false));
          dispatch(setSelectedNode(null));
        }}
        existingRounds={tournamentStructure?.rounds || []}
      />

      <GroupManagement
        roundId={selectedNode?.type === "round" ? selectedNode.id : (selectedNode?.data?.roundId || null)}
        groupId={selectedNode?.type === "group" ? selectedNode.id : null}
        isModalVisible={showGroupModal}
        onClose={() => {
          dispatch(setShowGroupModal(false));
          dispatch(setSelectedNode(null));
        }}
        onSuccess={() => {
          onRefresh();
          dispatch(setShowGroupModal(false));
          dispatch(setSelectedNode(null));
        }}
      />

      <TeamAssignment
        groupId={selectedNode?.type === "group" ? selectedNode.id : null}
        roundId={selectedNode?.type === "round" ? selectedNode.id : (selectedNode?.data?.roundId || null)}
        roundType={selectedNode?.type === "round" ? (selectedNode.data?.roundType as "GROUP_BASED" | "DIRECT_KNOCKOUT") : undefined}
        teams={teams}
        tournamentStructure={tournamentStructure}
        isModalVisible={showTeamAssignment}
        onClose={() => {
          dispatch(setShowTeamAssignment(false));
          dispatch(setSelectedNode(null));
        }}
        onSuccess={() => {
          onRefresh();
          dispatch(setShowTeamAssignment(false));
          dispatch(setSelectedNode(null));
        }}
      />

      <TeamAdvancementModal
        round={roundToComplete}
        nextRound={
          roundToComplete
            ? tournamentStructure?.rounds.find(
                (r) => r.sequenceOrder === roundToComplete.sequenceOrder + 1
              ) || null
            : null
        }
        allFixtures={finalFixtures}
        isModalVisible={showTeamAdvancement}
        onClose={() => {
          dispatch(setShowTeamAdvancement(false));
          dispatch(setRoundToComplete(null));
        }}
        onConfirm={handleConfirmAdvancement}
        isLoading={isCompletingRound}
      />


      <GroupMatchGenerationModal
        groupId={selectedNode?.type === "group" ? selectedNode.id : null}
        groupName={selectedNode?.type === "group" ? selectedNode.data?.groupName : null}
        teamCount={selectedNode?.type === "group" ? selectedNode.data?.teamCount || 0 : 0}
        groupFormat={
          selectedNode?.type === "group"
            ? tournamentStructure?.rounds
                .find((r) => r.groups?.some((g) => g.id === selectedNode.id))
                ?.groups?.find((g) => g.id === selectedNode.id)?.groupFormat
            : undefined
        }
        isModalVisible={showMatchGeneration}
        onClose={() => {
          dispatch(setShowMatchGeneration(false));
          dispatch(setSelectedNode(null));
        }}
        onSuccess={() => {
          onRefresh();
          dispatch(setShowMatchGeneration(false));
          dispatch(setSelectedNode(null));
        }}
      />

      <RoundMatchGenerationModal
        roundId={selectedNode?.type === "round" ? selectedNode.id : null}
        roundName={selectedNode?.type === "round" ? selectedNode.data?.roundName : null}
        teamCount={
          selectedNode?.type === "round"
            ? selectedNode.data?.teams?.filter((t: any) => !t.isPlaceholder).length || 0
            : 0
        }
        isModalVisible={showRoundMatchGeneration}
        onClose={() => {
          dispatch(setShowRoundMatchGeneration(false));
          dispatch(setSelectedNode(null));
        }}
        onSuccess={() => {
          onRefresh();
          dispatch(setShowRoundMatchGeneration(false));
          dispatch(setSelectedNode(null));
        }}
      />
    </div>
  );
}

