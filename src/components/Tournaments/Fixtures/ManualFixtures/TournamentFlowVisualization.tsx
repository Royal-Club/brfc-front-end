import { useCallback, useMemo, useState, useEffect, useLayoutEffect } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Connection,
  ConnectionMode,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card, Space, Typography, Button, Tooltip, Tag } from "antd";
import {
  ExpandOutlined,
  CompressOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import RoundNode from "./Components/RoundNode";
import GroupNode from "./Components/GroupNode";
import TeamNode from "./Components/TeamNode";
import { TournamentStructureResponse } from "../../../../state/features/manualFixtures/manualFixtureTypes";

const { Text } = Typography;

interface TournamentFlowVisualizationProps {
  tournamentStructure: TournamentStructureResponse;
  onNodeClick?: (nodeId: string, nodeType: string, data: any) => void;
  hoveredRoundId?: number | null;
  hoveredGroupId?: number | null;
  onHoverRound?: (roundId: number | null) => void;
  onHoverGroup?: (groupId: number | null) => void;
  onCreateRound?: () => void;
  onCreateGroup?: (roundId: number) => void;
  onAssignTeams?: (groupId: number) => void;
  onRefresh?: () => void;
}

// Register custom node types
const nodeTypes = {
  roundNode: RoundNode,
  groupNode: GroupNode,
  teamNode: TeamNode,
};

/**
 * TournamentFlowVisualization - Node-based tournament structure visualization
 *
 * Uses React Flow to display tournament rounds, groups, and teams as
 * an interactive flowchart with drag-and-drop, zoom, and pan controls.
 */
export default function TournamentFlowVisualization({
  tournamentStructure,
  onNodeClick,
  hoveredRoundId,
  hoveredGroupId,
  onHoverRound,
  onHoverGroup,
  onCreateRound,
  onCreateGroup,
  onAssignTeams,
  onRefresh,
}: TournamentFlowVisualizationProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Generate nodes and edges from tournament structure
  useEffect(() => {
    const generatedNodes: Node[] = [];
    const generatedEdges: Edge[] = [];

    const roundSpacing = 400; // Horizontal space between rounds
    const groupSpacing = 200; // Vertical space between groups
    const startX = 50;
    const startY = 100;

    tournamentStructure.rounds.forEach((round, roundIndex) => {
      const roundX = startX + roundIndex * roundSpacing;
      const roundY = startY;

      // Create round node
      generatedNodes.push({
        id: `round-${round.id}`,
        type: "roundNode",
        position: { x: roundX, y: roundY },
        data: {
          roundName: round.roundName,
          roundType: round.roundType,
          status: round.status,
          totalMatches: round.totalMatches,
          completedMatches: round.completedMatches,
          sequenceOrder: round.sequenceOrder,
          roundId: round.id,
          groups: round.groups,
          isHovered: hoveredRoundId === round.id,
          onHover: onHoverRound,
          onCreateGroup: onCreateGroup,
          onCreateRound: onCreateRound,
        },
      });

      // Create group nodes for GROUP_BASED rounds
      if (round.roundType === "GROUP_BASED" && round.groups) {
        round.groups.forEach((group, groupIndex) => {
          const groupX = roundX;
          const groupY = roundY + 150 + groupIndex * groupSpacing;

          generatedNodes.push({
            id: `group-${group.id}`,
            type: "groupNode",
            position: { x: groupX, y: groupY },
            data: {
              groupName: group.groupName,
              teamCount: group.teams.length,
              maxTeams: group.maxTeams,
              totalMatches: group.totalMatches,
              completedMatches: group.completedMatches,
              status: group.status,
              groupId: group.id,
              teams: group.teams,
              isHovered: hoveredGroupId === group.id,
              onHover: onHoverGroup,
              onAssignTeams: onAssignTeams,
            },
            parentNode: `round-${round.id}`,
            extent: "parent" as const,
          });

          // Edge from round to group
          generatedEdges.push({
            id: `edge-round-${round.id}-group-${group.id}`,
            source: `round-${round.id}`,
            target: `group-${group.id}`,
            type: "smoothstep",
            animated: group.status === "ONGOING",
            style: { stroke: group.status === "COMPLETED" ? "#52c41a" : "#d9d9d9" },
          });

          // Optionally create team nodes (can be toggled for performance)
          // Commented out by default to avoid clutter
          /*
          group.teams.slice(0, 3).forEach((team, teamIndex) => {
            const teamX = groupX + 250;
            const teamY = groupY + teamIndex * 60;

            generatedNodes.push({
              id: `team-${team.id || `${group.id}-${teamIndex}`}`,
              type: "teamNode",
              position: { x: teamX, y: teamY },
              data: {
                teamName: team.teamName,
                isPlaceholder: team.isPlaceholder,
                placeholderName: team.placeholderName,
              },
            });

            generatedEdges.push({
              id: `edge-group-${group.id}-team-${team.id || teamIndex}`,
              source: `group-${group.id}`,
              target: `team-${team.id || `${group.id}-${teamIndex}`}`,
              type: "smoothstep",
            });
          });
          */
        });
      }

      // Create edges between rounds (advancement connections)
      if (roundIndex > 0) {
        const previousRound = tournamentStructure.rounds[roundIndex - 1];
        generatedEdges.push({
          id: `edge-round-${previousRound.id}-round-${round.id}`,
          source: `round-${previousRound.id}`,
          target: `round-${round.id}`,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#1890ff", strokeWidth: 2 },
          label: "Advance",
          labelStyle: { fontSize: 12, fill: "#1890ff" },
        });
      }
    });

    setNodes(generatedNodes);
    setEdges(generatedEdges);
  }, [tournamentStructure, hoveredRoundId, hoveredGroupId, onHoverRound, onHoverGroup, onCreateRound, onCreateGroup, onAssignTeams, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_event: any, node: Node) => {
      if (onNodeClick) {
        const nodeType = node.type || "unknown";
        onNodeClick(node.id, nodeType, node.data);
      }
    },
    [onNodeClick]
  );

  const handleResetView = useCallback(() => {
    // Reload nodes and edges
    setNodes((nds) => nds.map((n) => ({ ...n })));
  }, [setNodes]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const containerHeight = isFullscreen ? "100vh" : "100%";
  const minHeight = isFullscreen ? "100vh" : 600;

  return (
    <div
      style={{
        height: containerHeight,
        minHeight: minHeight,
        width: "100%",
        position: isFullscreen ? "fixed" : "relative",
        top: isFullscreen ? 0 : "auto",
        left: isFullscreen ? 0 : "auto",
        zIndex: isFullscreen ? 9999 : "auto",
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: false,
        }}
        style={{ backgroundColor: "#f5f5f5" }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #d9d9d9",
          }}
        />

        {/* Custom Panel with Controls */}
        <Panel position="top-right">
          <Card size="small" style={{ minWidth: 200 }}>
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <Space size={8} wrap>
                {onCreateRound && (
                  <Tooltip title="Add Round">
                    <Button size="small" type="primary" icon={<PlusOutlined />} onClick={onCreateRound} />
                  </Tooltip>
                )}
                {onRefresh && (
                  <Tooltip title="Refresh">
                    <Button size="small" icon={<ReloadOutlined />} onClick={onRefresh} />
                  </Tooltip>
                )}
                <Tooltip title="Reset view">
                  <Button size="small" icon={<ReloadOutlined />} onClick={handleResetView} />
                </Tooltip>
                <Tooltip title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
                  <Button
                    size="small"
                    icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
                    onClick={toggleFullscreen}
                  />
                </Tooltip>
              </Space>

              <div style={{ fontSize: 11, color: "#8c8c8c" }}>
                <InfoCircleOutlined /> Hover nodes for controls • Click for details
              </div>
            </Space>
          </Card>
        </Panel>

        {/* Legend Panel */}
        <Panel position="bottom-left">
          <Card size="small" title="Legend" style={{ minWidth: 180 }}>
            <Space direction="vertical" size={4}>
              <Space size={4}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    backgroundColor: "#52c41a",
                    borderRadius: 2,
                  }}
                />
                <Text style={{ fontSize: 11 }}>Completed</Text>
              </Space>
              <Space size={4}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    backgroundColor: "#1890ff",
                    borderRadius: 2,
                  }}
                />
                <Text style={{ fontSize: 11 }}>Ongoing</Text>
              </Space>
              <Space size={4}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    backgroundColor: "#d9d9d9",
                    borderRadius: 2,
                  }}
                />
                <Text style={{ fontSize: 11 }}>Not Started</Text>
              </Space>
              <Space size={4}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    border: "1px dashed #faad14",
                    borderRadius: 2,
                    backgroundColor: "#fffbe6",
                  }}
                />
                <Text style={{ fontSize: 11 }}>Placeholder</Text>
              </Space>
            </Space>
          </Card>
        </Panel>
      </ReactFlow>
    </div>
  );
}
