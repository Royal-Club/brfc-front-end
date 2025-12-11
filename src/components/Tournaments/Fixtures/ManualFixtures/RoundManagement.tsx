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
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import {
  useCreateRoundMutation,
  useUpdateRoundMutation,
  useDeleteRoundMutation,
  useGetRoundByIdQuery,
} from "../../../../state/features/manualFixtures/manualFixturesSlice";
import {
  RoundType,
  RoundFormat,
  TournamentRoundResponse,
} from "../../../../state/features/manualFixtures/manualFixtureTypes";

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

const ROUND_FORMAT_OPTIONS = [
  { value: RoundFormat.ROUND_ROBIN, label: "Round Robin", description: "All teams play each other" },
  { value: RoundFormat.SINGLE_ELIMINATION, label: "Single Elimination", description: "Knockout - lose once = eliminated" },
  { value: RoundFormat.DOUBLE_ELIMINATION, label: "Double Elimination", description: "Knockout with losers bracket" },
  { value: RoundFormat.SWISS_SYSTEM, label: "Swiss System", description: "Pairings based on performance" },
  { value: RoundFormat.CUSTOM, label: "Custom", description: "Manual fixture creation" },
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

  useEffect(() => {
    if (isModalVisible && existingRound) {
      form.setFieldsValue({
        roundName: existingRound.roundName,
        roundType: existingRound.roundType,
        roundFormat: existingRound.roundFormat,
        advancementRule: existingRound.advancementRule,
        startDate: existingRound.startDate ? dayjs(existingRound.startDate) : null,
        endDate: existingRound.endDate ? dayjs(existingRound.endDate) : null,
      });
    } else if (isModalVisible && !isEditing) {
      // Set default values for new round (roundNumber and sequenceOrder will be auto-calculated)
      form.setFieldsValue({
        roundType: RoundType.GROUP_BASED,
        roundFormat: RoundFormat.ROUND_ROBIN,
      });
    }
    
    // Reset form when modal closes
    if (!isModalVisible) {
      form.resetFields();
    }
  }, [isModalVisible, existingRound, form, existingRounds, isEditing]);

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

      const payload = {
        tournamentId,
        roundNumber,
        roundName: values.roundName,
        roundType: values.roundType,
        roundFormat: values.roundFormat || undefined,
        sequenceOrder,
        advancementRule: values.advancementRule || undefined,
        startDate: values.startDate
          ? values.startDate.format("YYYY-MM-DDTHH:mm:ss")
          : undefined,
        endDate: values.endDate
          ? values.endDate.format("YYYY-MM-DDTHH:mm:ss")
          : undefined,
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
          <Col span={12}>
            <Form.Item 
              name="roundFormat" 
              label="Round Format"
              tooltip="Format for how matches are played in this round"
            >
              <Select 
                placeholder="Select format (optional)"
                size="large"
                optionLabelProp="label"
                allowClear
              >
                {ROUND_FORMAT_OPTIONS.map((option) => (
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

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="startDate" label="Start Date">
              <DatePicker
                showTime
                format="DD/MM/YYYY HH:mm"
                style={{ width: "100%" }}
                placeholder="Select start date"
                size="large"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="endDate" label="End Date">
              <DatePicker
                showTime
                format="DD/MM/YYYY HH:mm"
                style={{ width: "100%" }}
                placeholder="Select end date"
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
