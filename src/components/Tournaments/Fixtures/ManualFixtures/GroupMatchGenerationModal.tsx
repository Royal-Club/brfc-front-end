import React, { useState, useEffect } from "react";
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
  Divider,
  Select,
  Row,
  Col,
} from "antd";
import {
  ThunderboltOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useGenerateGroupMatchesMutation } from "../../../../state/features/manualFixtures/manualFixturesSlice";
import { GroupFormat, FixtureFormat } from "../../../../state/features/manualFixtures/manualFixtureTypes";
import { useGetTournamentSummaryQuery } from "../../../../state/features/tournaments/tournamentsSlice";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const { Text } = Typography;
const { Option } = Select;

const FIXTURE_FORMAT_OPTIONS: Array<{ value: FixtureFormat; label: string; description: string }> = [
  { value: "ROUND_ROBIN", label: "Round Robin", description: "Each pair of teams plays once" },
  { value: "DOUBLE_ROUND_ROBIN", label: "Double Round Robin", description: "Each pair of teams plays twice (home and away)" },
];

interface GroupMatchGenerationModalProps {
  tournamentId: number;
  groupId: number | null;
  groupName: string | null;
  teamCount: number;
  groupFormat?: GroupFormat;
  isModalVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  venues?: Array<{ id: number; name: string }>;
}

export default function GroupMatchGenerationModal({
  tournamentId,
  groupId,
  groupName,
  teamCount,
  groupFormat,
  isModalVisible,
  onClose,
  onSuccess,
  venues = [],
}: GroupMatchGenerationModalProps) {
  const [form] = Form.useForm();

  // Fetch tournament summary to get tournament date
  const { data: tournamentSummary } = useGetTournamentSummaryQuery(
    { tournamentId },
    { skip: !tournamentId }
  );

  const tournamentDate = tournamentSummary?.content?.[0]?.tournamentDate;
  const tournamentVenueName = tournamentSummary?.content?.[0]?.venueName;

  // Map group format to fixture format - use group format as match format
  const getFixtureFormatFromGroupFormat = (format?: GroupFormat): FixtureFormat => {
    if (!format) return "ROUND_ROBIN";
    switch (format) {
      case GroupFormat.ROUND_ROBIN_DOUBLE:
        return "DOUBLE_ROUND_ROBIN";
      case GroupFormat.ROUND_ROBIN_SINGLE:
        return "ROUND_ROBIN";
      default:
        return "ROUND_ROBIN";
    }
  };

  const fixtureFormat = getFixtureFormatFromGroupFormat(groupFormat);

  // Update form when groupFormat, tournamentDate, or venue changes
  useEffect(() => {
    if (isModalVisible) {
      const format = getFixtureFormatFromGroupFormat(groupFormat);
      const defaultStartDateTime = tournamentDate
        ? dayjs.utc(tournamentDate).local()
        : dayjs().add(1, "day").hour(15).minute(0);

      // Find venue ID from tournament venue name
      const tournamentVenue = venues.find(v => v.name === tournamentVenueName);
      const defaultVenueId = tournamentVenue ? tournamentVenue.id : undefined;

      form.setFieldsValue({
        fixtureFormat: format,
        startDate: defaultStartDateTime,
        startTime: defaultStartDateTime,
        venueId: defaultVenueId
      });
    }
  }, [isModalVisible, groupFormat, tournamentDate, tournamentVenueName, venues, form]);

  const [generateMatches, { isLoading }] = useGenerateGroupMatchesMutation();

  // Calculate match count
  const calculateMatchCount = () => {
    if (teamCount < 2) return 0;
    const singleRoundMatches = (teamCount * (teamCount - 1)) / 2;
    return fixtureFormat === "DOUBLE_ROUND_ROBIN" ? singleRoundMatches * 2 : singleRoundMatches;
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

      // Convert local time to UTC for backend
      const startDateISO = localDateTime.utc().format("YYYY-MM-DDTHH:mm:ss");

      // Use fixtureFormat from form (which is set from groupFormat)
      const selectedFixtureFormat = values.fixtureFormat || fixtureFormat;

      const payload = {
        groupId,
        fixtureFormat: selectedFixtureFormat,
        startDate: startDateISO,
        matchTimeGapMinutes: values.matchTimeGapMinutes || 180,
        matchDurationMinutes: values.matchDurationMinutes || 90,
        venueId: values.venueId || undefined,
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
                {fixtureFormat === "DOUBLE_ROUND_ROBIN" ? "Double Round-Robin" : "Single Round-Robin"})
              </div>
              <div>
                Default venue: <strong>{tournamentVenueName || "Not set"}</strong>
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
                disabledDate={(current) => {
                  if (!tournamentDate) return false;
                  // Disable dates before the tournament date
                  return current && current.isBefore(dayjs.utc(tournamentDate).local().startOf('day'));
                }}
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
          name="fixtureFormat"
          label={
            <Space>
              <ClockCircleOutlined />
              Match Format
            </Space>
          }
          rules={[{ required: true, message: "Please select match format" }]}
          initialValue={fixtureFormat}
        >
          <Select
            value={fixtureFormat}
            disabled={true}
            size="large"
            optionLabelProp="label"
          >
            {FIXTURE_FORMAT_OPTIONS.map((option) => (
              <Option key={option.value} value={option.value} label={option.label}>
                <div style={{ padding: "4px 0" }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>
                    {option.label}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {option.description}
                  </Text>
                </div>
              </Option>
            ))}
          </Select>
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
