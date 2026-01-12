import React, { useState } from "react";
import { Button, Space, Typography, theme } from "antd";
import { PlusOutlined, TrophyOutlined } from "@ant-design/icons";
import PrizesList from "./PrizesList";
import CreatePrizeModal from "./CreatePrizeModal";
import { useSelector } from "react-redux";
import { RootState } from "../../../state/store";

const { Title } = Typography;

interface PrizesPanelProps {
  tournamentId: number;
}

export default function PrizesPanel({ tournamentId }: PrizesPanelProps) {
  const { token } = theme.useToken();
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Check if user is admin or super admin
  const userRoles = useSelector(
    (state: RootState) => state.loginInfo.roles || []
  );
  const isAdmin = userRoles.includes("ADMIN") || userRoles.includes("SUPERADMIN");

  const handleCreatePrize = () => {
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
  };

  return (
    <div 
      style={{ 
        padding: "24px",
        minHeight: "100vh",
        background: token.colorBgLayout,
      }}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            background: token.colorBgContainer,
            borderRadius: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            border: `1px solid ${token.colorBorder}`,
          }}
        >
          <Space size="middle" align="center">
            <div
              style={{
                fontSize: 36,
                filter: "drop-shadow(0 2px 4px rgba(255, 215, 0, 0.4))",
              }}
            >
              🏆
            </div>
            <Title 
              level={2} 
              style={{ 
                margin: 0,
                background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontWeight: "bold",
              }}
            >
              Tournament Prizes & Awards
            </Title>
          </Space>
          {isAdmin && (
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={handleCreatePrize}
              style={{
                borderRadius: 12,
                height: 44,
                padding: "0 24px",
                fontWeight: "600",
                boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)",
              }}
            >
              Add Prize
            </Button>
          )}
        </div>



        {/* Prizes List */}
        <PrizesList tournamentId={tournamentId} isAdmin={isAdmin} />
      </Space>

      {/* Create Prize Modal */}
      {isModalVisible && (
        <CreatePrizeModal
          tournamentId={tournamentId}
          isVisible={isModalVisible}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
