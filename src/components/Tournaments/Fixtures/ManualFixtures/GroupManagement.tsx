import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  InputNumber,
  message,
  Alert,
  Typography,
  Divider,
} from "antd";
import {
  TeamOutlined,
  DeleteOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useGetGroupByIdQuery,
} from "../../../../state/features/manualFixtures/manualFixturesSlice";
import { GroupFormat } from "../../../../state/features/manualFixtures/manualFixtureTypes";

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

interface GroupManagementProps {
  roundId: number | null;
  groupId: number | null;
  isModalVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const GROUP_FORMAT_OPTIONS = [
  { value: GroupFormat.MANUAL, label: "Manual", description: "Manually create each match" },
  { value: GroupFormat.ROUND_ROBIN_SINGLE, label: "Round Robin (Single)", description: "Each pair plays once" },
  { value: GroupFormat.ROUND_ROBIN_DOUBLE, label: "Round Robin (Double)", description: "Each pair plays twice (home & away)" },
  { value: GroupFormat.CUSTOM_MULTIPLE, label: "Custom Multiple", description: "Custom encounter count" },
];

export default function GroupManagement({
  roundId,
  groupId,
  isModalVisible,
  onClose,
  onSuccess,
}: GroupManagementProps) {
  const [form] = Form.useForm();
  const isEditing = groupId !== null;

  const [createGroup, { isLoading: isCreating }] = useCreateGroupMutation();
  const [updateGroup, { isLoading: isUpdating }] = useUpdateGroupMutation();
  const [deleteGroup, { isLoading: isDeleting }] = useDeleteGroupMutation();

  const { data: groupData, isLoading: isFetching } = useGetGroupByIdQuery(
    { groupId: groupId! },
    { skip: !groupId }
  );

  const existingGroup = groupData?.content;

  useEffect(() => {
    if (isModalVisible && existingGroup) {
      form.setFieldsValue({
        groupName: existingGroup.groupName,
        groupFormat: existingGroup.groupFormat,
        maxTeams: existingGroup.maxTeams,
        advancementRule: existingGroup.advancementRule,
      });
    } else if (isModalVisible && !isEditing) {
      form.setFieldsValue({
        groupFormat: GroupFormat.ROUND_ROBIN_DOUBLE,
        maxTeams: 4,
      });
    }
  }, [isModalVisible, existingGroup, form, isEditing]);

  const handleSubmit = async () => {
    if (!roundId) {
      message.error("No round selected");
      return;
    }

    try {
      const values = await form.validateFields();

      const payload = {
        roundId,
        groupName: values.groupName,
        groupFormat: values.groupFormat || undefined,
        maxTeams: values.maxTeams || undefined,
        advancementRule: values.advancementRule || undefined,
      };

      if (isEditing) {
        await updateGroup({ groupId: groupId!, ...payload }).unwrap();
        message.success("Group updated successfully");
      } else {
        await createGroup(payload).unwrap();
        message.success("Group created successfully");
      }

      form.resetFields();
      onSuccess();
    } catch (error: any) {
      console.error("Failed to save group:", error);
      // Error already shown by API slice
    }
  };

  const handleDelete = async () => {
    if (!groupId) return;

    Modal.confirm({
      title: "Delete Group?",
      content: "Are you sure you want to delete this group? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteGroup({ groupId }).unwrap();
          message.success("Group deleted successfully");
          form.resetFields();
          onSuccess();
        } catch (error: any) {
          console.error("Failed to delete group:", error);
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
          <TeamOutlined style={{ fontSize: 20, color: "#1890ff" }} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>
            {isEditing ? "Edit Group" : "Create New Group"}
          </span>
        </Space>
      }
      open={isModalVisible}
      onCancel={handleCancel}
      width={600}
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
          message="Group Configuration"
          description="Groups organize teams within a round. Teams in the same group will compete against each other."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item
          name="groupName"
          label="Group Name"
          rules={[{ required: true, message: "Please enter group name" }]}
        >
          <Input placeholder="e.g., Group A, Group B, Pool 1" />
        </Form.Item>

        <Form.Item
          name="groupFormat"
          label="Group Format"
          tooltip="Determines how matches are created within the group"
        >
          <Select 
            placeholder="Select group format"
            size="large"
            optionLabelProp="label"
          >
            {GROUP_FORMAT_OPTIONS.map((option) => {
              const isDisabled = option.value === GroupFormat.MANUAL || option.value === GroupFormat.CUSTOM_MULTIPLE;
              return (
                <Option 
                  key={option.value} 
                  value={option.value}
                  label={option.label}
                  disabled={isDisabled}
                >
                  <div style={{ padding: "4px 0" }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>
                      {option.label}
                      {isDisabled && (
                        <Text type="secondary" style={{ fontSize: 11, marginLeft: 8, fontStyle: "italic" }}>
                          (Coming Soon)
                        </Text>
                      )}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {option.description}
                    </Text>
                  </div>
                </Option>
              );
            })}
          </Select>
        </Form.Item>

        <Form.Item
          name="maxTeams"
          label="Maximum Teams"
          tooltip="Maximum number of teams allowed in this group"
        >
          <InputNumber
            min={2}
            max={32}
            placeholder="4"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Divider>Advanced (Optional)</Divider>

        <Form.Item
          name="advancementRule"
          label="Advancement Rule (JSON)"
          tooltip="Define how many teams advance from this group"
        >
          <TextArea
            rows={3}
            placeholder='{"topN": 2}'
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
