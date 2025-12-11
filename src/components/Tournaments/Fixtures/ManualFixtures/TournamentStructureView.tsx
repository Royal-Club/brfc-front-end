import React, { useState } from "react";
import {
  Collapse,
  Card,
  Space,
  Button,
  Typography,
  Tag,
  Row,
  Col,
  Table,
  Badge,
  Empty,
  Tooltip,
  Popconfirm,
  message,
  Tabs,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  TeamOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  UserAddOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import {
  TournamentStructureResponse,
  RoundStatus,
  RoundType,
  TournamentRoundResponse,
  RoundGroupResponse,
} from "../../../../state/features/manualFixtures/manualFixtureTypes";
import {
  useDeleteRoundMutation,
  useDeleteGroupMutation,
  useCompleteRoundMutation,
  useRecalculateGroupStandingsMutation,
} from "../../../../state/features/manualFixtures/manualFixturesSlice";
import GroupManagement from "./GroupManagement";
import TeamAssignment from "./TeamAssignment";
import GroupMatchGenerationModal from "./GroupMatchGenerationModal";
import GroupMatchesView from "./GroupMatchesView";

const { Panel } = Collapse;
const { Text, Title } = Typography;

interface TournamentStructureViewProps {
  tournamentStructure: TournamentStructureResponse;
  teams: Array<{ teamId: number; teamName: string }>;
  onRefresh: () => void;
  onEditRound: (roundId: number) => void;
}

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

export default function TournamentStructureView({
  tournamentStructure,
  teams,
  onRefresh,
  onEditRound,
}: TournamentStructureViewProps) {
  const [deleteRound] = useDeleteRoundMutation();
  const [deleteGroup] = useDeleteGroupMutation();
  const [completeRound, { isLoading: isCompletingRound }] = useCompleteRoundMutation();
  const [recalculateStandings] = useRecalculateGroupStandingsMutation();

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showTeamAssignment, setShowTeamAssignment] = useState(false);
  const [showMatchGeneration, setShowMatchGeneration] = useState(false);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);
  const [selectedGroupTeamCount, setSelectedGroupTeamCount] = useState<number>(0);

  const handleDeleteRound = async (roundId: number) => {
    try {
      await deleteRound({ roundId }).unwrap();
      message.success("Round deleted successfully");
      onRefresh();
    } catch (error: any) {
      // Error already shown by API slice
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    try {
      await deleteGroup({ groupId }).unwrap();
      message.success("Group deleted successfully");
      onRefresh();
    } catch (error: any) {
      // Error already shown by API slice
    }
  };

  const handleCompleteRound = async (roundId: number) => {
    try {
      const result = await completeRound({
        roundId,
        recalculateStandings: true,
        autoAdvanceTeams: true,
      }).unwrap();

      message.success(
        `Round completed! ${result.content.teamsAdvanced} teams advanced to ${result.content.targetRoundName || "next round"}`
      );
      onRefresh();
    } catch (error: any) {
      // Error already shown by API slice
    }
  };

  const handleRecalculateStandings = async (groupId: number) => {
    try {
      await recalculateStandings({ groupId }).unwrap();
      message.success("Standings recalculated successfully");
      onRefresh();
    } catch (error: any) {
      // Error already shown by API slice
    }
  };

  const handleCreateGroup = (roundId: number) => {
    setSelectedRoundId(roundId);
    setSelectedGroupId(null);
    setShowGroupModal(true);
  };

  const handleEditGroup = (groupId: number, roundId: number) => {
    setSelectedRoundId(roundId);
    setSelectedGroupId(groupId);
    setShowGroupModal(true);
  };

  const handleAssignTeams = (groupId: number, roundId: number) => {
    setSelectedRoundId(roundId);
    setSelectedGroupId(groupId);
    setShowTeamAssignment(true);
  };

  const handleGenerateMatches = (group: RoundGroupResponse, roundId: number) => {
    setSelectedRoundId(roundId);
    setSelectedGroupId(group.id);
    setSelectedGroupName(group.groupName);
    setSelectedGroupTeamCount(group.teams.filter(t => !t.isPlaceholder).length);
    setShowMatchGeneration(true);
  };

  const standingsColumns = [
    {
      title: "Pos",
      dataIndex: "position",
      key: "position",
      width: 60,
      render: (pos: number | null) => (
        <Text strong>{pos || "-"}</Text>
      ),
    },
    {
      title: "Team",
      dataIndex: "teamName",
      key: "teamName",
      render: (name: string, record: any) => (
        <Space>
          {record.isAdvanced && (
            <CheckCircleOutlined style={{ color: "#52c41a" }} />
          )}
          <Text>{name}</Text>
        </Space>
      ),
    },
    {
      title: "P",
      dataIndex: "matchesPlayed",
      key: "matchesPlayed",
      width: 60,
    },
    {
      title: "W",
      dataIndex: "wins",
      key: "wins",
      width: 60,
    },
    {
      title: "D",
      dataIndex: "draws",
      key: "draws",
      width: 60,
    },
    {
      title: "L",
      dataIndex: "losses",
      key: "losses",
      width: 60,
    },
    {
      title: "GF",
      dataIndex: "goalsFor",
      key: "goalsFor",
      width: 60,
    },
    {
      title: "GA",
      dataIndex: "goalsAgainst",
      key: "goalsAgainst",
      width: 60,
    },
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
    {
      title: "Pts",
      dataIndex: "points",
      key: "points",
      width: 70,
      render: (pts: number) => <Text strong>{pts}</Text>,
    },
  ];

  const renderGroup = (group: RoundGroupResponse, round: TournamentRoundResponse) => (
    <Card
      key={group.id}
      size="small"
      title={
        <Space>
          <TeamOutlined />
          <Text strong>{group.groupName}</Text>
          <Tag color={getStatusColor(group.status)}>
            {getStatusIcon(group.status)} {group.status}
          </Tag>
          <Badge count={group.teams.length} showZero style={{ backgroundColor: "#1890ff" }} />
        </Space>
      }
      extra={
        <Space>
          <Tooltip title="Generate Matches">
            <Button
              size="small"
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={() => handleGenerateMatches(group, round.id)}
              disabled={group.teams.filter(t => !t.isPlaceholder).length < 2}
            >
              Generate
            </Button>
          </Tooltip>
          <Tooltip title="Assign Teams">
            <Button
              size="small"
              icon={<UserAddOutlined />}
              onClick={() => handleAssignTeams(group.id, round.id)}
            />
          </Tooltip>
          <Tooltip title="Recalculate Standings">
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => handleRecalculateStandings(group.id)}
            />
          </Tooltip>
          <Tooltip title="Edit Group">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditGroup(group.id, round.id)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this group?"
            description="Are you sure you want to delete this group?"
            onConfirm={() => handleDeleteGroup(group.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete Group">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Space size="large">
            <Text type="secondary">
              Format: <Text>{group.groupFormat}</Text>
            </Text>
            <Text type="secondary">
              Matches: <Text>{group.completedMatches} / {group.totalMatches}</Text>
            </Text>
            {group.maxTeams && (
              <Text type="secondary">
                Max Teams: <Text>{group.maxTeams}</Text>
              </Text>
            )}
          </Space>
        </Col>

        {group.teams.length === 0 ? (
          <Col span={24}>
            <Empty
              description="No teams assigned yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                size="small"
                icon={<UserAddOutlined />}
                onClick={() => handleAssignTeams(group.id, round.id)}
              >
                Assign Teams
              </Button>
            </Empty>
          </Col>
        ) : (
          <Col span={24}>
            <Tabs
              defaultActiveKey="teams"
              items={[
                {
                  key: "teams",
                  label: (
                    <span>
                      <TeamOutlined /> Teams
                    </span>
                  ),
                  children: (
                    <Space wrap>
                      {group.teams.map((team, idx) => (
                        <Tag
                          key={idx}
                          icon={team.isPlaceholder ? <ClockCircleOutlined /> : <TeamOutlined />}
                          color={team.isPlaceholder ? "orange" : "blue"}
                        >
                          {team.teamName || team.placeholderName || "TBD"}
                        </Tag>
                      ))}
                    </Space>
                  ),
                },
                {
                  key: "matches",
                  label: (
                    <span>
                      <UnorderedListOutlined /> Matches ({group.totalMatches})
                    </span>
                  ),
                  children: (
                    <GroupMatchesView
                      groupId={group.id}
                      groupName={group.groupName}
                    />
                  ),
                },
                {
                  key: "standings",
                  label: (
                    <span>
                      <BarChartOutlined /> Standings
                    </span>
                  ),
                  children: group.standings && group.standings.length > 0 ? (
                    <Table
                      columns={standingsColumns}
                      dataSource={group.standings}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  ) : (
                    <Empty description="No standings available. Complete some matches to see standings." />
                  ),
                },
              ]}
            />
          </Col>
        )}
      </Row>
    </Card>
  );

  const renderRound = (round: TournamentRoundResponse) => {
    const isGroupBased = round.roundType === RoundType.GROUP_BASED;

    return (
      <Panel
        key={round.id}
        header={
          <Space size="large">
            <Space>
              <TrophyOutlined style={{ fontSize: 18 }} />
              <Title level={5} style={{ margin: 0 }}>
                {round.roundName}
              </Title>
            </Space>
            <Tag color={getStatusColor(round.status)}>
              {getStatusIcon(round.status)} {round.status}
            </Tag>
            <Text type="secondary">
              Seq: {round.sequenceOrder} | Round #{round.roundNumber}
            </Text>
            <Text type="secondary">
              Matches: {round.completedMatches} / {round.totalMatches}
            </Text>
          </Space>
        }
        extra={
          <Space onClick={(e) => e.stopPropagation()}>
            {round.status === RoundStatus.ONGOING && (
              <Tooltip title="Complete Round">
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  loading={isCompletingRound}
                  onClick={() => handleCompleteRound(round.id)}
                >
                  Complete
                </Button>
              </Tooltip>
            )}
            {isGroupBased && (
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => handleCreateGroup(round.id)}
              >
                Add Group
              </Button>
            )}
            <Tooltip title="Edit Round">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEditRound(round.id)}
              />
            </Tooltip>
            <Popconfirm
              title="Delete this round?"
              description="Are you sure you want to delete this round? All groups and standings will be deleted."
              onConfirm={() => handleDeleteRound(round.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Delete Round">
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </Space>
        }
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Row gutter={[16, 8]}>
            <Col span={24}>
              <Space size="large">
                <Text type="secondary">
                  Type: <Text>{round.roundType}</Text>
                </Text>
                <Text type="secondary">
                  Format: <Text>{round.roundFormat || "N/A"}</Text>
                </Text>
                {round.startDate && (
                  <Text type="secondary">
                    Start: <Text>{new Date(round.startDate).toLocaleDateString()}</Text>
                  </Text>
                )}
                {round.endDate && (
                  <Text type="secondary">
                    End: <Text>{new Date(round.endDate).toLocaleDateString()}</Text>
                  </Text>
                )}
              </Space>
            </Col>
          </Row>

          {isGroupBased ? (
            round.groups && round.groups.length > 0 ? (
              round.groups.map((group) => renderGroup(group, round))
            ) : (
              <Empty
                description="No groups created yet"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleCreateGroup(round.id)}
                >
                  Create First Group
                </Button>
              </Empty>
            )
          ) : (
            <Card size="small">
              <Empty
                description="Direct knockout round - teams will be assigned directly"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          )}
        </Space>
      </Panel>
    );
  };

  return (
    <>
      <Collapse
        defaultActiveKey={tournamentStructure.rounds.map((r) => r.id)}
        style={{ background: "transparent" }}
      >
        {tournamentStructure.rounds.map(renderRound)}
      </Collapse>

      {/* Group Management Modal */}
      <GroupManagement
        roundId={selectedRoundId}
        groupId={selectedGroupId}
        isModalVisible={showGroupModal}
        onClose={() => {
          setShowGroupModal(false);
          setSelectedRoundId(null);
          setSelectedGroupId(null);
        }}
        onSuccess={() => {
          onRefresh();
          setShowGroupModal(false);
          setSelectedRoundId(null);
          setSelectedGroupId(null);
        }}
      />

      {/* Team Assignment Modal */}
      <TeamAssignment
        groupId={selectedGroupId}
        roundId={selectedRoundId}
        teams={teams}
        isModalVisible={showTeamAssignment}
        onClose={() => {
          setShowTeamAssignment(false);
          setSelectedRoundId(null);
          setSelectedGroupId(null);
        }}
        onSuccess={() => {
          onRefresh();
          setShowTeamAssignment(false);
          setSelectedRoundId(null);
          setSelectedGroupId(null);
        }}
      />

      {/* Group Match Generation Modal */}
      <GroupMatchGenerationModal
        groupId={selectedGroupId}
        groupName={selectedGroupName}
        teamCount={selectedGroupTeamCount}
        isModalVisible={showMatchGeneration}
        onClose={() => {
          setShowMatchGeneration(false);
          setSelectedRoundId(null);
          setSelectedGroupId(null);
          setSelectedGroupName(null);
          setSelectedGroupTeamCount(0);
        }}
        onSuccess={() => {
          onRefresh();
          setShowMatchGeneration(false);
          setSelectedRoundId(null);
          setSelectedGroupId(null);
          setSelectedGroupName(null);
          setSelectedGroupTeamCount(0);
        }}
      />
    </>
  );
}
