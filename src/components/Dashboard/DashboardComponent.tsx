import {
  Card,
  Col,
  List,
  Row,
  Statistic,
  StatisticProps,
  theme,
  Typography,
} from "antd";
import React, { useEffect, useState } from "react";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ArcElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import colors from "../../utils/colors";
import PlayerStatCard from "../CommonAtoms/PlayerStatCard/PlayerStatCard";
import CountUp from "react-countup";
import axiosApi from "../../state/api/axiosBase";
import { API_URL } from "../../settings";
import IAccountSummaryResponse from "../../interfaces/AccountSummaryResponse";
import PlayerCollectionMetricsTable from "./PlayerCollectionMetricsTable";
import axios from "axios";

const formatter: StatisticProps["formatter"] = (value) => (
  <CountUp end={value as number} separator="," />
);

// Register the necessary chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ArcElement,
  LineElement,
  Tooltip,
  Legend
);

const { Title: AntTitle, Paragraph } = Typography;

const topPlayers = [
  {
    name: "John Doe",
    position: "ST",
    countryFlag: "https://bjitgroup.com/static/svg/common/bjit-logo2.svg",
    stats: { pac: 99, sho: 99, pas: 99, dri: 99, def: 99, phy: 99 },
    image: require("./../../assets/hd-kylian-mbappe-real-madrid-football-club-transparent-png-701751712069430k8zky8aqro-removebg-preview.png"),
  },
  //...other players
];

const upcomingMatches = [
  { date: "2024-09-10", venue: "Stadium A", teams: "Team A vs Team B" },
  //...other matches
];

const barData = {
  labels: ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5"],
  datasets: [
    {
      label: "Goals",
      data: [12, 19, 3, 5, 2],
      backgroundColor: "rgba(75, 192, 192, 0.6)",
    },
    {
      label: "Assists",
      data: [5, 6, 8, 3, 7],
      backgroundColor: "rgba(153, 102, 255, 0.6)",
    },
  ],
};

const attendanceData = {
  labels: ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5"],
  datasets: [
    {
      label: "Attendance Rate",
      data: [90, 85, 95, 80, 75],
      backgroundColor: "rgba(255, 159, 64, 0.6)",
    },
  ],
};

const monthlyPaymentsData = {
  labels: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  datasets: [
    {
      label: "Payments",
      data: [500, 700, 400, 800, 1200, 700, 900, 1000, 600, 500, 900, 750],
      backgroundColor: "rgba(54, 162, 235, 0.6)",
      borderColor: "rgba(54, 162, 235, 1)",
      fill: false,
      tension: 0.1,
    },
  ],
};

const expenseData = {
  labels: ["Travel", "Equipment", "Salaries", "Miscellaneous"],
  datasets: [
    {
      data: [500, 300, 700, 200],
      backgroundColor: [
        "rgba(255, 99, 132, 0.6)",
        "rgba(54, 162, 235, 0.6)",
        "rgba(255, 206, 86, 0.6)",
        "rgba(75, 192, 192, 0.6)",
      ],
    },
  ],
};

const tournamentWinsData = {
  labels: ["Tournament A", "Tournament B", "Tournament C", "Tournament D"],
  datasets: [
    {
      label: "Win %",
      data: [70, 80, 50, 90],
      backgroundColor: "rgba(153, 102, 255, 0.6)",
    },
  ],
};

const matchesData = {
  labels: ["Completed", "Upcoming"],
  datasets: [
    {
      label: "Completed Matches",
      data: [8, 5],
      backgroundColor: "rgba(75, 192, 192, 0.6)",
    },
    {
      label: "Upcoming Matches",
      data: [2, 7],
      backgroundColor: "rgba(255, 99, 132, 0.6)",
    },
  ],
};

const venueUsageData = {
  labels: ["Venue A", "Venue B", "Venue C", "Venue D"],
  datasets: [
    {
      label: "Matches",
      data: [12, 9, 15, 10],
      backgroundColor: "rgba(54, 162, 235, 0.6)",
    },
  ],
};

const Dashboard: React.FC = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const [acSummaryResponse, setAcSummaryResponse] =
    useState<IAccountSummaryResponse>();

  useEffect(() => {
    getAcVoucherList();

    return () => { };
  }, []);

  const getAcVoucherList = () => {
    // setTableSpinLoading(true);
    axiosApi
      .get(`${API_URL}/ac/reports/summary`)
      .then((response) => {
        // response.data.content.map(
        //     (x: { [x: string]: any; id: any }) => {
        //         x["key"] = x.id;
        //     }
        // );
        setAcSummaryResponse(response.data.content);
        console.log(response.data.content);
        // setAcVouchers(response.data.content);
        // setTableSpinLoading(false);
      })
      .catch((err) => {
        // Handle error
        console.log("server error", err);
        // setTableSpinLoading(false);
      });
  };

  /* account table */
  // const monthNames = [
  //   "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  //   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  // ];

  // const [metrics, setMetrics] = useState<PlayerMetric[]>([]);
  // const year = 2025;

  // useEffect(() => {
  //   axios.get(`${API_URL}/ac/reports/player-collection-metrics`).then((res) => {
  //     if (res.data?.content?.metrics) {
  //       setMetrics(res.data.content.metrics);
  //     }
  //   });
  // }, []);


  return (
    <div style={{ padding: "0px 20px" }}>
      <Row gutter={48} style={{ gap: "20px" }}>
        {/* Section 1: Player Stats */}
        {/* <Col span={24} style={{ background: colorBgContainer }}>
          <AntTitle level={2}>Section 1: Player Stats</AntTitle>
          <AntTitle level={3}>Top Players</AntTitle>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {topPlayers.map((player, index) => (
              <PlayerStatCard
                key={index}
                name={player.name}
                position={player.position}
                countryFlag={player.countryFlag}
                stats={player.stats}
                image={player.image}
              />
            ))}
          </div>{" "}
        </Col> */}
        <Col span={24} style={{ background: colorBgContainer }}>
          <Row gutter={48} style={{ background: colorBgContainer }}>
            <Col md={8} sm={24}>
              <Statistic
                title="Total Collections (BDT)"
                value={acSummaryResponse?.totalCollection}
                precision={2}
                valueStyle={{ color: "#3f8600" }}
                formatter={formatter}
                suffix="৳"
              />
            </Col>
            <Col md={8} sm={24}>
              <Statistic
                title="Total Expenses (BDT)"
                value={acSummaryResponse?.totalExpense}
                precision={2}
                valueStyle={{ color: "#3f8600" }}
                formatter={formatter}
                suffix="৳"
              />
            </Col>
            <Col md={8} sm={24}>
              <Statistic
                title="Account Balance (BDT)"
                value={acSummaryResponse?.currentBalance}
                precision={2}
                valueStyle={{ color: "#3f8600" }}
                formatter={formatter}
                suffix="৳"
              />
            </Col>
            {/* <Col md={12} sm={24}>
              <AntTitle level={3}>Attendance Rate (Bar Chart)</AntTitle>
              <Bar data={attendanceData} />
            </Col> */}
          </Row>
        </Col>
        {/* <Col span={24} style={{ background: colorBgContainer }}>
          <Row gutter={48} style={{ background: colorBgContainer }}>
            <Col md={12} sm={24}>
              <AntTitle level={3}>Goals & Assists (Bar Chart)</AntTitle>
              <Bar data={barData} />
            </Col>
            <Col md={12} sm={24}>
              <AntTitle level={3}>Attendance Rate (Bar Chart)</AntTitle>
              <Bar data={attendanceData} />
            </Col>
          </Row>
        </Col> */}

        {/* Section 2: Financial Overview */}
        {/* <Col span={24} style={{ background: colorBgContainer }}>
          <AntTitle level={2}>Section 2: Financial Overview</AntTitle>
          <Row gutter={48}>
            <Col md={16} sm={24}>
              <AntTitle level={3}>Monthly Payments (Line Chart)</AntTitle>
              <Line data={monthlyPaymentsData} />
            </Col>
            <Col md={8} sm={12}>
              <AntTitle level={3}>Expense Breakdown (Donut Chart)</AntTitle>
              <Doughnut data={expenseData} />
            </Col>
          </Row>
        </Col> */}

        {/* Section 3: Tournament Overview */}
        {/* <Col span={24} style={{ background: colorBgContainer }}>
          <AntTitle level={2}>Section 3: Tournament Overview</AntTitle>
          <Row gutter={48}>
            <Col md={12} sm={24}>
              <AntTitle level={3}>Tournament Wins (Bar Chart)</AntTitle>
              <Bar data={tournamentWinsData} />
            </Col>
            <Col md={12} sm={24}>
              <AntTitle level={3}>
                Completed vs Upcoming Matches (Stacked Bar Chart)
              </AntTitle>
              <Bar data={matchesData} />
            </Col>
          </Row>
        </Col> */}

        {/* Section 4: Venue Usage */}
        {/* <Col span={24} style={{ background: colorBgContainer }}>
          <AntTitle level={2}>Section 4: Venue Usage</AntTitle>
          <Row gutter={48}>
            <Col md={12} sm={24}>
              <AntTitle level={3}>Matches per Venue (Bar Chart)</AntTitle>
              <Bar data={venueUsageData} />
            </Col>
            <Col md={12} sm={24}>
              <AntTitle level={3}>Monthly Venue Usage (Line Chart)</AntTitle>
              <Line data={monthlyPaymentsData} />
            </Col>
          </Row>
        </Col> */}

        {/* Section 5: Upcoming Matches */}
        {/* <Col
          span={24}
          style={{ padding: "20px", background: colorBgContainer }}
        >
          <AntTitle level={2}>Section 5: Upcoming Matches</AntTitle>
          <List
            grid={{ gutter: 16, column: 3 }}
            dataSource={upcomingMatches}
            renderItem={(match) => (
              <List.Item>
                <Card title={match.date}>
                  <Paragraph>
                    <strong>Venue:</strong> {match.venue}
                  </Paragraph>
                  <Paragraph>
                    <strong>Teams:</strong> {match.teams}
                  </Paragraph>
                </Card>
              </List.Item>
            )}
          />
        </Col> */}
        <Col span={24} style={{ background: colorBgContainer }}>
          <br />
          <PlayerCollectionMetricsTable />
          <br />
          <br />
        </Col>

      </Row>
    </div>
  );
};

export default Dashboard;
