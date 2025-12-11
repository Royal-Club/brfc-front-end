import React, { useState } from "react";
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
import { useGenerateGroupMatchesMutation } from "../../../../state/features/manualFixtures/manualFixturesSlice";
import dayjs from "dayjs";

const { Text } = Typography;
const { Option } = Select;

interface GroupMatchGenerationModalProps {
  groupId: number | null;
  groupName: string | null;
  teamCount: number;
  isModalVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  venues?: Array<{ id: number; name: string }>;
}

export default function GroupMatchGenerationModal({
  groupId,
  groupName,
  teamCount,
  isModalVisible,
  onClose,
  onSuccess,
  venues = [],
}: GroupMatchGenerationModalProps) {
  const [form] = Form.useForm();
  const [doubleRoundRobin, setDoubleRoundRobin] = useState(false);

  const [generateMatches, { isLoading }] = useGenerateGroupMatchesMutation();

  // Calculate match count
  const calculateMatchCount = () => {
    if (teamCount < 2) return 0;
    const singleRoundMatches = (teamCount * (teamCount - 1)) / 2;
    return doubleRoundRobin ? singleRoundMatches * 2 : singleRoundMatches;
  };

  const handleSubmit = async () => {
    if (!groupId) {
      message.error("No group selected");
      return;
    }

    if (teamCount < 2) {
      message.error("At least 2 teams required to generate matches");
      return;
    }

    try {
      const values = await form.validateFields();

      // Format startDate as ISO string for backend (Spring Boot LocalDateTime format)
      // Convert dayjs to ISO string, removing timezone info for LocalDateTime compatibility
      const startDateISO = values.startDate.format("YYYY-MM-DDTHH:mm:ss");

      const payload = {
        groupId,
        startDate: startDateISO,
        matchTimeGapMinutes: values.matchTimeGapMinutes || 180,
        matchDurationMinutes: values.matchDurationMinutes || 90,
        venueId: values.venueId || undefined,
        doubleRoundRobin: doubleRoundRobin || false,
      };

      const response = await generateMatches(payload).unwrap();

      message.success(
        `Successfully generated ${response.content?.length || 0} matches for ${groupName}`
      );

      form.resetFields();
      onSuccess();
    } catch (error: any) {
      console.error("Failed to generate matches:", error);
      // Error already shown by API slice
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setDoubleRoundRobin(false);
    onClose();
  };

  const matchCount = calculateMatchCount();

  return (
    <Modal
      title={
        <Space>
          <ThunderboltOutlined style={{ fontSize: 20, color: "#52c41a" }} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>
            Auto-Generate Group Fixtures
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
          message={`Generating fixtures for: ${groupName || "Group"}`}
          description={
            <div>
              <div>Teams in group: <strong>{teamCount}</strong></div>
              <div>
                Matches to be created: <strong>{matchCount}</strong> (
                {doubleRoundRobin ? "Double Round-Robin" : "Single Round-Robin"})
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
            description="At least 2 teams are required to generate matches. Please assign more teams to this group."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
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
          label={
            <Space>
              <ClockCircleOutlined />
              Match Format
            </Space>
          }
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <Space>
              <Text>Round-Robin Type:</Text>
              <Switch
                checked={doubleRoundRobin}
                onChange={setDoubleRoundRobin}
                checkedChildren="Double (Home & Away)"
                unCheckedChildren="Single"
              />
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {doubleRoundRobin
                ? "Each pair of teams plays twice (home and away)"
                : "Each pair of teams plays once"}
            </Text>
          </Space>
        </Form.Item>

        <Form.Item
          name="matchTimeGapMinutes"
          label="Time Gap Between Matches (minutes)"
          tooltip="Time interval between consecutive matches"
          initialValue={180}
        >
          <InputNumber
            min={30}
            max={1440}
            step={30}
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
            min={30}
            max={180}
            step={15}
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
              <li>Matches will be created in round-robin format</li>
              <li>All matches will start with status: SCHEDULED</li>
              <li>You can edit individual matches after generation</li>
              <li>Standings will auto-update when matches are completed</li>
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
