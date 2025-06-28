import {
  Col,
  Row,
  theme,
  Typography,
  Spin,
} from "antd";
import { DollarOutlined, MinusCircleOutlined, WalletOutlined } from "@ant-design/icons";
import React, { useState } from "react";
import { useGetAccountSummaryQuery } from "../../state/features/account/accountSummarySlice";
import "./DashboardComponent.module.css";
import styles from "./DashboardComponent.module.css";

// Import components
import PlayerCollectionMetrics from "./PlayerCollectionMetricsTable";
import LatestTournamentCard from "./LatestTournamentCard";
import AnalyticsCard from "./AnalyticsCard";

const { Title } = Typography;

interface DashboardProps {
  isDarkMode?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ isDarkMode = false }) => {
  const {
    token: { colorBgContainer, borderRadius, colorText, colorPrimary, colorSuccess, colorError, colorBorder }
  } = theme.useToken();

  const [selectedYear, setSelectedYear] = useState<number>();

  // Queries
  const { data: accountSummaryData, isLoading: isSummaryLoading } =
    useGetAccountSummaryQuery();

  return (
    <div className={styles.dashboardContainer}>

      {/* Account Summary Section */}
      <div
        style={{ 
          marginBottom: '20px', 
        }}
      >
        {isSummaryLoading ? (
          <div className={styles.loadingContainer}>
            <Spin size="large" />
            <div className={styles.loadingText} style={{ color: colorText }}>
              Loading account summary...
            </div>
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
              <AnalyticsCard
                title="Total Collections"
                value={accountSummaryData?.content?.totalCollection || 0}
                backgroundColor="#F9E6DC"
                textColor="#8B4513"
                valueColor="#5D4037"
                icon={<DollarOutlined />}
                iconColor="rgba(139, 69, 19, 0.3)"
              />
            </Col>
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
              <AnalyticsCard
                title="Total Expenses"
                value={accountSummaryData?.content?.totalExpense || 0}
                backgroundColor="#E2E3F6"
                textColor="#4527A0"
                valueColor="#311B92"
                icon={<MinusCircleOutlined />}
                iconColor="rgba(69, 39, 160, 0.3)"
              />
            </Col>
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
              <AnalyticsCard
                title="Account Balance"
                value={accountSummaryData?.content?.currentBalance || 0}
                backgroundColor="#D0F0F3"
                textColor="#00695C"
                valueColor="#004D40"
                icon={<WalletOutlined />}
                iconColor="rgba(0, 105, 92, 0.3)"
              />
            </Col>
          </Row>
        )}
      </div>

      {/* Latest Tournament Section */}
      <div style={{
          marginBottom: '20px',
          borderRadius,
      }}>
        <LatestTournamentCard />
      </div>

      {/* Player Contributions Section */}
      <div style={{ marginBottom: '20px' }}>
        <PlayerCollectionMetrics 
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
};

export default Dashboard;