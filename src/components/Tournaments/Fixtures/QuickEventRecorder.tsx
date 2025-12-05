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
} from "antd";
import {
  ThunderboltOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { IFixture } from "../../../state/features/fixtures/fixtureTypes";
import { useRecordMatchEventMutation } from "../../../state/features/fixtures/fixturesSlice";
import moment from "moment";

const { Text } = Typography;

interface QuickEventRecorderProps {
  matchId: number;
  fixture: IFixture | null;
  homeTeamPlayers?: Array<{ id: number; name: string }>;
  awayTeamPlayers?: Array<{ id: number; name: string }>;
  onSuccess?: () => void;
}

const EVENT_TYPES = [
  { value: "GOAL", label: "Goal", icon: "⚽", color: "#52c41a" },
  { value: "ASSIST", label: "Assist", icon: "🎯", color: "#1890ff" },
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
  const [recordEvent, { isLoading }] = useRecordMatchEventMutation();
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  // Calculate current elapsed time
  const calculateElapsedTime = (): number => {
    if (!fixture) return 0;

    if (fixture.matchStatus === "ONGOING" && fixture.startedAt) {
      const startTime = moment.utc(fixture.startedAt).local().valueOf();
      const now = Date.now();
      const timeSinceStart = Math.floor((now - startTime) / 1000);
      const totalElapsed = (fixture.elapsedTimeSeconds || 0) + timeSinceStart;
      return Math.floor(totalElapsed / 60);
    } else if (fixture.matchStatus === "PAUSED" || fixture.matchStatus === "COMPLETED") {
      return Math.floor((fixture.elapsedTimeSeconds || 0) / 60);
    }

    return 0;
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

    try {
      const currentMinute = calculateElapsedTime();

      await recordEvent({
        matchId,
        eventType: selectedEventType,
        playerId: selectedPlayerId,
        teamId: selectedTeamId,
        eventTime: currentMinute,
        description: description.trim() || undefined,
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
      <Card>
        <Text type="secondary">No fixture data available</Text>
      </Card>
    );
  }

  return (
    <>
      <Card
        title={
          <Space>
            <ThunderboltOutlined />
            <span>Quick Event Recording</span>
          </Space>
        }
        extra={
          <Text type="secondary" style={{ fontSize: 14, fontWeight: 600 }}>
            {calculateElapsedTime()}'
          </Text>
        }
        style={{
          borderRadius: 12,
          border: "none",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Text
          type="secondary"
          style={{ display: "block", marginBottom: 16, fontSize: 13 }}
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
                style={{
                  height: "auto",
                  padding: "16px 12px",
                  borderRadius: 12,
                  border: `2px solid ${event.color}30`,
                  background: `${event.color}08`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = `0 4px 12px ${event.color}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span style={{ fontSize: 32 }}>{event.icon}</span>
                <Text
                  strong
                  style={{
                    fontSize: 13,
                    color: event.color,
                    textAlign: "center",
                  }}
                >
                  {event.label}
                </Text>
              </Button>
            </Col>
          ))}
        </Row>
      </Card>

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
        okText="Record Event"
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
              Select Player *
            </Text>
            <Select
              size="large"
              placeholder="Choose a player"
              style={{ width: "100%", borderRadius: 8 }}
              value={selectedPlayerId}
              onChange={setSelectedPlayerId}
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
