import React, { useState, useCallback } from "react";
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
import { Table } from "antd";
import { GroupFormat } from "../../../../../state/features/manualFixtures/manualFixtureTypes";

const { Title, Text } = Typography;

interface InteractiveTournamentTabProps {
  tournamentId: number;
  teams: Array<{ teamId: number; teamName: string }>;
  tournamentStructure?: TournamentStructureResponse;
  isLoading: boolean;
  onRefresh: () => void;
}

type SelectedNode = {
  type: "round" | "group";
  id: number;
  data: any;
} | null;

export default function InteractiveTournamentTab({
  tournamentId,
  teams,
  tournamentStructure,
  isLoading,
  onRefresh,
}: InteractiveTournamentTabProps) {
  const [selectedNode, setSelectedNode] = useState<SelectedNode>(null);
  const [showRoundModal, setShowRoundModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showTeamAssignment, setShowTeamAssignment] = useState(false);
  const [showMatchGeneration, setShowMatchGeneration] = useState(false);
  const [showRoundMatchGeneration, setShowRoundMatchGeneration] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [showTeamAdvancement, setShowTeamAdvancement] = useState(false);
  const [roundToComplete, setRoundToComplete] = useState<TournamentRoundResponse | null>(null);

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

  const handleNodeClick = useCallback((nodeId: string, nodeType: string, data: any) => {
    if (nodeType === "roundNode") {
      const roundId = parseInt(nodeId.replace("round-", ""));
      const round = tournamentStructure?.rounds.find((r) => r.id === roundId);
      if (round) {
        setSelectedNode({
          type: "round",
          id: roundId,
          data: round,
        });
        setShowDetailsDrawer(true);
      }
    } else if (nodeType === "groupNode") {
      const groupId = parseInt(nodeId.replace("group-", ""));
      const round = tournamentStructure?.rounds.find((r) =>
        r.groups?.some((g) => g.id === groupId)
      );
      const group = round?.groups?.find((g) => g.id === groupId);
      if (group && round) {
        setSelectedNode({
          type: "group",
          id: groupId,
          data: { ...group, roundId: round.id },
        });
        setShowDetailsDrawer(true);
      }
    }
  }, [tournamentStructure]);

  const handleCreateRound = () => {
    setSelectedNode(null);
    setShowRoundModal(true);
  };

  const handleEditRound = (roundId?: number) => {
    if (roundId) {
      setSelectedNode({ type: "round", id: roundId, data: {} });
    }
    setShowRoundModal(true);
  };

  const handleDeleteRound = async (roundId: number) => {
    try {
      // Close drawer and modals before deleting
      setSelectedNode(null);
      setShowDetailsDrawer(false);
      setShowRoundModal(false);
      
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
      setSelectedNode(null);
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
    if (round) {
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
            autoAdvanceTeams: false, // No next round, so no advancement
          }).unwrap();
          message.success("Round completed successfully");
          setSelectedNode(null);
          onRefresh();
        } catch (error: any) {
          // Error handled by API slice
        }
        return;
      }

      // Show team selection modal for advancement
      setRoundToComplete(round);
      setShowTeamAdvancement(true);
    }
  };

  const handleConfirmAdvancement = async (selectedTeamIds: number[]) => {
    if (!roundToComplete) return;

    try {
      const result = await completeRound({
        roundId: roundToComplete.id,
        recalculateStandings: true,
        autoAdvanceTeams: true,
        selectedTeamIds: selectedTeamIds.length > 0 ? selectedTeamIds : undefined,
      }).unwrap();

      message.success(
        `Round completed! ${result.content?.teamsAdvanced || 0} teams advanced to ${result.content?.targetRoundName || "next round"}`
      );
      setSelectedNode(null);
      setRoundToComplete(null);
      setShowTeamAdvancement(false);
      onRefresh();
    } catch (error: any) {
      // Error handled by API slice
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
      onRefresh();
    } catch (error: any) {
      // Error handled by API slice
    }
  };

  const handleEditGroup = (groupId: number, roundId: number) => {
    setSelectedNode({ type: "group", id: groupId, data: { roundId } });
    setShowGroupModal(true);
  };

  const handleDeleteGroup = async (groupId: number) => {
    try {
      await deleteGroup({ groupId }).unwrap();
      message.success("Group deleted successfully");
      setSelectedNode(null);
      onRefresh();
    } catch (error: any) {
      // Error handled by API slice
    }
  };

  const handleRemoveTeamFromGroup = async (groupId: number, teamId: number, teamName?: string) => {
    try {
      await removeTeamFromGroup({ groupId, teamId }).unwrap();
      message.success(`Team "${teamName || 'Team'}" removed successfully`);
      onRefresh();
      // Refresh the selected node to update the teams list
      const updatedGroup = tournamentStructure?.rounds
        .flatMap(r => r.groups || [])
        .find(g => g.id === groupId);
      if (updatedGroup) {
        const round = tournamentStructure?.rounds.find(r => r.groups?.some(g => g.id === groupId));
        if (round) {
          setSelectedNode({ type: "group", id: groupId, data: { ...updatedGroup, roundId: round.id } });
        }
      }
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
      
      setSelectedNode({ type: "group", id: groupId, data: { ...group, roundId: round.id } });
      setShowTeamAssignment(true);
    }
  };

  const handleGenerateMatches = (groupId: number, groupName: string, teamCount: number) => {
    setSelectedNode({ type: "group", id: groupId, data: { groupName, teamCount } });
    setShowMatchGeneration(true);
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

    const isGroupBased = round.roundType === RoundType.GROUP_BASED;
    const canStart = round.status === RoundStatus.NOT_STARTED;
    const canComplete = round.status === RoundStatus.ONGOING;

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
          <Col span={12}>
            <Statistic title="Format" value={round.roundFormat || "N/A"} />
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
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleCompleteRound(round.id)}
              block
            >
              Complete Round & Advance Teams
            </Button>
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
                  setSelectedNode({ type: "round", id: round.id, data: round });
                  setShowTeamAssignment(true);
                }}
                block
              >
                Assign Teams
              </Button>
              {round.teams && round.teams.length >= 2 && round.totalMatches === 0 && (
                <Button
                  icon={<ThunderboltOutlined />}
                  onClick={() => {
                    setSelectedNode({ type: "round", id: round.id, data: round });
                    setShowRoundMatchGeneration(true);
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
                        setSelectedNode({
                          type: "group",
                          id: group.id,
                          data: { ...group, roundId: round.id },
                        });
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
              // Allow removal if: not placeholder, has teamId, and group is not completed
              // Also check if group has matches - if matches exist, don't allow removal
              const groupStatus: RoundStatus | string = group.status || (group as any).groupStatus || RoundStatus.NOT_STARTED;
              const isGroupCompleted = groupStatus === RoundStatus.COMPLETED || groupStatus === "COMPLETED";
              const hasMatches = (group.totalMatches || 0) > 0;
              // Allow removal unless: group is completed, has matches, is placeholder, or no teamId
              const canRemove = !isGroupCompleted && !hasMatches && !isPlaceholder && !!team.teamId;
              
              return (
                <Card
                  key={idx}
                  size="small"
                  style={{
                    borderColor: isPlaceholder ? "#faad14" : "#1890ff",
                    backgroundColor: isPlaceholder ? "#fffbe6" : "#e6f7ff",
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
                    {canRemove && (
                      <Popconfirm
                        title="Remove Team"
                        description={`Are you sure you want to remove "${team.teamName || 'this team'}" from ${group.groupName}?`}
                        onConfirm={() => handleRemoveTeamFromGroup(selectedNode.id, team.teamId!, team.teamName ?? undefined)}
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
                    {!canRemove && !isPlaceholder && (
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        disabled
                        title={
                          isGroupCompleted 
                            ? "Cannot remove teams from completed group" 
                            : hasMatches
                            ? "Cannot remove teams after matches have been generated"
                            : !team.teamId
                            ? "Cannot remove placeholder teams"
                            : "Cannot remove this team"
                        }
                      />
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
      </Space>
    );
  };

  const [hoveredRoundId, setHoveredRoundId] = useState<number | null>(null);
  const [hoveredGroupId, setHoveredGroupId] = useState<number | null>(null);

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
            onNodeClick={handleNodeClick}
            hoveredRoundId={hoveredRoundId}
            hoveredGroupId={hoveredGroupId}
            onHoverRound={setHoveredRoundId}
            onHoverGroup={setHoveredGroupId}
            onCreateRound={handleCreateRound}
            onCreateGroup={handleCreateGroup}
            onAssignTeams={handleAssignTeams}
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
        open={showDetailsDrawer}
        onClose={() => {
          setShowDetailsDrawer(false);
          setSelectedNode(null);
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
          setShowRoundModal(false);
          setSelectedNode(null);
        }}
        onSuccess={() => {
          onRefresh();
          setShowRoundModal(false);
          setSelectedNode(null);
        }}
        existingRounds={tournamentStructure?.rounds || []}
      />

      <GroupManagement
        roundId={selectedNode?.type === "round" ? selectedNode.id : (selectedNode?.data?.roundId || null)}
        groupId={selectedNode?.type === "group" ? selectedNode.id : null}
        isModalVisible={showGroupModal}
        onClose={() => {
          setShowGroupModal(false);
          setSelectedNode(null);
        }}
        onSuccess={() => {
          onRefresh();
          setShowGroupModal(false);
          setSelectedNode(null);
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
          setShowTeamAssignment(false);
          setSelectedNode(null);
        }}
        onSuccess={() => {
          onRefresh();
          setShowTeamAssignment(false);
          setSelectedNode(null);
        }}
      />

      <TeamAdvancementModal
        round={roundToComplete}
        isModalVisible={showTeamAdvancement}
        onClose={() => {
          setShowTeamAdvancement(false);
          setRoundToComplete(null);
        }}
        onConfirm={handleConfirmAdvancement}
        isLoading={isCompletingRound}
      />
    </div>
  );
}

