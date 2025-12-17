import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Select,
  InputNumber,
  Space,
  Typography,
  message,
  theme,
} from "antd";
import { PlayCircleOutlined, EnvironmentOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { IFixture } from "../../../state/features/fixtures/fixtureTypes";
import { useGetVanuesQuery } from "../../../state/features/vanues/vanuesSlice";
import IVenue from "../../../interfaces/IVenue";

const { Text } = Typography;

interface StartMatchModalProps {
  open: boolean;
  fixture: IFixture;
  onCancel: () => void;
  onConfirm: (venueId?: number, matchDurationMinutes?: number) => Promise<void>;
  isLoading?: boolean;
}

export default function StartMatchModal({
  open,
  fixture,
  onCancel,
  onConfirm,
  isLoading = false,
}: StartMatchModalProps) {
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const { data: venuesData, isLoading: venuesLoading } = useGetVanuesQuery();
  const venues = venuesData?.content || [];

  useEffect(() => {
    if (open) {
      // Set default values
      form.setFieldsValue({
        venueId: fixture.venueId || undefined,
        matchDurationMinutes: fixture.matchDurationMinutes || 90,
      });
    }
  }, [open, fixture, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onConfirm(values.venueId, values.matchDurationMinutes);
      form.resetFields();
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <Space size="middle">
          <PlayCircleOutlined style={{ fontSize: 20, color: token.colorSuccess }} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>Start Match</span>
        </Space>
      }
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={isLoading}
      okText="Start Match"
      okButtonProps={{
        style: { borderRadius: 8, height: 40 },
        icon: <PlayCircleOutlined />,
      }}
      cancelButtonProps={{ style: { borderRadius: 8, height: 40 } }}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 24 }}
      >
        <Form.Item
          label={
            <Space>
              <EnvironmentOutlined />
              <Text strong>Venue</Text>
            </Space>
          }
          name="venueId"
          rules={[{ required: true, message: "Please select a venue" }]}
        >
          <Select
            placeholder="Select venue"
            loading={venuesLoading}
            size="large"
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={venues
              .filter((v: IVenue) => v.active)
              .map((venue: IVenue) => ({
                value: venue.id,
                label: venue.name,
              }))}
          />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <ClockCircleOutlined />
              <Text strong>Match Duration (minutes)</Text>
            </Space>
          }
          name="matchDurationMinutes"
          rules={[
            { required: true, message: "Please enter match duration" },
            { type: "number", min: 10, max: 120, message: "Duration must be between 10 and 120 minutes" },
          ]}
        >
          <InputNumber
            placeholder="e.g., 90"
            size="large"
            style={{ width: "100%" }}
            min={1}
            max={120}
            addonAfter="minutes"
          />
        </Form.Item>

        <div style={{ 
          padding: "12px 16px", 
          background: token.colorFillSecondary, 
          borderRadius: 8,
          marginTop: 8,
          border: `1px solid ${token.colorBorder}`,
        }}>
          <Text type="secondary" style={{ fontSize: 12, color: token.colorTextSecondary }}>
            <strong>Match:</strong> {fixture.homeTeamName} vs {fixture.awayTeamName}
            <br />
            <strong>Note:</strong> The match will start immediately after confirmation. 
            The start time will be recorded automatically.
          </Text>
        </div>
      </Form>
    </Modal>
  );
}
