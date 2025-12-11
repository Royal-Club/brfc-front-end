import React, { useState, useMemo } from "react";
import {
  Modal,
  Checkbox,
  Space,
  Button,
  Typography,
  Table,
  Tag,
  Alert,
  message,
  Empty,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  TeamOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { TournamentRoundResponse, RoundGroupResponse, GroupStandingResponse } from "../../../../state/features/manualFixtures/manualFixtureTypes";

const { Title, Text } = Typography;

interface TeamAdvancementModalProps {
  round: TournamentRoundResponse | null;
  isModalVisible: boolean;
  onClose: () => void;
  onConfirm: (selectedTeamIds: number[]) => void;
  isLoading?: boolean;
}

export default function TeamAdvancementModal({
  round,
  isModalVisible,
  onClose,
  onConfirm,
  isLoading = false,
}: TeamAdvancementModalProps) {
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [selectionMode, setSelectionMode] = useState<"automatic" | "manual">("automatic");

  // Get all teams from round (from groups or direct teams)
  const availableTeams = useMemo(() => {
    if (!round) return [];

    const teams: Array<{
      teamId: number;
      teamName: string;
      groupName?: string;
      position?: number;
      points?: number;
      goalDifference?: number;
    }> = [];

    if (round.roundType === "GROUP_BASED" && round.groups) {
      // Get teams from all groups with standings
      round.groups.forEach((group: RoundGroupResponse) => {
        if (group.standings && group.standings.length > 0) {
          group.standings.forEach((standing: GroupStandingResponse) => {
            teams.push({
              teamId: standing.teamId,
              teamName: standing.teamName,
              groupName: group.groupName,
              position: standing.position || undefined,
              points: standing.points,
              goalDifference: standing.goalDifference,
            });
          });
        } else {
          // If no standings, get teams from group.teams
          group.teams.forEach((team) => {
            if (!team.isPlaceholder && team.teamId) {
              teams.push({
                teamId: team.teamId,
                teamName: team.teamName || "",
                groupName: group.groupName,
              });
            }
          });
        }
      });
    } else if (round.teams) {
      // Direct knockout round
      round.teams.forEach((team) => {
        if (!team.isPlaceholder && team.teamId) {
          teams.push({
            teamId: team.teamId,
            teamName: team.teamName || "",
          });
        }
      });
    }

    // Sort by position/points if available
    return teams.sort((a, b) => {
      if (a.position && b.position) return a.position - b.position;
      if (a.points && b.points) {
        if (a.points !== b.points) return b.points - a.points;
        if (a.goalDifference && b.goalDifference) return b.goalDifference - a.goalDifference;
      }
      return a.teamName.localeCompare(b.teamName);
    });
  }, [round]);

  const handleTeamToggle = (teamId: number, checked: boolean) => {
    if (checked) {
      setSelectedTeamIds([...selectedTeamIds, teamId]);
    } else {
      setSelectedTeamIds(selectedTeamIds.filter((id) => id !== teamId));
    }
  };

  const handleSelectAll = () => {
    setSelectedTeamIds(availableTeams.map((t) => t.teamId));
  };

  const handleDeselectAll = () => {
    setSelectedTeamIds([]);
  };

  const handleConfirm = () => {
    if (selectionMode === "manual" && selectedTeamIds.length === 0) {
      message.warning("Please select at least one team to advance");
      return;
    }

    if (selectionMode === "automatic") {
      // Use automatic advancement (no team selection)
      onConfirm([]);
    } else {
      // Use manual selection
      onConfirm(selectedTeamIds);
    }
  };

  const handleCancel = () => {
    setSelectedTeamIds([]);
    setSelectionMode("automatic");
    onClose();
  };

  const columns = [
    {
      title: "",
      key: "checkbox",
      width: 50,
      render: (_: any, record: any) => (
        <Checkbox
          checked={selectedTeamIds.includes(record.teamId)}
          onChange={(e) => handleTeamToggle(record.teamId, e.target.checked)}
          disabled={selectionMode === "automatic"}
        />
      ),
    },
    {
      title: "Team",
      dataIndex: "teamName",
      key: "teamName",
      render: (name: string, record: any) => (
        <Space>
          <TeamOutlined />
          <Text strong>{name}</Text>
          {record.groupName && (
            <Tag color="blue" style={{ fontSize: 11 }}>
              {record.groupName}
            </Tag>
          )}
        </Space>
      ),
    },
    ...(round?.roundType === "GROUP_BASED"
      ? [
          {
            title: "Pos",
            dataIndex: "position",
            key: "position",
            width: 60,
            render: (pos: number | undefined) => (
              <Text strong>{pos || "-"}</Text>
            ),
          },
          {
            title: "Pts",
            dataIndex: "points",
            key: "points",
            width: 60,
            render: (pts: number | undefined) => (
              <Text>{pts !== undefined ? pts : "-"}</Text>
            ),
          },
          {
            title: "GD",
            dataIndex: "goalDifference",
            key: "goalDifference",
            width: 70,
            render: (gd: number | undefined) => (
              <Text style={{ color: gd && gd > 0 ? "#52c41a" : gd && gd < 0 ? "#ff4d4f" : undefined }}>
                {gd !== undefined ? (gd > 0 ? `+${gd}` : gd) : "-"}
              </Text>
            ),
          },
        ]
      : []),
  ];

  if (!round) {
    return null;
  }

  // Note: We'll need to get next round from parent component
  // For now, we'll assume there's a next round if sequenceOrder exists
  const hasNextRound = round.sequenceOrder !== undefined;

  return (
    <Modal
      title={
        <Space>
          <TrophyOutlined style={{ fontSize: 20, color: "#1890ff" }} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>
            Complete Round & Advance Teams
          </span>
        </Space>
      }
      open={isModalVisible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          icon={<CheckCircleOutlined />}
          loading={isLoading}
          onClick={handleConfirm}
        >
          {selectionMode === "automatic"
            ? "Complete & Auto-Advance"
            : `Complete & Advance ${selectedTeamIds.length} Team${selectedTeamIds.length !== 1 ? "s" : ""}`}
        </Button>,
      ]}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Alert
        message={`Completing: ${round.roundName}`}
        description={
          hasNextRound
            ? "Teams will advance to the next round"
            : "This is the final round. No teams will advance."
        }
        type="info"
        showIcon
      />

      {!hasNextRound && (
          <Alert
            message="Final Round"
            description="This is the last round. Completing it will finish the tournament."
            type="warning"
            showIcon
          />
        )}

        {hasNextRound && (
          <>
            <div>
              <Space>
                <Text strong>Advancement Mode:</Text>
                <Button
                  size="small"
                  type={selectionMode === "automatic" ? "primary" : "default"}
                  onClick={() => {
                    setSelectionMode("automatic");
                    setSelectedTeamIds([]);
                  }}
                >
                  Automatic (Use Rules)
                </Button>
                <Button
                  size="small"
                  type={selectionMode === "manual" ? "primary" : "default"}
                  onClick={() => setSelectionMode("manual")}
                >
                  Manual Selection
                </Button>
              </Space>
            </div>

            {selectionMode === "manual" && (
              <>
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Statistic
                      title="Available Teams"
                      value={availableTeams.length}
                      prefix={<TeamOutlined />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Selected"
                      value={selectedTeamIds.length}
                      valueStyle={{ color: "#1890ff" }}
                      prefix={<CheckCircleOutlined />}
                    />
                  </Col>
                  <Col span={8}>
                    <Space>
                      <Button size="small" onClick={handleSelectAll}>
                        Select All
                      </Button>
                      <Button size="small" onClick={handleDeselectAll}>
                        Clear
                      </Button>
                    </Space>
                  </Col>
                </Row>

                {availableTeams.length === 0 ? (
                  <Empty description="No teams available to advance" />
                ) : (
                  <Table
                    columns={columns}
                    dataSource={availableTeams}
                    rowKey="teamId"
                    pagination={false}
                    size="small"
                    scroll={{ y: 300 }}
                  />
                )}
              </>
            )}

            {selectionMode === "automatic" && (
              <Alert
                message="Automatic Advancement"
                description="Teams will be advanced based on configured advancement rules (e.g., top 2 from each group)."
                type="info"
                showIcon
              />
            )}
          </>
        )}
      </Space>
    </Modal>
  );
}

