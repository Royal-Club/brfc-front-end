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
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Queries
  const { data: accountSummaryData, isLoading: isSummaryLoading } =
    useGetAccountSummaryQuery();

  React.useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTablet(width <= 1024 && width > 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Muted gradient colors
  const getMutedColors = () => ({
    success: 'linear-gradient(135deg, #95d475, #73c653)',
    error: 'linear-gradient(135deg, #ff7875, #ff4d4f)', 
    primary: 'linear-gradient(135deg, #69c0ff, #1890ff)'
  });

  const mutedColors = getMutedColors();

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
            padding: isMobile ? '12px' : '16px'
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
          <Row gutter={[isMobile ? 8 : 12, isMobile ? 8 : 12]} className={styles.summaryRow}>
            <Col xs={8} sm={8} md={8} lg={8} xl={8}>
              <div 
                className={`${styles.analyticsCard} ${isMobile ? styles.mobile : isTablet ? styles.tablet : styles.desktop}`}
                style={{
                  background: mutedColors.success,
                  padding: isMobile ? '8px' : isTablet ? '12px' : '16px',
                  minHeight: isMobile ? '70px' : isTablet ? '85px' : '100px'
                }}
              >
                <DollarOutlined 
                  className={styles.cardIcon} 
                  style={{ fontSize: isMobile ? '16px' : isTablet ? '18px' : '20px' }}
                />
                <Statistic
                  title={
                    <span 
                      className={styles.cardTitle}
                      style={{ 
                        fontSize: isMobile ? '9px' : isTablet ? '11px' : '12px'
                      }}
                    >
                      {isMobile ? 'Collections' : 'Total Collections'}
                    </span>
                  }
                  value={accountSummaryData?.content?.totalCollection}
                  precision={2}
                  valueStyle={{ 
                    color: "white", 
                    fontSize: isMobile ? '14px' : isTablet ? '17px' : '20px',
                    fontWeight: 'bold',
                    lineHeight: 1
                  }}
                  formatter={formatter}
                  suffix={
                    <span 
                      className={styles.cardSuffix}
                      style={{ fontSize: isMobile ? '10px' : isTablet ? '12px' : '14px' }}
                    >
                      ৳
                    </span>
                  }
                />
              </div>
            </Col>
            <Col xs={8} sm={8} md={8} lg={8} xl={8}>
              <div 
                className={`${styles.analyticsCard} ${isMobile ? styles.mobile : isTablet ? styles.tablet : styles.desktop}`}
                style={{
                  background: mutedColors.error,
                  padding: isMobile ? '8px' : isTablet ? '12px' : '16px',
                  minHeight: isMobile ? '70px' : isTablet ? '85px' : '100px'
                }}
              >
                <MinusCircleOutlined 
                  className={styles.cardIcon}
                  style={{ fontSize: isMobile ? '16px' : isTablet ? '18px' : '20px' }}
                />
                <Statistic
                  title={
                    <span 
                      className={styles.cardTitle}
                      style={{ 
                        fontSize: isMobile ? '9px' : isTablet ? '11px' : '12px'
                      }}
                    >
                      {isMobile ? 'Expenses' : 'Total Expenses'}
                    </span>
                  }
                  value={accountSummaryData?.content?.totalExpense}
                  precision={2}
                  valueStyle={{ 
                    color: "white", 
                    fontSize: isMobile ? '14px' : isTablet ? '17px' : '20px',
                    fontWeight: 'bold',
                    lineHeight: 1
                  }}
                  formatter={formatter}
                  suffix={
                    <span 
                      className={styles.cardSuffix}
                      style={{ fontSize: isMobile ? '10px' : isTablet ? '12px' : '14px' }}
                    >
                      ৳
                    </span>
                  }
                />
              </div>
            </Col>
            <Col xs={8} sm={8} md={8} lg={8} xl={8}>
              <div 
                className={`${styles.analyticsCard} ${isMobile ? styles.mobile : isTablet ? styles.tablet : styles.desktop}`}
                style={{
                  background: mutedColors.primary,
                  padding: isMobile ? '8px' : isTablet ? '12px' : '16px',
                  minHeight: isMobile ? '70px' : isTablet ? '85px' : '100px'
                }}
              >
                <WalletOutlined 
                  className={styles.cardIcon}
                  style={{ fontSize: isMobile ? '16px' : isTablet ? '18px' : '20px' }}
                />
                <Statistic
                  title={
                    <span 
                      className={styles.cardTitle}
                      style={{ 
                        fontSize: isMobile ? '9px' : isTablet ? '11px' : '12px'
                      }}
                    >
                      {isMobile ? 'Balance' : 'Account Balance'}
                    </span>
                  }
                  value={accountSummaryData?.content?.currentBalance}
                  precision={2}
                  valueStyle={{ 
                    color: "white", 
                    fontSize: isMobile ? '14px' : isTablet ? '17px' : '20px',
                    fontWeight: 'bold',
                    lineHeight: 1
                  }}
                  formatter={formatter}
                  suffix={
                    <span 
                      className={styles.cardSuffix}
                      style={{ fontSize: isMobile ? '10px' : isTablet ? '12px' : '14px' }}
                    >
                      ৳
                    </span>
                  }
                />
              </div>
            </Col>
          </Row>
        )}
      </Card>

      {/* Player Contributions Section */}
      <Card
        title={
          <Title 
            level={4} 
            style={{ 
              color: colorText, 
              margin: 0, 
              fontSize: isMobile ? '16px' : isTablet ? '17px' : '18px'
            }}
          >
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
            padding: isMobile ? '8px' : '12px'
          },
          header: {
            padding: isMobile ? '8px 12px' : '12px 16px'
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