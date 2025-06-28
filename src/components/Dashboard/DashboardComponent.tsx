import {
  Col,
  Row,
  Statistic,
  StatisticProps,
  theme,
  Typography,
  Spin,
  Card,
} from "antd";
import { DollarOutlined, MinusCircleOutlined, WalletOutlined } from "@ant-design/icons";
import React, { useState } from "react";
import CountUp from "react-countup";
import { useGetAccountSummaryQuery } from "../../state/features/account/accountSummarySlice";
import "./DashboardComponent.module.css";
import styles from "./DashboardComponent.module.css";

// Import components
import PlayerCollectionMetrics from "./PlayerCollectionMetricsTable";
import LatestTournamentCard from "./LatestTournamentCard";

const formatter: StatisticProps["formatter"] = (value) => (
  <CountUp end={value as number} separator="," />
);

const { Title } = Typography;

const Dashboard: React.FC = () => {
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
              <div className={`${styles.analyticsCard} ${window.innerWidth <= 576 ? styles.mobile : styles.desktop}`} style={{
                background: '#F9E6DC',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative',
                minHeight: '120px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ 
                    color: '#8B4513', 
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    {window.innerWidth <= 576 ? 'Collections' : 'Total Collections'}
                  </div>
                  <Statistic
                    value={accountSummaryData?.content?.totalCollection}
                    precision={2}
                    valueStyle={{ 
                      color: '#5D4037', 
                      fontSize: window.innerWidth <= 576 ? '20px' : '28px',
                      fontWeight: 'bold',
                      lineHeight: 1
                    }}
                    formatter={formatter}
                    suffix={<span style={{ fontSize: window.innerWidth <= 576 ? '16px' : '20px', color: '#5D4037' }}>৳</span>}
                  />
                </div>
                <DollarOutlined style={{
                  position: 'absolute',
                  bottom: '16px',
                  right: '16px',
                  fontSize: '32px',
                  color: 'rgba(139, 69, 19, 0.3)',
                }} />
              </div>
            </Col>
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
              <div className={`${styles.analyticsCard} ${window.innerWidth <= 576 ? styles.mobile : styles.desktop}`} style={{
                background: '#E2E3F6',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative',
                minHeight: '120px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ 
                    color: '#4527A0', 
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    {window.innerWidth <= 576 ? 'Expenses' : 'Total Expenses'}
                  </div>
                  <Statistic
                    value={accountSummaryData?.content?.totalExpense}
                    precision={2}
                    valueStyle={{ 
                      color: '#311B92', 
                      fontSize: window.innerWidth <= 576 ? '20px' : '28px',
                      fontWeight: 'bold',
                      lineHeight: 1
                    }}
                    formatter={formatter}
                    suffix={<span style={{ fontSize: window.innerWidth <= 576 ? '16px' : '20px', color: '#311B92' }}>৳</span>}
                  />
                </div>
                <MinusCircleOutlined style={{
                  position: 'absolute',
                  bottom: '16px',
                  right: '16px',
                  fontSize: '32px',
                  color: 'rgba(69, 39, 160, 0.3)',
                }} />
              </div>
            </Col>
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
              <div className={`${styles.analyticsCard} ${window.innerWidth <= 576 ? styles.mobile : styles.desktop}`} style={{
                background: '#D0F0F3',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative',
                minHeight: '120px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ 
                    color: '#00695C', 
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    {window.innerWidth <= 576 ? 'Balance' : 'Account Balance'}
                  </div>
                  <Statistic
                    value={accountSummaryData?.content?.currentBalance}
                    precision={2}
                    valueStyle={{ 
                      color: '#004D40', 
                      fontSize: window.innerWidth <= 576 ? '20px' : '28px',
                      fontWeight: 'bold',
                      lineHeight: 1
                    }}
                    formatter={formatter}
                    suffix={<span style={{ fontSize: window.innerWidth <= 576 ? '16px' : '20px', color: '#004D40' }}>৳</span>}
                  />
                </div>
                <WalletOutlined style={{
                  position: 'absolute',
                  bottom: '16px',
                  right: '16px',
                  fontSize: '32px',
                  color: 'rgba(0, 105, 92, 0.3)',
                }} />
              </div>
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
        />
      </div>
    </div>
  );
};

export default Dashboard;