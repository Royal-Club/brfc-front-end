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
import React, { useState } from "react";
import CountUp from "react-countup";
import { useGetAccountSummaryQuery } from "../../state/features/account/accountSummarySlice";
import "./dashboardStyles.css";

// Import components
import PlayerCollectionMetrics from "./PlayerCollectionMetricsTable";

const formatter: StatisticProps["formatter"] = (value) => (
  <CountUp end={value as number} separator="," />
);

const { Title } = Typography;

const Dashboard: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadius, colorText }
  } = theme.useToken();

  const [selectedYear, setSelectedYear] = useState<number>();

  // Queries
  const { data: accountSummaryData, isLoading: isSummaryLoading } =
    useGetAccountSummaryQuery();

  return (
    <div className="dashboard-container">
      {/* Account Summary Section */}
      <Card
        className="summary-card"
        style={{ marginBottom: '24px', borderRadius }}
      >
        {isSummaryLoading ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Spin size="large" />
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={8}>
              <Statistic
                title="Total Collections (BDT)"
                value={accountSummaryData?.content?.totalCollection}
                precision={2}
                valueStyle={{ color: "#3f8600" }}
                formatter={formatter}
                suffix="৳"
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Total Expenses (BDT)"
                value={accountSummaryData?.content?.totalExpense}
                precision={2}
                valueStyle={{ color: "#3f8600" }}
                formatter={formatter}
                suffix="৳"
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Account Balance (BDT)"
                value={accountSummaryData?.content?.currentBalance}
                precision={2}
                valueStyle={{ color: "#3f8600" }}
                formatter={formatter}
                suffix="৳"
              />
            </Col>
          </Row>
        )}
      </Card>

      {/* Player Contributions Section */}
      <Card
        title={
          <Title level={4} style={{ color: colorText, margin: 0 }}>
            Player Collection Metrics
          </Title>
        }
        className="contributions-card"
        style={{ borderRadius, background: colorBgContainer }}
        styles={{
          body: { background: colorBgContainer }
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
