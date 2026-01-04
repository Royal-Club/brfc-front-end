import React from "react";
import {
  Modal,
  Space,
  Typography,
  theme,
} from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { IFixture } from "../../../state/features/fixtures/fixtureTypes";
import moment from "moment";

const { Text } = Typography;

interface CompleteMatchModalProps {
  open: boolean;
  fixture: IFixture;
  onCancel: () => void;
  onConfirm: (matchDurationMinutes?: number) => Promise<void>;
  isLoading?: boolean;
}

export default function CompleteMatchModal({
  open,
  fixture,
  onCancel,
  onConfirm,
  isLoading = false,
}: CompleteMatchModalProps) {
  const { token } = theme.useToken();

  // Calculate actual duration if match has started
  const calculateActualDuration = (): number | undefined => {
    if (fixture.startedAt && fixture.elapsedTimeSeconds !== undefined && fixture.elapsedTimeSeconds !== null) {
      // Return elapsed time in minutes, cap at 120
      // Ensure minimum of 1 minute if match has elapsed time
      const minutes = Math.max(1, Math.ceil(fixture.elapsedTimeSeconds / 60));
      return Math.min(minutes, 120);
    }
    // If match hasn't started or no elapsed time, use fixture duration or default
    const duration = fixture.matchDurationMinutes || 90;
    return duration > 0 ? Math.min(duration, 120) : 90;
  };

  const handleOk = async () => {
    try {
      // Always use calculated duration from elapsed time
      const duration = calculateActualDuration();
      await onConfirm(duration);
    } catch (error) {
      console.error("Failed to complete match:", error);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  const actualDuration = calculateActualDuration();
  const startedAt = fixture.startedAt 
    ? moment.utc(fixture.startedAt).local().format("YYYY-MM-DD HH:mm:ss")
    : null;

  return (
    <Modal
      title={
        <Space size="middle">
          <CheckCircleOutlined style={{ fontSize: 20, color: token.colorSuccess }} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>Complete Match</span>
        </Space>
      }
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={isLoading}
      okText="Complete Match"
      okButtonProps={{
        style: { borderRadius: 8, height: 40 },
        icon: <CheckCircleOutlined />,
        danger: true,
      }}
      cancelButtonProps={{ style: { borderRadius: 8, height: 40 } }}
      width={500}
    >
      <div style={{ 
          padding: "12px 16px", 
          background: token.colorWarningBg, 
          borderRadius: 8,
          marginTop: 8,
          border: `1px solid ${token.colorWarningBorder}`,
        }}>
          <Text type="secondary" style={{ fontSize: 12, color: token.colorTextSecondary }}>
            <strong>Match:</strong> {fixture.homeTeamName} {fixture.homeTeamScore} - {fixture.awayTeamScore} {fixture.awayTeamName}
            <br />
            {startedAt && (
              <>
                <strong>Started at:</strong> {startedAt}
                <br />
              </>
            )}
            {actualDuration && (
              <>
                <strong>Match Duration:</strong> {actualDuration} minutes (based on elapsed time)
                <br />
              </>
            )}
            <strong>Note:</strong> Completing the match will finalize the result and record the completion time. The match duration will be calculated automatically from the elapsed time.
          </Text>
        </div>
    </Modal>
  );
}
