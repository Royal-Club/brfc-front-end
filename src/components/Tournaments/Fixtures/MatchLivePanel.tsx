import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Dropdown,
  Menu,
  theme,
} from "antd";
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  useStartMatchMutation,
  useCompleteMatchMutation,
} from "../../../state/features/fixtures/fixturesSlice";
import { IFixture } from "../../../state/features/fixtures/fixtureTypes";

interface MatchLivePanelProps {
  fixture: IFixture;
  onSuccess?: () => void;
  compact?: boolean;
}

export default function MatchLivePanel({
  fixture,
  onSuccess,
  compact = false,
}: MatchLivePanelProps) {
  const [startMatch, { isLoading: startLoading }] = useStartMatchMutation();
  const [completeMatch, { isLoading: completeLoading }] =
    useCompleteMatchMutation();
  const [menuVisible, setMenuVisible] = useState(false);
  const { token } = theme.useToken();

  const handleStartMatch = async () => {
    setMenuVisible(false);
    Modal.confirm({
      title: "Start Match",
      content: "Are you sure you want to start this match?",
      okText: "Yes, Start Match",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await startMatch({ matchId: fixture.id }).unwrap();
          message.success("Match started");
          onSuccess?.();
        } catch (error) {
          message.error("Failed to start match");
        }
      },
    });
  };

  const handleCompleteMatch = async () => {
    setMenuVisible(false);
    Modal.confirm({
      title: "Complete Match",
      content: "Are you sure you want to mark this match as completed? This action cannot be undone.",
      okText: "Yes, Complete Match",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await completeMatch({ matchId: fixture.id }).unwrap();
          message.success("Match completed");
          onSuccess?.();
        } catch (error) {
          message.error("Failed to complete match");
        }
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "blue";
      case "ONGOING":
        return "orange";
      case "PAUSED":
        return "purple";
      case "COMPLETED":
        return "green";
      default:
        return "default";
    }
  };

  const matchControlMenu = (
    <Menu>
      {fixture.matchStatus === "SCHEDULED" && (
        <Menu.Item
          key="start"
          icon={<PlayCircleOutlined />}
          onClick={handleStartMatch}
        >
          Start Match
        </Menu.Item>
      )}
      {fixture.matchStatus === "ONGOING" && (
        <Menu.Item
          key="complete"
          icon={<CheckCircleOutlined />}
          onClick={handleCompleteMatch}
          danger
        >
          Complete Match
        </Menu.Item>
      )}
      {fixture.matchStatus === "COMPLETED" && (
        <Menu.Item key="info" disabled>
          Match is already completed
        </Menu.Item>
      )}
    </Menu>
  );

  // Compact mode - just the button with status tag
  if (compact) {
    return (
      <Dropdown
        overlay={matchControlMenu}
        trigger={["click"]}
        visible={menuVisible}
        onVisibleChange={setMenuVisible}
      >
        <Button
          icon={<SettingOutlined />}
          size="large"
          style={{
            borderRadius: 12,
            height: 48,
            paddingLeft: 20,
            paddingRight: 20,
            background: token.colorBgContainer,
            backdropFilter: "blur(10px)",
            border: `2px solid ${token.colorBorder}`,
            boxShadow: token.colorBgContainer === '#ffffff'
              ? "0 4px 12px rgba(0,0,0,0.15)"
              : "0 4px 12px rgba(0,0,0,0.4)",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: token.colorText,
          }}
        >
          <Tag
            color={getStatusColor(fixture.matchStatus)}
            style={{
              fontSize: 12,
              padding: "4px 12px",
              fontWeight: 700,
              margin: 0,
              border: "none",
            }}
          >
            {fixture.matchStatus}
          </Tag>
          Match Settings
        </Button>
      </Dropdown>
    );
  }

  // Full card mode
  return (
    <Card
      title="Match Controls"
      extra={
        <Dropdown
          overlay={matchControlMenu}
          trigger={["click"]}
          visible={menuVisible}
          onVisibleChange={setMenuVisible}
        >
          <Button
            icon={<SettingOutlined />}
            size="large"
            style={{ borderRadius: 8 }}
          >
            Match Settings
          </Button>
        </Dropdown>
      }
      style={{
        borderRadius: 12,
        border: "none",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#666" }}>
              Current Status:
            </span>
            <Tag
              color={getStatusColor(fixture.matchStatus)}
              style={{ fontSize: 14, padding: "6px 16px", fontWeight: 600 }}
            >
              {fixture.matchStatus}
            </Tag>
          </div>
        </Col>
      </Row>
    </Card>
  );
}
