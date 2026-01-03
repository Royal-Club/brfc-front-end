import { useState, useMemo, useEffect } from "react";
import {
  Modal,
  Form,
  DatePicker,
  TimePicker,
  InputNumber,
  Switch,
  Button,
  Space,
  Alert,
  message,
  Typography,
  Select,
  Row,
  Col,
} from "antd";
import {
  ThunderboltOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { useGenerateRoundMatchesMutation } from "../../../../state/features/manualFixtures/manualFixturesSlice";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

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
  tournamentStartDate?: string | null;
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
  tournamentStartDate,
}: RoundMatchGenerationModalProps) {
  const [form] = Form.useForm();
  const [fixtureFormat, setFixtureFormat] = useState<FixtureFormat>("SINGLE_ELIMINATION");
  const [doubleRoundRobin, setDoubleRoundRobin] = useState(false);

  const [generateMatches, { isLoading }] = useGenerateRoundMatchesMutation();

  // Set tournament venue and start date/time as defaults when modal opens
  useEffect(() => {
    if (isModalVisible) {
      const initialValues: any = {};

      if (tournamentVenueId) {
        initialValues.venueId = tournamentVenueId;
      }

      if (tournamentStartDate) {
        // Parse tournament date as UTC and convert to local
        const tournamentDateTime = dayjs.utc(tournamentStartDate).local();
        initialValues.startDate = tournamentDateTime;
        initialValues.startTime = tournamentDateTime;
      }

      if (Object.keys(initialValues).length > 0) {
        form.setFieldsValue(initialValues);
      }
    }
  }, [isModalVisible, tournamentVenueId, tournamentStartDate, form]);

  // Calculate match count based on format
  const calculateMatchCount = useMemo(() => {
    if (teamCount < 2) return 0;

    switch (fixtureFormat) {
      case "SINGLE_ELIMINATION":
        // For single elimination: first round only (e.g., 4 teams = 2 matches, 8 teams = 4 matches)
        return Math.floor(teamCount / 2);
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

      if (!values.startDate || !values.startTime) {
        message.error("Please select both start date and time");
        return;
      }

      // Combine date and time as LOCAL time first
      const localDateTime = values.startDate.clone()
        .hour(values.startTime.hour())
        .minute(values.startTime.minute())
        .second(0)
        .millisecond(0);

      // Convert local time to UTC before sending to backend (Spring Boot expects UTC)
      const startDateISO = localDateTime.utc().format("YYYY-MM-DDTHH:mm:ss");

      const payload = {
        roundId,
        fixtureFormat: fixtureFormat,
        startDate: startDateISO,
        matchTimeGapMinutes: values.matchTimeGapMinutes || 30,
        matchDurationMinutes: values.matchDurationMinutes || 20,
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

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              name="startDate"
              label={
                <Space>
                  <CalendarOutlined />
                  Start Date
                </Space>
              }
              rules={[{ required: true, message: "Please select start date" }]}
            >
              <DatePicker
                format="YYYY-MM-DD"
                style={{ width: "100%" }}
                placeholder="Select date"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="startTime"
              label={
                <Space>
                  <ClockCircleOutlined />
                  Start Time
                </Space>
              }
              rules={[{ required: true, message: "Please select start time" }]}
            >
              <TimePicker
                format="h:mm A"
                use12Hours
                style={{ width: "100%" }}
                placeholder="Select time"
              />
            </Form.Item>
          </Col>
        </Row>

              <Form.Item
          name="matchDurationMinutes"
          label="Match Duration (minutes)"
          tooltip="Duration of each match"
          initialValue={20}
        >
          <InputNumber
            min={10}
            max={180}
            step={5}
            style={{ width: "100%" }}
            placeholder="20"
            addonAfter="minutes"
          />
        </Form.Item>

        <Form.Item
          name="matchTimeGapMinutes"
          label="Time Gap Between Matches (minutes)"
          tooltip="Time interval between the end of one match and the start of the next match"
          initialValue={30}
        >
          <InputNumber
            min={5}
            max={1440}
            step={5}
            style={{ width: "100%" }}
            placeholder="30"
            addonAfter="minutes"
          />
        </Form.Item>

  

        {venues && venues.length > 0 && (
          <Form.Item
            name="venueId"
            label={
              <Space>
                <EnvironmentOutlined />
                Venue
              </Space>
            }
            tooltip="All matches will be assigned to this venue"
            rules={[{ required: true, message: "Please select a venue" }]}
          >
            <Select
              placeholder="Select venue"
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
        )}
      </Form>
    </Modal>
  );
}

