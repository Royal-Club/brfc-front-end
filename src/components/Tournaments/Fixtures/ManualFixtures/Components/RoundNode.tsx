import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Card, Tag, Space, Typography, Button } from "antd";
import { TrophyOutlined, CheckCircleOutlined, ClockCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { RoundStatus, RoundType } from "../../../../../state/features/manualFixtures/manualFixtureTypes";

const { Text } = Typography;

interface RoundNodeData {
  roundName: string;
  roundType: string;
  status: RoundStatus;
  totalMatches: number;
  completedMatches: number;
  sequenceOrder: number;
  roundId?: number;
  groups?: any[];
  isHovered?: boolean;
  onHover?: (roundId: number | null) => void;
  onCreateGroup?: (roundId: number) => void;
  onCreateRound?: () => void;
}

interface RoundNodeProps {
  data: RoundNodeData;
  selected?: boolean;
}

/**
 * RoundNode - Visual node for tournament rounds in React Flow
 */
function RoundNode({ data, selected }: RoundNodeProps) {
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

  const getStatusIcon = () => {
    switch (data.status) {
      case "COMPLETED":
        return <CheckCircleOutlined />;
      case "ONGOING":
        return <ClockCircleOutlined spin />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const isGroupBased = data.roundType === RoundType.GROUP_BASED;
  const isHovered = data.isHovered || false;

  return (
    <>
      <Handle type="target" position={Position.Left} id="left" />
      <div
        onMouseEnter={() => data.onHover && data.roundId && data.onHover(data.roundId)}
        onMouseLeave={() => data.onHover && data.onHover(null)}
        style={{ position: "relative" }}
      >
        <Card
          size="small"
          style={{
            width: 280,
            border: selected ? "2px solid #1890ff" : isHovered ? "2px solid #52c41a" : "1px solid #d9d9d9",
            borderLeft: `4px solid ${getStatusColor()}`,
            boxShadow: selected ? "0 4px 12px rgba(24, 144, 255, 0.3)" : isHovered ? "0 4px 12px rgba(82, 196, 26, 0.3)" : "0 2px 8px rgba(0,0,0,0.1)",
            cursor: "pointer",
          }}
          bodyStyle={{ padding: "12px" }}
        >
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            {/* Header */}
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Space>
                <TrophyOutlined style={{ fontSize: 16, color: "#1890ff" }} />
                <Text strong style={{ fontSize: 14 }}>
                  {data.roundName}
                </Text>
              </Space>
              <Tag color={getStatusColor()} icon={getStatusIcon()} style={{ margin: 0 }}>
                {data.status}
              </Tag>
            </Space>

            {/* Details */}
            <Space size={4} direction="vertical" style={{ width: "100%" }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Type: <Text strong>{data.roundType.replace("_", " ")}</Text>
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Matches: <Text strong>{data.completedMatches} / {data.totalMatches}</Text>
              </Text>
              {isGroupBased && data.groups && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Groups: <Text strong>{data.groups.length}</Text>
                </Text>
              )}
            </Space>

            {/* Progress Bar */}
            <div
              style={{
                width: "100%",
                height: 4,
                backgroundColor: "#f0f0f0",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${data.totalMatches > 0 ? (data.completedMatches / data.totalMatches) * 100 : 0}%`,
                  height: "100%",
                  backgroundColor: getStatusColor(),
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </Space>
        </Card>

        {/* Hover Controls */}
        {isHovered && isGroupBased && data.onCreateGroup && data.roundId && (
          <>
            {/* Bottom Add Icon - Add Group */}
            <Button
              type="primary"
              shape="circle"
              icon={<PlusOutlined />}
              size="small"
              style={{
                position: "absolute",
                bottom: -12,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
              onClick={(e) => {
                e.stopPropagation();
                data.onCreateGroup && data.roundId && data.onCreateGroup(data.roundId);
              }}
            />
            {/* Right Add Icon - Add Next Round */}
            {data.onCreateRound && (
              <Button
                type="default"
                shape="circle"
                icon={<PlusOutlined />}
                size="small"
                style={{
                  position: "absolute",
                  right: -12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 10,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  data.onCreateRound && data.onCreateRound();
                }}
              />
            )}
          </>
        )}
      </div>
      <Handle type="source" position={Position.Right} id="right" />
    </>
  );
}

export default memo(RoundNode);
