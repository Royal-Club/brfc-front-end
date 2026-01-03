import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  InputNumber,
  DatePicker,
  TimePicker,
  message,
  Alert,
  Typography,
  Row,
  Col,
  Divider,
} from "antd";
import {
  TrophyOutlined,
  DeleteOutlined,
  SaveOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import {
  useCreateRoundMutation,
  useUpdateRoundMutation,
  useDeleteRoundMutation,
  useGetRoundByIdQuery,
} from "../../../../state/features/manualFixtures/manualFixturesSlice";
import { useGetTournamentSummaryQuery } from "../../../../state/features/tournaments/tournamentsSlice";
import {
  RoundType,
  TournamentRoundResponse,
} from "../../../../state/features/manualFixtures/manualFixtureTypes";

dayjs.extend(utc);

const { TextArea } = Input;
const { Text, Title } = Typography;
const { Option } = Select;

interface RoundManagementProps {
  tournamentId: number;
  roundId: number | null;
  isModalVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingRounds: TournamentRoundResponse[];
}

const ROUND_TYPE_OPTIONS = [
  { value: RoundType.GROUP_BASED, label: "Group Based", description: "Rounds with multiple groups (e.g., Group Stage)" },
  { value: RoundType.DIRECT_KNOCKOUT, label: "Direct Knockout", description: "Teams directly in round (e.g., Semi Finals)" },
];


export default function RoundManagement({
  tournamentId,
  roundId,
  isModalVisible,
  onClose,
  onSuccess,
  existingRounds,
}: RoundManagementProps) {
  const [form] = Form.useForm();
  const isEditing = roundId !== null;

  const [createRound, { isLoading: isCreating }] = useCreateRoundMutation();
  const [updateRound, { isLoading: isUpdating }] = useUpdateRoundMutation();
  const [deleteRound, { isLoading: isDeleting }] = useDeleteRoundMutation();

  const { data: roundData, isLoading: isFetching } = useGetRoundByIdQuery(
    { roundId: roundId! },
    { 
      skip: !roundId || !isModalVisible,
      // Don't refetch on window focus or mount to avoid refetching deleted rounds
      refetchOnFocus: false,
      refetchOnMountOrArgChange: false,
    }
  );

  const existingRound = roundData?.content;

  // Fetch tournament summary to get tournament date
  const { data: tournamentSummary } = useGetTournamentSummaryQuery(
    { tournamentId },
    { skip: !tournamentId }
  );

  const tournamentDate = tournamentSummary?.content?.[0]?.tournamentDate;

  useEffect(() => {
    if (isModalVisible && existingRound) {
      const startDateTime = existingRound.startDate ? dayjs.utc(existingRound.startDate).local() : null;
      const endDateTime = existingRound.endDate ? dayjs.utc(existingRound.endDate).local() : null;

      form.setFieldsValue({
        roundName: existingRound.roundName,
        roundType: existingRound.roundType,
        advancementRule: existingRound.advancementRule,
        startDate: startDateTime,
        startTime: startDateTime,
        endDate: endDateTime,
        endTime: endDateTime,
      });
    } else if (isModalVisible && !isEditing) {
      // Set default values for new round (roundNumber and sequenceOrder will be auto-calculated)
      // Set startDate to tournament date if available
      const tournamentDateTime = tournamentDate ? dayjs.utc(tournamentDate).local() : null;

      form.setFieldsValue({
        roundType: RoundType.GROUP_BASED,
        startDate: tournamentDateTime,
        startTime: tournamentDateTime,
      });
    }

    // Reset form when modal closes
    if (!isModalVisible) {
      form.resetFields();
    }
  }, [isModalVisible, existingRound, form, existingRounds, isEditing, tournamentDate]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Auto-calculate roundNumber and sequenceOrder
      let roundNumber: number;
      let sequenceOrder: number;
      
      if (isEditing && existingRound) {
        // Keep existing values when editing
        roundNumber = existingRound.roundNumber;
        sequenceOrder = existingRound.sequenceOrder;
      } else {
        // Auto-calculate for new rounds
        const maxSequence = existingRounds.length > 0
          ? Math.max(...existingRounds.map(r => r.sequenceOrder))
          : 0;
        const maxRoundNumber = existingRounds.length > 0
          ? Math.max(...existingRounds.map(r => r.roundNumber))
          : 0;
        roundNumber = maxRoundNumber + 1;
        sequenceOrder = maxSequence + 1;
      }

      // Combine date and time fields
      let startDateUTC: string | undefined;
      let endDateUTC: string | undefined;

      if (values.startDate && values.startTime) {
        const localStartDateTime = values.startDate.clone()
          .hour(values.startTime.hour())
          .minute(values.startTime.minute())
          .second(0)
          .millisecond(0);
        startDateUTC = localStartDateTime.utc().format("YYYY-MM-DDTHH:mm:ss");
      }

      if (values.endDate && values.endTime) {
        const localEndDateTime = values.endDate.clone()
          .hour(values.endTime.hour())
          .minute(values.endTime.minute())
          .second(0)
          .millisecond(0);
        endDateUTC = localEndDateTime.utc().format("YYYY-MM-DDTHH:mm:ss");
      }

      const payload = {
        tournamentId,
        roundNumber,
        roundName: values.roundName,
        roundType: values.roundType,
        sequenceOrder,
        advancementRule: values.advancementRule || undefined,
        startDate: startDateUTC,
        endDate: endDateUTC,
      };

      if (isEditing) {
        await updateRound({ roundId: roundId!, ...payload }).unwrap();
        message.success("Round updated successfully");
      } else {
        await createRound(payload).unwrap();
        message.success("Round created successfully");
      }

      form.resetFields();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to save round:", error);
      // Error already shown by API slice
    }
  };

  const handleDelete = async () => {
    if (!roundId) return;

    Modal.confirm({
      title: "Delete Round?",
      content: "Are you sure you want to delete this round? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteRound({ roundId }).unwrap();
          message.success("Round deleted successfully");
          form.resetFields();
          onSuccess();
          onClose();
        } catch (error: any) {
          console.error("Failed to delete round:", error);
          // Error already shown by API slice
        }
      },
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <TrophyOutlined style={{ fontSize: 20, color: "#1890ff" }} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>
            {isEditing ? "Edit Round" : "Create New Round"}
          </span>
        </Space>
      }
      open={isModalVisible}
      onCancel={handleCancel}
      width={700}
      footer={[
        isEditing && (
          <Button
            key="delete"
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
            loading={isDeleting}
            style={{ float: "left" }}
          >
            Delete
          </Button>
        ),
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SaveOutlined />}
          loading={isCreating || isUpdating}
          onClick={handleSubmit}
        >
          {isEditing ? "Update" : "Create"}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Alert
          message="Round Configuration"
          description="Rounds organize your tournament into stages. Each round can contain groups (Group Stage) or teams directly (Knockout rounds). Round number and sequence will be set automatically."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form.Item
          name="roundName"
          label="Round Name"
          rules={[{ required: true, message: "Please enter round name" }]}
        >
          <Input
            placeholder="e.g., Group Stage, Quarter Finals, Semi Finals"
            size="large"
            style={{
              backgroundColor: 'transparent'
            }}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="roundType"
              label="Round Type"
              rules={[{ required: true, message: "Please select round type" }]}
            >
              <Select 
                placeholder="Select round type"
                size="large"
                optionLabelProp="label"
              >
                {ROUND_TYPE_OPTIONS.map((option) => (
                  <Option 
                    key={option.value} 
                    value={option.value}
                    label={option.label}
                  >
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
          </Col>
        </Row>

        <Divider orientation="left" style={{ marginTop: 24, marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 14 }}>Scheduling (Optional)</Text>
        </Divider>

        <Row gutter={8}>
          <Col span={14}>
            <Form.Item
              name="startDate"
              label={
                <Space>
                  <CalendarOutlined />
                  Start Date
                </Space>
              }
            >
              <DatePicker
                format="YYYY-MM-DD"
                style={{ width: "100%" }}
                placeholder="Select date"
                size="large"
                disabledDate={(current) => {
                  if (!tournamentDate) return false;
                  // Disable dates before the tournament date
                  return current && current.isBefore(dayjs.utc(tournamentDate).local().startOf('day'));
                }}
              />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item
              name="startTime"
              label={
                <Space>
                  <ClockCircleOutlined />
                  Start Time
                </Space>
              }
            >
              <TimePicker
                format="h:mm A"
                use12Hours
                style={{ width: "100%" }}
                placeholder="Time"
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={8}>
          <Col span={14}>
            <Form.Item
              name="endDate"
              label={
                <Space>
                  <CalendarOutlined />
                  End Date
                </Space>
              }
            >
              <DatePicker
                format="YYYY-MM-DD"
                style={{ width: "100%" }}
                placeholder="Select date"
                size="large"
                disabledDate={(current) => {
                  if (!tournamentDate) return false;
                  // Get start date from form
                  const startDate = form.getFieldValue('startDate');
                  const tournamentStart = dayjs.utc(tournamentDate).local().startOf('day');

                  // Disable dates before tournament date
                  if (current && current.isBefore(tournamentStart)) {
                    return true;
                  }

                  // Disable dates before start date if start date is selected
                  if (startDate && current && current.isBefore(startDate.startOf('day'))) {
                    return true;
                  }

                  return false;
                }}
              />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item
              name="endTime"
              label={
                <Space>
                  <ClockCircleOutlined />
                  End Time
                </Space>
              }
            >
              <TimePicker
                format="h:mm A"
                use12Hours
                style={{ width: "100%" }}
                placeholder="Time"
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" style={{ marginTop: 24, marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 14 }}>Advanced (Optional)</Text>
        </Divider>

        <Form.Item
          name="advancementRule"
          label="Advancement Rule (JSON)"
          tooltip="Define how teams advance to next round (e.g., top 2 from each group)"
        >
          <TextArea
            rows={3}
            placeholder='{"topN": 2, "criteria": "points"}'
            style={{ fontFamily: "monospace" }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
