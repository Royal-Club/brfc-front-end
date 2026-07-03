import {
  Col,
  Row,
  theme,
  Typography,
  Spin,
} from "antd";
import {
  DollarOutlined,
  MinusCircleOutlined,
  WalletOutlined,
  TrophyOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import React, { useState } from "react";
import { useGetAccountSummaryQuery } from "../../state/features/account/accountSummarySlice";
import "./DashboardComponent.module.css";
import styles from "./DashboardComponent.module.css";

// Import components
import PlayerCollectionMetrics from "./PlayerCollectionMetricsTable";
import LatestTournamentCard from "./LatestTournamentCard";
import AnalyticsCard from "./AnalyticsCard";

const { Text } = Typography;

interface DashboardProps {
  isDarkMode?: boolean;
}

const SectionHeader: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => {
  const { token } = theme.useToken();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <span style={{ color: token.colorPrimary, fontSize: 14 }}>{icon}</span>
      <Text
        strong
        style={{
          fontSize: 13,
          color: token.colorTextSecondary,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ isDarkMode = false }) => {
  const { token } = theme.useToken();

  const [selectedYear, setSelectedYear] = useState<number>();

  // Queries
  const { data: accountSummaryData, isLoading: isSummaryLoading } =
    useGetAccountSummaryQuery();

  return (
    <div className={styles.dashboardContainer}>

      {/* Account Summary Section */}
      <div style={{ marginBottom: 28 }}>
        <SectionHeader icon={<WalletOutlined />} label="Overview" />
        {isSummaryLoading ? (
          <div className={styles.loadingContainer}>
            <Spin size="large" />
            <div className={styles.loadingText} style={{ color: token.colorText }}>
              Loading account summary...
            </div>
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <AnalyticsCard
                title="Total Collections"
                value={accountSummaryData?.content?.totalCollection || 0}
                accentColor={token.colorSuccess}
                icon={<DollarOutlined />}
              />
            </Col>
            <Col xs={24} sm={8}>
              <AnalyticsCard
                title="Total Expenses"
                value={accountSummaryData?.content?.totalExpense || 0}
                accentColor={token.colorError}
                icon={<MinusCircleOutlined />}
              />
            </Col>
            <Col xs={24} sm={8}>
              <AnalyticsCard
                title="Account Balance"
                value={accountSummaryData?.content?.currentBalance || 0}
                accentColor={token.colorPrimary}
                icon={<WalletOutlined />}
              />
            </Col>
          </Row>
        )}
      </div>

      {/* Latest Tournament Section */}
      <div style={{ marginBottom: 28 }}>
        <SectionHeader icon={<TrophyOutlined />} label="Upcoming Match" />
        <LatestTournamentCard />
      </div>

      {/* Player Contributions Section */}
      <div style={{ marginBottom: 12 }}>
        <SectionHeader icon={<TeamOutlined />} label="Player Contributions" />
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
