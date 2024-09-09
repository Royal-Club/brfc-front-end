import { Card, Col, List, Row } from "antd";
import React from "react";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
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

const topPlayers = [
  {
    name: "John Doe",
    position: "ST",
    countryFlag: "https://bjitgroup.com/static/svg/common/bjit-logo2.svg",
    stats: { pac: 99, sho: 99, pas: 99, dri: 99, def: 99, phy: 99 },
    image: require("./../../assets/hd-kylian-mbappe-real-madrid-football-club-transparent-png-701751712069430k8zky8aqro-removebg-preview.png"),
  },  {
    name: "John Doe",
    position: "ST",
    countryFlag: "https://bjitgroup.com/static/svg/common/bjit-logo2.svg",
    stats: { pac: 99, sho: 99, pas: 99, dri: 99, def: 99, phy: 99 },
       image: require("./../../assets/hd-kylian-mbappe-real-madrid-football-club-transparent-png-701751712069430k8zky8aqro-removebg-preview.png"),

  },  {
    name: "John Doe",
    position: "ST",
    countryFlag: "https://bjitgroup.com/static/svg/common/bjit-logo2.svg",
    stats: { pac: 99, sho: 99, pas: 99, dri: 99, def: 99, phy: 99 },
       image: require("./../../assets/hd-kylian-mbappe-real-madrid-football-club-transparent-png-701751712069430k8zky8aqro-removebg-preview.png"),

  },  {
    name: "John Doe",
    position: "ST",
    countryFlag: "https://bjitgroup.com/static/svg/common/bjit-logo2.svg",
    stats: { pac: 99, sho: 99, pas: 99, dri: 99, def: 99, phy: 99 },
       image: require("./../../assets/hd-kylian-mbappe-real-madrid-football-club-transparent-png-701751712069430k8zky8aqro-removebg-preview.png"),

  }
];



const upcomingMatches = [
  { date: "2024-09-10", venue: "Stadium A", teams: "Team A vs Team B" },
  { date: "2024-09-15", venue: "Stadium B", teams: "Team C vs Team D" },
  { date: "2024-09-20", venue: "Stadium C", teams: "Team E vs Team F" },
  { date: "2024-09-25", venue: "Stadium D", teams: "Team G vs Team H" },
  { date: "2024-09-30", venue: "Stadium E", teams: "Team I vs Team J" },
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
  return (
    <div style={{ padding: "20px" }}>
      <Row gutter={48} style={{ gap: "20px" }}>
        {/* Section 1: Player Stats */}
        <Col
          span={24}
          style={{
            backgroundColor: colors.white,
          }}
        >
          <h2>Section 1: Player Stats</h2>
          <h3>Top Players</h3>
          <ul>
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
            </div>
          </ul>
          <Row gutter={48}>
            <Col md={12} sm={24}>
              <h3>Goals & Assists (Bar Chart)</h3>
              <Bar data={barData} />
            </Col>
            <Col md={12} sm={24}>
              <h3>Attendance Rate (Bar Chart)</h3>
              <Bar data={attendanceData} />
            </Col>
          </Row>
        </Col>

        {/* Section 2: Financial Overview */}
        <Col
          span={24}
          style={{
            backgroundColor: colors.white,
          }}
        >
          <h2>Section 2: Financial Overview</h2>
          <Row gutter={48}>
            {/* Line Chart on the left, taking 2/3 of the width */}
            <Col md={16} sm={24}>
              <h3>Monthly Payments (Line Chart)</h3>
              <Line data={monthlyPaymentsData} />
            </Col>
            <Col md={8} sm={12}>
              <h3>Expense Breakdown (Donut Chart)</h3>
              <Doughnut data={expenseData} />
            </Col>
          </Row>
        </Col>

        {/* Section 3: Tournament Overview */}
        <Col
          span={24}
          style={{
            backgroundColor: colors.white,
          }}
        >
          <h2>Section 3: Tournament Overview</h2>
          <Row gutter={48}>
            <Col md={12} sm={24}>
              <h3>Tournament Wins (Bar Chart)</h3>
              <Bar data={tournamentWinsData} />
            </Col>
            <Col md={12} sm={24}>
              <h3>Completed vs Upcoming Matches (Stacked Bar Chart)</h3>
              <Bar data={matchesData} />
            </Col>
          </Row>
        </Col>

        {/* Section 4: Venue Usage */}
        <Col
          span={24}
          style={{
            backgroundColor: colors.white,
          }}
        >
          <h2>Section 4: Venue Usage</h2>
          <Row gutter={48}>
            <Col md={12} sm={24}>
              <h3>Matches per Venue (Bar Chart)</h3>
              <Bar data={venueUsageData} />
            </Col>
            <Col md={12} sm={24}>
              <h3>Monthly Venue Usage (Line Chart)</h3>
              <Line data={monthlyPaymentsData} />
            </Col>
          </Row>
        </Col>

        {/* Section 5: Upcoming Matches */}

        <Col
          span={24}
          style={{
            backgroundColor: colors.white,
            padding: "20px",
          }}
        >
          <h2>Section 5: Upcoming Matches</h2>
          <List
            grid={{ gutter: 16, column: 3 }}
            dataSource={upcomingMatches}
            renderItem={(match) => (
              <List.Item>
                <Card title={match.date}>
                  <p>
                    <strong>Venue:</strong> {match.venue}
                  </p>
                  <p>
                    <strong>Teams:</strong> {match.teams}
                  </p>
                </Card>
              </List.Item>
            )}
          />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
