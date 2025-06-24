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

const formatter: StatisticProps["formatter"] = (value) => (
  <CountUp end={value as number} separator="," />
);

const { Title } = Typography;

const Dashboard: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadius, colorText, colorPrimary, colorSuccess, colorError }
  } = theme.useToken();

  const [selectedYear, setSelectedYear] = useState<number>();

  // Queries
  const { data: accountSummaryData, isLoading: isSummaryLoading } =
    useGetAccountSummaryQuery();

  return (
    <div className={styles.dashboardContainer}>
      {/* Account Summary Section */}
      <Card
        className={styles.summaryCard}
        style={{ 
          marginBottom: '16px', 
          borderRadius,
          background: colorBgContainer,
          border: `1px solid ${theme.useToken().token.colorBorder}`
        }}
        styles={{
          body: { 
            background: colorBgContainer,
            padding: '16px'
          }
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
          <Row gutter={[12, 12]}>
            <Col xs={8} sm={8} md={8} lg={8} xl={8}>
              <div className={`${styles.analyticsCard} ${window.innerWidth <= 576 ? styles.mobile : styles.desktop}`} style={{
                background: `linear-gradient(135deg, ${colorSuccess}, #52c41a)`,
              }}>
                <DollarOutlined className={`${styles.cardIcon} ${window.innerWidth <= 576 ? styles.mobile : styles.desktop}`} />
                <Statistic
                  title={<span className={`${styles.cardTitle} ${window.innerWidth <= 576 ? styles.mobile : styles.desktop}`}>
                    {window.innerWidth <= 576 ? 'Collections' : 'Total Collections'}
                  </span>}
                  value={accountSummaryData?.content?.totalCollection}
                  precision={2}
                  valueStyle={{ 
                    color: "white", 
                    fontSize: window.innerWidth <= 576 ? '14px' : '20px',
                    fontWeight: 'bold',
                    lineHeight: 1
                  }}
                  formatter={formatter}
                  suffix={<span className={`${styles.cardSuffix} ${window.innerWidth <= 576 ? styles.mobile : styles.desktop}`}>৳</span>}
                />
              </div>
            </Col>
            <Col xs={8} sm={8} md={8} lg={8} xl={8}>
              <div className={`${styles.analyticsCard} ${window.innerWidth <= 576 ? styles.mobile : styles.desktop}`} style={{
                background: `linear-gradient(135deg, ${colorError}, #ff4d4f)`,
              }}>
                <MinusCircleOutlined className={`${styles.cardIcon} ${window.innerWidth <= 576 ? styles.mobile : styles.desktop}`} />
                <Statistic
                  title={<span className={`${styles.cardTitle} ${window.innerWidth <= 576 ? styles.mobile : styles.desktop}`}>
                    {window.innerWidth <= 576 ? 'Expenses' : 'Total Expenses'}
                  </span>}
                  value={accountSummaryData?.content?.totalExpense}
                  precision={2}
                  valueStyle={{ 
                    color: "white", 
                    fontSize: window.innerWidth <= 576 ? '14px' : '20px',
                    fontWeight: 'bold',
                    lineHeight: 1
                  }}
                  formatter={formatter}
                  suffix={<span className={`${styles.cardSuffix} ${window.innerWidth <= 576 ? styles.mobile : styles.desktop}`}>৳</span>}
                />
              </div>
            </Col>
            <Col xs={8} sm={8} md={8} lg={8} xl={8}>
              <div className={`${styles.analyticsCard} ${window.innerWidth <= 576 ? styles.mobile : styles.desktop}`} style={{
                background: `linear-gradient(135deg, ${colorPrimary}, #1890ff)`,
              }}>
                <WalletOutlined className={`${styles.cardIcon} ${window.innerWidth <= 576 ? styles.mobile : styles.desktop}`} />
                <Statistic
                  title={<span className={`${styles.cardTitle} ${window.innerWidth <= 576 ? styles.mobile : styles.desktop}`}>
                    {window.innerWidth <= 576 ? 'Balance' : 'Account Balance'}
                  </span>}
                  value={accountSummaryData?.content?.currentBalance}
                  precision={2}
                  valueStyle={{ 
                    color: "white", 
                    fontSize: window.innerWidth <= 576 ? '14px' : '20px',
                    fontWeight: 'bold',
                    lineHeight: 1
                  }}
                  formatter={formatter}
                  suffix={<span className={`${styles.cardSuffix} ${window.innerWidth <= 576 ? styles.mobile : styles.desktop}`}>৳</span>}
                />
              </div>
            </Col>
          </Row>
        )}
      </Card>

      {/* Player Contributions Section */}
      <Card
        title={
          <Title level={4} style={{ color: colorText, margin: 0, fontSize: '18px' }}>
            Player Collection Metrics
          </Title>
        }
        className={styles.contributionsCard}
        style={{ 
          borderRadius, 
          background: colorBgContainer,
          border: `1px solid ${theme.useToken().token.colorBorder}`
        }}
        styles={{
          body: { 
            background: colorBgContainer,
            padding: '12px'
          },
          header: {
            padding: '12px 16px'
          }
        }}
      >
        <PlayerCollectionMetrics 
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />
      </Card>
    </div>
  );
};

export default Dashboard;