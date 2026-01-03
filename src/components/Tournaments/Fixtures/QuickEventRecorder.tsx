import React, { useState } from "react";
import {
  Card,
  Button,
  Select,
  message,
  Space,
  Typography,
  Row,
  Col,
  Input,
  Modal,
  Divider,
  theme,
} from "antd";
import {
  ThunderboltOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { IFixture } from "../../../state/features/fixtures/fixtureTypes";
import { useRecordMatchEventMutation } from "../../../state/features/fixtures/fixturesSlice";
import moment from "moment";

const { Text } = Typography;
const { useToken } = theme;

interface QuickEventRecorderProps {
  matchId: number;
  fixture: IFixture | null;
  homeTeamPlayers?: Array<{ id: number; name: string }>;
  awayTeamPlayers?: Array<{ id: number; name: string }>;
  onSuccess?: () => void;
}

const EVENT_TYPES = [
  { value: "GOAL", label: "Goal", icon: "⚽", color: "#52c41a" },
  { value: "YELLOW_CARD", label: "Yellow Card", icon: "🟨", color: "#faad14" },
  { value: "RED_CARD", label: "Red Card", icon: "🟥", color: "#f5222d" },
  { value: "SUBSTITUTION", label: "Substitution", icon: "🔄", color: "#722ed1" },
  { value: "INJURY", label: "Injury", icon: "🤕", color: "#fa8c16" },
];

export default function QuickEventRecorder({
  matchId,
  fixture,
  homeTeamPlayers = [],
  awayTeamPlayers = [],
  onSuccess,
}: QuickEventRecorderProps) {
  const { token } = useToken();
  const [recordEvent, { isLoading }] = useRecordMatchEventMutation();
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [assistPlayerId, setAssistPlayerId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  // Calculate current elapsed time (capped at 120 minutes)
  const calculateElapsedTime = (): number => {
    if (!fixture) return 0;

    let elapsedSeconds = 0;
    
    if (fixture.matchStatus === "ONGOING" && fixture.startedAt) {
      const startTime = moment.utc(fixture.startedAt).local().valueOf();
      const now = Date.now();
      const timeSinceStart = Math.floor((now - startTime) / 1000);
      elapsedSeconds = (fixture.elapsedTimeSeconds || 0) + timeSinceStart;
    } else if (fixture.matchStatus === "PAUSED" || fixture.matchStatus === "COMPLETED") {
      elapsedSeconds = fixture.elapsedTimeSeconds || 0;
    }

    // Cap at 120 minutes (7200 seconds)
    const cappedSeconds = Math.min(elapsedSeconds, 7200);
    return Math.floor(cappedSeconds / 60);
  };

  const handleEventTypeClick = (eventType: string) => {
    setSelectedEventType(eventType);
    setModalVisible(true);
  };

  const handleRecordEvent = async () => {
    if (!selectedEventType || !selectedTeamId || !selectedPlayerId) {
      message.error("Please select event type, team, and player");
      return;
    }

    // For GOAL events, assist player is optional but recommended
    if (selectedEventType === "GOAL" && !assistPlayerId) {
      Modal.confirm({
        title: "No Assist Recorded",
        content: "No assist player selected. Do you want to record the goal without an assist?",
        okText: "Record Without Assist",
        cancelText: "Cancel",
        onOk: async () => {
          await submitEvent();
        },
      });
      return;
    }

    await submitEvent();
  };

  const submitEvent = async () => {
    try {
      const currentMinute = calculateElapsedTime();

      await recordEvent({
        matchId,
        eventType: selectedEventType!,
        playerId: selectedPlayerId!,
        teamId: selectedTeamId!,
        eventTime: currentMinute,
        description: description.trim() || undefined,
        relatedPlayerId: assistPlayerId || undefined, // For GOAL events, this is the assist player
      }).unwrap();

      message.success("Event recorded successfully");
      resetForm();
      onSuccess?.();
    } catch (error: any) {
      console.error("Failed to record event:", error);
      message.error(error?.data?.message || "Failed to record event");
    }
  };

  const resetForm = () => {
    setSelectedEventType(null);
    setSelectedTeamId(null);
    setSelectedPlayerId(null);
    setAssistPlayerId(null);
    setDescription("");
    setModalVisible(false);
  };

  const currentTeamPlayers =
    selectedTeamId === fixture?.homeTeamId
      ? homeTeamPlayers
      : selectedTeamId === fixture?.awayTeamId
      ? awayTeamPlayers
      : [];

  const selectedEvent = EVENT_TYPES.find((e) => e.value === selectedEventType);

  if (!fixture) {
    return (
      <div style={{ padding: "20px 0" }}>
        <Text type="secondary">No fixture data available</Text>
      </div>
    );
  }

  const isScheduled = fixture.matchStatus === "SCHEDULED";

  return (
    <>
      <div style={{ position: "relative" }}>
        {/* Header */}
        <div style={{
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: `1px solid ${token.colorBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <Space>
            <ThunderboltOutlined />
            <span style={{ fontSize: 16, fontWeight: 600 }}>Quick Event Recording</span>
          </Space>
          <Text type="secondary" style={{ fontSize: 14, fontWeight: 600 }}>
            {calculateElapsedTime()}'
          </Text>
        </div>

        {isScheduled && (
          <div
            style={{
              padding: "12px 16px",
              marginBottom: 16,
              background: token.colorWarningBg,
              border: `1px solid ${token.colorWarningBorder}`,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 13, color: token.colorWarningText }}>
              Event recording is disabled. Events can only be recorded during or after the match.
            </Text>
          </div>
        )}

        <Text
          type="secondary"
          style={{ display: "block", marginBottom: 12, fontSize: 13 }}
        >
          Click on an event type to quickly record it
        </Text>

        <Row gutter={[12, 12]}>
          {EVENT_TYPES.map((event) => (
            <Col xs={12} sm={8} key={event.value}>
              <Button
                size="large"
                block
                onClick={() => handleEventTypeClick(event.value)}
                disabled={isScheduled}
                style={{
                  height: "auto",
                  padding: "12px 8px",
                  borderRadius: 12,
                  border: `2px solid ${event.color}30`,
                  background: isScheduled ? token.colorBgContainerDisabled : `${event.color}08`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.3s ease",
                  cursor: isScheduled ? "not-allowed" : "pointer",
                  opacity: isScheduled ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isScheduled) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = `0 4px 12px ${event.color}30`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isScheduled) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                <span style={{ fontSize: 28 }}>{event.icon}</span>
                <Text
                  strong
                  style={{
                    fontSize: 12,
                    color: isScheduled ? token.colorTextDisabled : event.color,
                    textAlign: "center",
                  }}
                >
                  {event.label}
                </Text>
              </Button>
            </Col>
          ))}
        </Row>
      </div>

      {/* Event Recording Modal */}
      <Modal
        title={
          <Space size="middle">
            <span style={{ fontSize: 32 }}>{selectedEvent?.icon}</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, color: selectedEvent?.color }}>
                Record {selectedEvent?.label}
              </div>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Match Time: {calculateElapsedTime()}'
              </Text>
            </div>
          </Space>
        }
        open={modalVisible}
        onCancel={resetForm}
        onOk={handleRecordEvent}
        okText={selectedEventType === "GOAL" && !assistPlayerId 
          ? "Record Goal (No Assist)" 
          : "Record Event"}
        confirmLoading={isLoading}
        width={500}
        okButtonProps={{
          disabled: !selectedTeamId || !selectedPlayerId,
          style: { borderRadius: 8, height: 40 },
        }}
        cancelButtonProps={{ style: { borderRadius: 8, height: 40 } }}
      >
        <Divider style={{ margin: "16px 0" }} />

        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Team Selection */}
          <div>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              Select Team *
            </Text>
            <Row gutter={12}>
              <Col span={12}>
                <Button
                  size="large"
                  block
                  type={selectedTeamId === fixture.homeTeamId ? "primary" : "default"}
                  onClick={() => {
                    setSelectedTeamId(fixture.homeTeamId);
                    setSelectedPlayerId(null);
                  }}
                  style={{
                    height: 60,
                    borderRadius: 12,
                    fontWeight: 600,
                    background:
                      selectedTeamId === fixture.homeTeamId
                        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        : undefined,
                  }}
                >
                  {fixture.homeTeamName}
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  size="large"
                  block
                  type={selectedTeamId === fixture.awayTeamId ? "primary" : "default"}
                  onClick={() => {
                    setSelectedTeamId(fixture.awayTeamId);
                    setSelectedPlayerId(null);
                  }}
                  style={{
                    height: 60,
                    borderRadius: 12,
                    fontWeight: 600,
                    background:
                      selectedTeamId === fixture.awayTeamId
                        ? "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                        : undefined,
                  }}
                >
                  {fixture.awayTeamName}
                </Button>
              </Col>
            </Row>
          </div>

          {/* Player Selection */}
          <div>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              <UserOutlined style={{ marginRight: 6 }} />
              {selectedEventType === "GOAL" ? "Select Goal Scorer *" : "Select Player *"}
            </Text>
            <Select
              size="large"
              placeholder={selectedEventType === "GOAL" ? "Choose goal scorer" : "Choose a player"}
              style={{ width: "100%", borderRadius: 8 }}
              value={selectedPlayerId}
              onChange={(value) => {
                setSelectedPlayerId(value);
                // Reset assist player if goal scorer changes
                if (selectedEventType === "GOAL") {
                  setAssistPlayerId(null);
                }
              }}
              disabled={!selectedTeamId || currentTeamPlayers.length === 0}
              showSearch
              filterOption={(input, option) => {
                const label = option?.label;
                if (typeof label === "string") {
                  return label.toLowerCase().includes(input.toLowerCase());
                }
                return false;
              }}
            >
              {currentTeamPlayers.map((player) => (
                <Select.Option key={player.id} value={player.id} label={player.name}>
                  {player.name}
                </Select.Option>
              ))}
            </Select>
          </div>

          {/* Assist Player Selection (only for GOAL events) */}
          {selectedEventType === "GOAL" && selectedPlayerId && (
            <div>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                🎯 Select Assist Player (Optional)
              </Text>
              <Select
                size="large"
                placeholder="Choose assist player (optional)"
                style={{ width: "100%", borderRadius: 8 }}
                value={assistPlayerId}
                onChange={setAssistPlayerId}
                allowClear
                showSearch
                filterOption={(input, option) => {
                  const label = option?.label;
                  if (typeof label === "string") {
                    return label.toLowerCase().includes(input.toLowerCase());
                  }
                  return false;
                }}
              >
                {currentTeamPlayers
                  .filter((player) => player.id !== selectedPlayerId) // Exclude the goal scorer
                  .map((player) => (
                    <Select.Option key={player.id} value={player.id} label={player.name}>
                      {player.name}
                    </Select.Option>
                  ))}
              </Select>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 4 }}>
                Select the player who provided the assist for this goal
              </Text>
            </div>
          )}

          {/* Optional Notes */}
          <div>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              Additional Notes (Optional)
            </Text>
            <Input.TextArea
              rows={3}
              placeholder="Add any additional details about this event..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ borderRadius: 8, resize: "none" }}
            />
          </div>
        </Space>
      </Modal>
    </>
  );
}
