import React, { useState, useMemo, useEffect } from "react";
import {
  Modal,
  Form,
  DatePicker,
  InputNumber,
  Switch,
  Button,
  Space,
  Alert,
  message,
  Typography,
  Divider,
  Select,
} from "antd";
import {
  ThunderboltOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useGenerateRoundMatchesMutation } from "../../../../state/features/manualFixtures/manualFixturesSlice";
import dayjs from "dayjs";

const { Text } = Typography;
const { Option } = Select;

type FixtureFormat = "SINGLE_ELIMINATION" | "ROUND_ROBIN" | "DOUBLE_ROUND_ROBIN";

interface RoundMatchGenerationModalProps {
  roundId: number | null;
  roundName: string | null;
  teamCount: number;
  isModalVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  venues?: Array<{ id: number; name: string }>;
  tournamentVenueId?: number | null;
}

export default function RoundMatchGenerationModal({
  roundId,
  roundName,
  teamCount,
  isModalVisible,
  onClose,
  onSuccess,
  venues = [],
  tournamentVenueId,
}: RoundMatchGenerationModalProps) {
  const [form] = Form.useForm();
  const [fixtureFormat, setFixtureFormat] = useState<FixtureFormat>("SINGLE_ELIMINATION");
  const [doubleRoundRobin, setDoubleRoundRobin] = useState(false);

  const [generateMatches, { isLoading }] = useGenerateRoundMatchesMutation();

  // Set tournament venue as default when modal opens
  useEffect(() => {
    if (isModalVisible && tournamentVenueId) {
      form.setFieldsValue({ venueId: tournamentVenueId });
    }
  }, [isModalVisible, tournamentVenueId, form]);

  // Calculate match count based on format
  const calculateMatchCount = useMemo(() => {
    if (teamCount < 2) return 0;

    switch (fixtureFormat) {
      case "SINGLE_ELIMINATION":
        // For single elimination: teams - 1 matches (e.g., 8 teams = 7 matches)
        return teamCount - 1;
      case "ROUND_ROBIN":
        // Round robin: n*(n-1)/2 matches
        const singleRoundMatches = (teamCount * (teamCount - 1)) / 2;
        return doubleRoundRobin ? singleRoundMatches * 2 : singleRoundMatches;
      case "DOUBLE_ROUND_ROBIN":
        // Double round robin: n*(n-1) matches
        return teamCount * (teamCount - 1);
      default:
        return 0;
    }
  }, [teamCount, fixtureFormat, doubleRoundRobin]);

  const handleSubmit = async () => {
    if (!roundId) {
      message.error("No round selected");
      return;
    }

    if (teamCount < 2) {
      message.error("At least 2 teams required to generate matches");
      return;
    }

    try {
      const values = await form.validateFields();

      // Format startDate as ISO string for backend (Spring Boot LocalDateTime format)
      const startDateISO = values.startDate.format("YYYY-MM-DDTHH:mm:ss");

      const payload = {
        roundId,
        fixtureFormat: fixtureFormat,
        startDate: startDateISO,
        matchTimeGapMinutes: values.matchTimeGapMinutes || 180,
        matchDurationMinutes: values.matchDurationMinutes || 90,
        venueId: values.venueId || undefined,
        doubleRoundRobin: fixtureFormat === "ROUND_ROBIN" ? (doubleRoundRobin || false) : undefined,
      };

      const response = await generateMatches(payload).unwrap();

      message.success(
        `Successfully generated ${response.content?.length || 0} matches for ${roundName || "Round"}`
      );

      form.resetFields();
      setFixtureFormat("SINGLE_ELIMINATION");
      setDoubleRoundRobin(false);
      onSuccess();
    } catch (error: any) {
      console.error("Failed to generate matches:", error);
      // Error already shown by API slice
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setFixtureFormat("SINGLE_ELIMINATION");
    setDoubleRoundRobin(false);
    onClose();
  };

  const matchCount = calculateMatchCount;

  const getFormatDescription = (format: FixtureFormat) => {
    switch (format) {
      case "SINGLE_ELIMINATION":
        return "Bracket format - teams compete in elimination rounds (e.g., 8 teams = 4 QF, 2 SF, 1 Final)";
      case "ROUND_ROBIN":
        return "All teams play each other once (or twice if double round-robin enabled)";
      case "DOUBLE_ROUND_ROBIN":
        return "All teams play each other twice (home and away)";
      default:
        return "";
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ThunderboltOutlined style={{ fontSize: 20, color: "#52c41a" }} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>
            Auto-Generate Round Fixtures
          </span>
        </Space>
      }
      open={isModalVisible}
      onCancel={handleCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<ThunderboltOutlined />}
          loading={isLoading}
          onClick={handleSubmit}
          disabled={teamCount < 2}
        >
          Generate {matchCount} Matches
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Alert
          message={`Generating fixtures for: ${roundName || "Round"}`}
          description={
            <div>
              <div>Teams in round: <strong>{teamCount}</strong></div>
              <div>
                Matches to be created: <strong>{matchCount}</strong>
              </div>
              <div style={{ marginTop: 4, fontSize: 12 }}>
                Format: <strong>{fixtureFormat.replace(/_/g, " ")}</strong>
              </div>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {teamCount < 2 && (
          <Alert
            message="Insufficient Teams"
            description="At least 2 teams are required to generate matches. Please assign more teams to this round."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item
          name="fixtureFormat"
          label={
            <Space>
              <ThunderboltOutlined />
              Fixture Format
            </Space>
          }
          rules={[{ required: true, message: "Please select fixture format" }]}
          initialValue="SINGLE_ELIMINATION"
        >
          <Select
            value={fixtureFormat}
            onChange={(value) => {
              setFixtureFormat(value);
              if (value !== "ROUND_ROBIN") {
                setDoubleRoundRobin(false);
              }
            }}
            style={{ width: "100%" }}
          >
            <Option value="SINGLE_ELIMINATION">Single Elimination (Bracket)</Option>
            <Option value="ROUND_ROBIN">Round Robin</Option>
            <Option value="DOUBLE_ROUND_ROBIN">Double Round Robin</Option>
          </Select>
        </Form.Item>

        <Alert
          message={getFormatDescription(fixtureFormat)}
          type="info"
          showIcon
          style={{ marginBottom: 16, fontSize: 12 }}
        />

        {fixtureFormat === "ROUND_ROBIN" && (
          <Form.Item
            label={
              <Space>
                <ClockCircleOutlined />
                Round-Robin Type
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <Space>
                <Text>Double Round-Robin:</Text>
                <Switch
                  checked={doubleRoundRobin}
                  onChange={setDoubleRoundRobin}
                  checkedChildren="Yes (Home & Away)"
                  unCheckedChildren="No (Single)"
                />
              </Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {doubleRoundRobin
                  ? "Each pair of teams plays twice (home and away)"
                  : "Each pair of teams plays once"}
              </Text>
            </Space>
          </Form.Item>
        )}

        <Form.Item
          name="startDate"
          label={
            <Space>
              <CalendarOutlined />
              Start Date & Time
            </Space>
          }
          rules={[{ required: true, message: "Please select start date" }]}
          initialValue={dayjs().add(1, "day").hour(15).minute(0)}
        >
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            style={{ width: "100%" }}
            placeholder="Select start date and time"
          />
        </Form.Item>

        <Form.Item
          name="matchTimeGapMinutes"
          label="Time Gap Between Matches (minutes)"
          tooltip="Time interval between the end of one match and the start of the next match"
          initialValue={180}
        >
          <InputNumber
            min={5}
            max={1440}
            step={5}
            style={{ width: "100%" }}
            placeholder="180"
            addonAfter="minutes"
          />
        </Form.Item>

        <Form.Item
          name="matchDurationMinutes"
          label="Match Duration (minutes)"
          tooltip="Duration of each match"
          initialValue={90}
        >
          <InputNumber
            min={10}
            max={180}
            step={5}
            style={{ width: "100%" }}
            placeholder="90"
            addonAfter="minutes"
          />
        </Form.Item>

        {venues && venues.length > 0 && (
          <>
            <Divider>Optional</Divider>
            <Form.Item
              name="venueId"
              label="Venue (Optional)"
              tooltip="Assign all matches to the same venue"
            >
              <Select
                placeholder="Select venue (optional)"
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {venues.map((venue) => (
                  <Option key={venue.id} value={venue.id}>
                    {venue.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </>
        )}

        <Alert
          message="Match Generation Info"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>Matches will be created based on selected format</li>
              <li>All matches will start with status: SCHEDULED</li>
              <li>You can edit individual matches after generation</li>
              {fixtureFormat === "SINGLE_ELIMINATION" && (
                <li>Bracket structure will be created (winners advance automatically)</li>
              )}
            </ul>
          }
          type="success"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Form>
    </Modal>
  );
}

