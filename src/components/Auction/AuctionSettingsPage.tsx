import React, { useEffect } from "react";
import { Card, Form, InputNumber, Switch, Button, Typography, Spin, message, Input, Alert } from "antd";
import { useParams } from "react-router-dom";
import {
  useGetAuctionSettingsQuery,
  useCreateAuctionSettingsMutation,
  useUpdateAuctionSettingsMutation,
  useGetAuctionSessionQuery,
} from "../../state/features/auction/auctionSlice";
import { AuctionSettingsRequest } from "../../state/features/auction/auctionTypes";

const { Title } = Typography;

const AuctionSettingsPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const tid = Number(tournamentId);
  const [form] = Form.useForm();

  const { data: settings, isLoading } = useGetAuctionSettingsQuery(tid);
  const { data: session } = useGetAuctionSessionQuery(tid);
  const isLive = session?.status === "RUNNING" || session?.status === "PAUSED";
  const [createSettings, { isLoading: creating }] = useCreateAuctionSettingsMutation();
  const [updateSettings, { isLoading: updating }] = useUpdateAuctionSettingsMutation();

  useEffect(() => {
    if (settings) {
      form.setFieldsValue(settings);
    }
  }, [settings, form]);

  const onFinish = async (values: AuctionSettingsRequest) => {
    try {
      if (settings) {
        await updateSettings({ tournamentId: tid, body: values }).unwrap();
        message.success("Settings updated");
      } else {
        await createSettings({ tournamentId: tid, body: values }).unwrap();
        message.success("Settings created");
      }
    } catch (err: any) {
      message.error(err?.data?.message || "Failed to save settings");
    }
  };

  if (isLoading) return <Spin size="large" />;

  return (
    <Card style={{ maxWidth: 700, margin: "0 auto" }}>
      <Title level={3}>Auction Settings</Title>
      {isLive && (
        <Alert
          type="warning"
          showIcon
          message="Auction is currently live"
          description="Changes to timer, bid increment, and squad size will take effect from the next player. Budget changes affect all future bids."
          style={{ marginBottom: 16 }}
        />
      )}
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{
        teamBudget: 100000,
        bidIncrement: 1000,
        auctionTimerSeconds: 60,
        maxSquadSize: 11,
        minSquadSize: 7,
        unsoldReauctionEnabled: true,
        timerExtensionSeconds: 15,
        extendIfBidWithinLastSeconds: 10,
      }}>
        <Form.Item name="teamBudget" label="Team Budget" rules={[{ required: true }]}>
          <InputNumber style={{ width: "100%" }} min={1} />
        </Form.Item>
        <Form.Item name="bidIncrement" label="Minimum Bid Increment" rules={[{ required: true }]}>
          <InputNumber style={{ width: "100%" }} min={1} />
        </Form.Item>
        <Form.Item name="auctionTimerSeconds" label="Auction Timer (seconds)" rules={[{ required: true }]}>
          <InputNumber style={{ width: "100%" }} min={30} max={300} />
        </Form.Item>
        <Form.Item name="maxSquadSize" label="Max Squad Size" rules={[{ required: true }]}>
          <InputNumber style={{ width: "100%" }} min={1} />
        </Form.Item>
        <Form.Item name="minSquadSize" label="Min Squad Size" rules={[{ required: true }]}>
          <InputNumber style={{ width: "100%" }} min={1} />
        </Form.Item>
        <Form.Item name="timerExtensionSeconds" label="Timer Extension on Bid (seconds)">
          <InputNumber style={{ width: "100%" }} min={5} />
        </Form.Item>
        <Form.Item name="extendIfBidWithinLastSeconds" label="Extend if bid in last (seconds)">
          <InputNumber style={{ width: "100%" }} min={5} />
        </Form.Item>
        <Form.Item name="unsoldReauctionEnabled" label="Allow Unsold Re-auction" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="minRoleRequirements" label="Min Role Requirements (JSON)">
          <Input.TextArea rows={2} placeholder='e.g. {"GK": 1, "DEF": 2}' />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={creating || updating} block>
            {settings ? "Update Settings" : "Create Settings"}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AuctionSettingsPage;
