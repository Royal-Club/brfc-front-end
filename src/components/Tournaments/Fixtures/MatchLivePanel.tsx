import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Tag,
  message,
  Dropdown,
  Menu,
  theme,
} from "antd";
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  useStartMatchMutation,
  useCompleteMatchMutation,
  useRecordMatchEventMutation,
} from "../../../state/features/fixtures/fixturesSlice";
import { IFixture } from "../../../state/features/fixtures/fixtureTypes";
import StartMatchModal from "./StartMatchModal";
import CompleteMatchModal from "./CompleteMatchModal";

interface MatchLivePanelProps {
  fixture: IFixture;
  onSuccess?: () => void;
  compact?: boolean;
}

export default function MatchLivePanel({
  fixture,
  onSuccess,
  compact = false,
}: MatchLivePanelProps) {
  const [startMatch, { isLoading: startLoading }] = useStartMatchMutation();
  const [completeMatch, { isLoading: completeLoading }] =
    useCompleteMatchMutation();
  const [recordEvent] = useRecordMatchEventMutation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [startModalVisible, setStartModalVisible] = useState(false);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const { token } = theme.useToken();

  const handleStartMatch = () => {
    setMenuVisible(false);
    setStartModalVisible(true);
  };

  const handleStartConfirm = async (venueId?: number, matchDurationMinutes?: number) => {
    try {
      await startMatch({ 
        matchId: fixture.id,
        venueId,
        matchDurationMinutes,
      }).unwrap();
      
      // TODO: Uncomment when backend MatchEventType enum includes MATCH_STARTED
      // Backend enum needs to be updated to include: MATCH_STARTED, MATCH_COMPLETED
      // Current backend enum: [GOAL, INJURY, ASSIST, YELLOW_CARD, SUBSTITUTION, RED_CARD]
      // Required: Add MATCH_STARTED and MATCH_COMPLETED to the enum
      // 
      // Record MATCH_STARTED event automatically
      // try {
      //   await recordEvent({
      //     matchId: fixture.id,
      //     eventType: "MATCH_STARTED",
      //     playerId: 0, // System event, no player
      //     teamId: fixture.homeTeamId, // Use home team as placeholder
      //     eventTime: 0, // Match just started
      //     description: `Match started at ${new Date().toLocaleTimeString()}`,
      //   }).unwrap();
      // } catch (eventError) {
      //   // Don't fail the start match if event recording fails
      //   console.warn("Failed to record match started event:", eventError);
      // }
      
      message.success("Match started successfully");
      setStartModalVisible(false);
      onSuccess?.();
    } catch (error: any) {
      message.error(error?.data?.message || "Failed to start match");
    }
  };

  const handleCompleteMatch = () => {
    setMenuVisible(false);
    setCompleteModalVisible(true);
  };

  const handleCompleteConfirm = async (matchDurationMinutes?: number) => {
    try {
      // Calculate duration automatically if not provided
      // Priority: provided value > elapsed time > fixture duration > 90 default
      const calculatedDuration = matchDurationMinutes || 
        (fixture.elapsedTimeSeconds 
          ? Math.min(Math.ceil(fixture.elapsedTimeSeconds / 60), 120)
          : Math.min(fixture.matchDurationMinutes || 90, 120));
      
      await completeMatch({ 
        matchId: fixture.id,
        matchDurationMinutes: calculatedDuration,
      }).unwrap();
      
      // TODO: Uncomment when backend MatchEventType enum includes MATCH_COMPLETED
      // Backend enum needs to be updated to include: MATCH_STARTED, MATCH_COMPLETED
      // Current backend enum: [GOAL, INJURY, ASSIST, YELLOW_CARD, SUBSTITUTION, RED_CARD]
      // Required: Add MATCH_STARTED and MATCH_COMPLETED to the enum
      //
      // Record MATCH_COMPLETED event automatically
      // try {
      //   await recordEvent({
      //     matchId: fixture.id,
      //     eventType: "MATCH_COMPLETED",
      //     playerId: 0, // System event, no player
      //     teamId: fixture.homeTeamId, // Use home team as placeholder
      //     eventTime: finalElapsedMinutes,
      //     description: `Match completed. Final score: ${fixture.homeTeamName} ${fixture.homeTeamScore} - ${fixture.awayTeamScore} ${fixture.awayTeamName}`,
      //   }).unwrap();
      // } catch (eventError) {
      //   // Don't fail the complete match if event recording fails
      //   console.warn("Failed to record match completed event:", eventError);
      // }
      
      message.success("Match completed successfully");
      setCompleteModalVisible(false);
      onSuccess?.();
    } catch (error: any) {
      message.error(error?.data?.message || "Failed to complete match");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "blue";
      case "ONGOING":
        return "orange";
      case "PAUSED":
        return "purple";
      case "COMPLETED":
        return "green";
      default:
        return "default";
    }
  };

  const matchControlMenu = (
    <Menu>
      {fixture.matchStatus === "SCHEDULED" && (
        <Menu.Item
          key="start"
          icon={<PlayCircleOutlined />}
          onClick={handleStartMatch}
        >
          Start Match
        </Menu.Item>
      )}
      {fixture.matchStatus === "ONGOING" && (
        <Menu.Item
          key="complete"
          icon={<CheckCircleOutlined />}
          onClick={handleCompleteMatch}
          danger
        >
          Complete Match
        </Menu.Item>
      )}
      {fixture.matchStatus === "COMPLETED" && (
        <Menu.Item key="info" disabled>
          Match is already completed
        </Menu.Item>
      )}
    </Menu>
  );

  // Compact mode - just the button with status tag
  if (compact) {
    return (
      <>
        <Dropdown
          overlay={matchControlMenu}
          trigger={["click"]}
          open={menuVisible}
          onOpenChange={setMenuVisible}
        >
          <Button
            icon={<SettingOutlined />}
            size="large"
            style={{
              borderRadius: 12,
              height: 48,
              paddingLeft: 20,
              paddingRight: 20,
              background: token.colorBgContainer,
              backdropFilter: "blur(10px)",
              border: `2px solid ${token.colorBorder}`,
              boxShadow: token.colorBgContainer === '#ffffff'
                ? "0 4px 12px rgba(0,0,0,0.15)"
                : "0 4px 12px rgba(0,0,0,0.4)",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: token.colorText,
            }}
          >
            <Tag
              color={getStatusColor(fixture.matchStatus)}
              style={{
                fontSize: 12,
                padding: "4px 12px",
                fontWeight: 700,
                margin: 0,
                border: "none",
              }}
            >
              {fixture.matchStatus}
            </Tag>
            Match Settings
          </Button>
        </Dropdown>

        {/* Start Match Modal */}
        <StartMatchModal
          open={startModalVisible}
          fixture={fixture}
          onCancel={() => setStartModalVisible(false)}
          onConfirm={handleStartConfirm}
          isLoading={startLoading}
        />

        {/* Complete Match Modal */}
        <CompleteMatchModal
          open={completeModalVisible}
          fixture={fixture}
          onCancel={() => setCompleteModalVisible(false)}
          onConfirm={handleCompleteConfirm}
          isLoading={completeLoading}
        />
      </>
    );
  }

  // Full card mode
  return (
    <>
      <Card
        title="Match Controls"
        extra={
          <Dropdown
            overlay={matchControlMenu}
            trigger={["click"]}
            visible={menuVisible}
            onVisibleChange={setMenuVisible}
          >
            <Button
              icon={<SettingOutlined />}
              size="large"
              style={{ borderRadius: 8 }}
            >
              Match Settings
            </Button>
          </Dropdown>
        }
        style={{
          borderRadius: 12,
          border: "none",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#666" }}>
                Current Status:
              </span>
              <Tag
                color={getStatusColor(fixture.matchStatus)}
                style={{ fontSize: 14, padding: "6px 16px", fontWeight: 600 }}
              >
                {fixture.matchStatus}
              </Tag>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Start Match Modal */}
      <StartMatchModal
        open={startModalVisible}
        fixture={fixture}
        onCancel={() => setStartModalVisible(false)}
        onConfirm={handleStartConfirm}
        isLoading={startLoading}
      />

      {/* Complete Match Modal */}
      <CompleteMatchModal
        open={completeModalVisible}
        fixture={fixture}
        onCancel={() => setCompleteModalVisible(false)}
        onConfirm={handleCompleteConfirm}
        isLoading={completeLoading}
      />
    </>
  );
}
