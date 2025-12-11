import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Card, Tag, Space, Typography, Badge, Button, Tooltip } from "antd";
import { TeamOutlined, TrophyOutlined, PlusOutlined, UserAddOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface GroupNodeData {
  groupName: string;
  teamCount: number;
  maxTeams?: number;
  totalMatches: number;
  completedMatches: number;
  status: string;
  groupId?: number;
  teams?: any[];
  isHovered?: boolean;
  onHover?: (groupId: number | null) => void;
  onAssignTeams?: (groupId: number) => void;
}

interface GroupNodeProps {
  data: GroupNodeData;
  selected?: boolean;
}

/**
 * GroupNode - Visual node for groups in React Flow
 */
function GroupNode({ data, selected }: GroupNodeProps) {
  const getStatusColor = () => {
    switch (data.status) {
      case "COMPLETED":
        return "#52c41a";
      case "ONGOING":
        return "#1890ff";
      default:
        return "#d9d9d9";
    }
  };

  const completionPercent =
    data.totalMatches > 0 ? Math.round((data.completedMatches / data.totalMatches) * 100) : 0;

  const isHovered = data.isHovered || false;
  const hasTeams = (data.teamCount || 0) > 0;
  const teamsList = data.teams || [];

  return (
    <>
      <Handle type="target" position={Position.Left} id="left" />
      <div
        onMouseEnter={() => data.onHover && data.groupId && data.onHover(data.groupId)}
        onMouseLeave={() => data.onHover && data.onHover(null)}
        style={{ position: "relative" }}
      >
        <Tooltip
          title={
            teamsList.length > 0 ? (
              <div>
                <Text strong style={{ color: "#fff" }}>Teams:</Text>
                <ul style={{ margin: "4px 0", paddingLeft: 20, color: "#fff" }}>
                  {teamsList.slice(0, 5).map((team: any, idx: number) => (
                    <li key={idx} style={{ color: "#fff" }}>
                      {team.teamName || team.placeholderName || "TBD"}
                    </li>
                  ))}
                  {teamsList.length > 5 && <li style={{ color: "#fff" }}>...and {teamsList.length - 5} more</li>}
                </ul>
              </div>
            ) : (
              "No teams assigned"
            )
          }
          placement="top"
        >
          <Card
            size="small"
            style={{
              width: 220,
              border: selected ? "2px solid #1890ff" : isHovered ? "2px solid #52c41a" : "1px solid #d9d9d9",
              borderRadius: 8,
              boxShadow: selected ? "0 4px 12px rgba(24, 144, 255, 0.3)" : isHovered ? "0 4px 12px rgba(82, 196, 26, 0.3)" : "0 2px 8px rgba(0,0,0,0.1)",
              cursor: "pointer",
              backgroundColor: "#fafafa",
            }}
            bodyStyle={{ padding: "10px" }}
          >
            <Space direction="vertical" size={6} style={{ width: "100%" }}>
              {/* Header */}
              <Space style={{ width: "100%", justifyContent: "space-between" }}>
                <Space size={4}>
                  <TeamOutlined style={{ color: "#1890ff" }} />
                  <Text strong style={{ fontSize: 13 }}>
                    {data.groupName}
                  </Text>
                </Space>
                <Badge
                  count={data.teamCount}
                  showZero
                  style={{ backgroundColor: "#1890ff" }}
                  title={`${data.teamCount} teams`}
                />
              </Space>

              {/* Stats */}
              <Space size={4} wrap>
                <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
                  {data.teamCount}{data.maxTeams ? `/${data.maxTeams}` : ""} Teams
                </Tag>
                <Tag color="green" style={{ fontSize: 11, margin: 0 }}>
                  {data.completedMatches}/{data.totalMatches} Matches
                </Tag>
              </Space>

              {/* Progress */}
              {data.totalMatches > 0 && (
                <div
                  style={{
                    width: "100%",
                    height: 3,
                    backgroundColor: "#f0f0f0",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${completionPercent}%`,
                      height: "100%",
                      backgroundColor: getStatusColor(),
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              )}
            </Space>
          </Card>
        </Tooltip>

        {/* Hover Control - Add Teams */}
        {isHovered && data.onAssignTeams && data.groupId && (
          <Button
            type="primary"
            shape="circle"
            icon={hasTeams ? undefined : <UserAddOutlined />}
            size="small"
            disabled={hasTeams}
            style={{
              position: "absolute",
              top: -12,
              right: -12,
              zIndex: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!hasTeams && data.onAssignTeams && data.groupId) {
                data.onAssignTeams(data.groupId);
              }
            }}
            title={hasTeams ? "Teams already assigned" : "Add Teams"}
          >
            {hasTeams ? "✓" : undefined}
          </Button>
        )}
      </div>
      <Handle type="source" position={Position.Right} id="right" />
    </>
  );
}

export default memo(GroupNode);
