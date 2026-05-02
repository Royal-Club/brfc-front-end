import React, { useState } from "react";
import { Card, Form, Input, Button, Typography, Result, Select, message, Alert, Divider, Space } from "antd";
import { useParams } from "react-router-dom";
import { CheckCircleOutlined, UserOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useGetAuctionSessionQuery, useRegisterForAuctionMutation, useQuickRegisterForAuctionMutation } from "../../state/features/auction/auctionSlice";
import { AuctionRegistrationRequest } from "../../state/features/auction/auctionTypes";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";

const { Title, Text, Paragraph } = Typography;

const AuctionRegistrationPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [form] = Form.useForm();
  const [registered, setRegistered] = useState(false);
  const [register, { isLoading }] = useRegisterForAuctionMutation();
  const [quickRegister, { isLoading: isQuickLoading }] = useQuickRegisterForAuctionMutation();
  const loginInfo = useSelector(selectLoginInfo);
  const isLoggedIn = !!loginInfo?.token;
  const { data: session } = useGetAuctionSessionQuery(Number(tournamentId), { skip: !tournamentId });
  const isRegistrationClosed = session?.status === "COMPLETED";

  const onFinish = async (values: any) => {
    try {
      const request: AuctionRegistrationRequest = {
        ...values,
        tournamentId: Number(tournamentId),
      };
      await register(request).unwrap();
      setRegistered(true);
      message.success("Registration submitted successfully!");
    } catch (err: any) {
      message.error(err?.data?.message || "Registration failed");
    }
  };

  const handleQuickRegister = async () => {
    try {
      await quickRegister(Number(tournamentId)).unwrap();
      setRegistered(true);
      message.success("You have been registered for the auction!");
    } catch (err: any) {
      message.error(err?.data?.message || "Registration failed");
    }
  };

  if (registered) {
    return (
      <Card style={{ maxWidth: 600, margin: "40px auto" }}>
        <Result
          status="success"
          title="You're In!"
          subTitle={isLoggedIn
            ? "You have been successfully registered for this auction. You'll be added to the player pool and teams will bid for you during the live auction!"
            : "Your registration is pending admin approval. Once approved, you will receive a player account and can participate in the auction."
          }
          extra={
            !isLoggedIn && (
              <Alert
                type="info"
                message="What happens next?"
                description={
                  <ul style={{ paddingLeft: 16, margin: 0 }}>
                    <li>Admin will review and approve your registration</li>
                    <li>Upon approval, a player account is created for you automatically</li>
                    <li>You can log in with your email and default password: <Text code>Bjit@123</Text></li>
                    <li>You'll be added to the auction player pool</li>
                    <li>Teams will bid for you during the live auction!</li>
                  </ul>
                }
              />
            )
          }
        />
      </Card>
    );
  }

  // === LOGGED IN USER: Simple one-click registration ===
  if (isLoggedIn) {
    return (
      <Card style={{ maxWidth: 500, margin: "40px auto", textAlign: "center" }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <UserOutlined style={{ fontSize: 48, color: "#1890ff" }} />
          <Title level={3}>Join Auction</Title>
          <Paragraph>
            Hi <Text strong>{loginInfo.username || loginInfo.email}</Text>! Ready to be part of the player auction for this tournament?
          </Paragraph>
          <Alert
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            message="Your profile data will be used automatically"
            description="No need to fill any form — your name, email, employee ID and position are already on file."
            style={{ textAlign: "left" }}
          />
          {isRegistrationClosed && (
            <Alert
              type="warning"
              showIcon
              message="Auction registration is closed"
              description="This tournament auction is already completed, so new registrations are not accepted."
              style={{ textAlign: "left" }}
            />
          )}
          <Button
            type="primary"
            size="large"
            block
            loading={isQuickLoading}
            onClick={handleQuickRegister}
            disabled={isRegistrationClosed}
            style={{ height: 50, fontSize: 16 }}
          >
            ⚡ Register Me for This Auction
          </Button>
          <Text type="secondary">You will be instantly approved and added to the auction pool.</Text>
        </Space>
      </Card>
    );
  }

  // === NOT LOGGED IN: Full form for outside players ===
  return (
    <Card style={{ maxWidth: 600, margin: "40px auto" }}>
      <Title level={3}>🏏 Player Auction Registration</Title>
      <Paragraph type="secondary">
        Register yourself to be part of the player auction for Tournament #{tournamentId}.
        After admin approval, teams will bid for you during the live auction.
      </Paragraph>
      
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="How it works"
        description="Fill out this form → Admin approves → You get a player account → Teams bid for you in the live auction"
      />

      {isRegistrationClosed && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Auction registration is closed"
          description="This tournament auction is already completed, so new registrations are not accepted."
        />
      )}

      <Divider />

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="name" label="Full Name" rules={[{ required: true, message: "Please enter your full name" }]}>
          <Input placeholder="e.g. Md. Rakib Hasan" />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: "email", message: "Please enter a valid email" }]}>
          <Input placeholder="your.email@example.com" />
        </Form.Item>
        <Form.Item name="employeeId" label="Employee ID" rules={[{ required: true, message: "Please enter your employee ID" }]}>
          <Input placeholder="e.g. BJIT-1234" />
        </Form.Item>
        <Form.Item name="skypeId" label="Skype ID" rules={[{ required: true, message: "Please enter your Skype ID" }]}>
          <Input placeholder="e.g. live:rakib.hasan" />
        </Form.Item>
        <Form.Item name="mobileNo" label="Phone (Optional)">
          <Input placeholder="e.g. +880 1XXXXXXXXX" />
        </Form.Item>
        <Form.Item name="playingPosition" label="Preferred Playing Position" rules={[{ required: true, message: "Please select your position" }]}>
          <Select placeholder="Select your preferred position">
            <Select.Option value="GOALKEEPER">🧤 Goalkeeper</Select.Option>
            <Select.Option value="RIGHT_BACK">🛡️ Right Back</Select.Option>
            <Select.Option value="LEFT_BACK">🛡️ Left Back</Select.Option>
            <Select.Option value="CENTER_BACK_1">🛡️ Center Back</Select.Option>
            <Select.Option value="DEFENSIVE_MIDFIELD">⚡ Defensive Midfield</Select.Option>
            <Select.Option value="CENTRAL_MIDFIELD">⚡ Central Midfield</Select.Option>
            <Select.Option value="ATTACKING_MIDFIELD">⚡ Attacking Midfield</Select.Option>
            <Select.Option value="RIGHT_WING_FORWARD">⚽ Right Wing/Forward</Select.Option>
            <Select.Option value="LEFT_WING_FORWARD">⚽ Left Wing/Forward</Select.Option>
            <Select.Option value="STRIKER">⚽ Striker</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="availabilityStatus" label="Availability">
          <Select placeholder="Are you fully available?" defaultValue="AVAILABLE">
            <Select.Option value="AVAILABLE">✅ Fully Available</Select.Option>
            <Select.Option value="PARTIALLY_AVAILABLE">⚠️ Partially Available</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="previousExperience" label="Previous Experience (Optional)">
          <Input.TextArea rows={3} placeholder="Any previous cricket/football experience..." />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading} block size="large" disabled={isRegistrationClosed}>
            Submit Registration
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AuctionRegistrationPage;
