import React, { useState } from "react";
import { Card, Col, Row, Avatar, Typography, Space } from "antd";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { Radar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from "chart.js";
import { SettingOutlined } from "@ant-design/icons";
import "./authStyles.css";
import SettingsModal from "../CommonAtoms/SettingsModal";

const { Title, Text } = Typography;

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

export default function UserProfile() {
    const loginInfo = useSelector(selectLoginInfo);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const userData = {
        footballStats: {
            matchesPlayed: 30,
            goals: 15,
            assists: 10,
            days_played: 100,
            pay_contribution: 20,
        },
    };

    const radarData = {
        labels: [
            "Days Played",
            "Goals",
            "Assists",
            "Matches Played",
            "Pay Contribution",
        ],
        datasets: [
            {
                label: `${loginInfo.username}'s Football Stats`,
                data: [
                    userData.footballStats.days_played,
                    userData.footballStats.goals,
                    userData.footballStats.assists,
                    userData.footballStats.matchesPlayed,
                    userData.footballStats.pay_contribution,
                ],
                backgroundColor: "rgba(34, 202, 236, 0.2)",
                borderColor: "rgba(34, 202, 236, 1)",
                borderWidth: 2,
                pointBackgroundColor: "rgba(34, 202, 236, 1)",
            },
        ],
    };

    const radarOptions = {
        scales: {
            r: {
                angleLines: {
                    display: true,
                },
                suggestedMin: 0,
                suggestedMax: 100,
            },
        },
    };

    const handleSettingsClick = () => {
        setIsModalVisible(true);
    };

    const handleModalClose = () => {
        setIsModalVisible(false);
    };

    return (
        <div className="userProfileContainer">
            <Row gutter={16}>
                <Col span={8}>
                    <Card
                        actions={[
                            <SettingOutlined
                                key="setting"
                                onClick={handleSettingsClick}
                            />,
                        ]}
                    >
                        <Avatar size={100} src={loginInfo.image} />
                        <Title level={4} style={{ marginTop: 16 }}>
                            {loginInfo.username}
                        </Title>
                        <Text>+8801234567890</Text>
                        <br />
                        <Text>Employee ID : 11784 </Text>
                        <br />
                        <Text>{loginInfo.email}</Text>
                        <hr className="hrStyle" />

                        <div className="radarDataStyle">
                            <Radar data={radarData} options={radarOptions} />
                        </div>
                    </Card>
                </Col>
                <Col span={16}>
                    <Card title="Football Statistics">
                        <div
                            style={{
                                backgroundImage: `url("https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg?cs=srgb&dl=pexels-grizzlybear-399187.jpg&fm=jpg")`,
                                backgroundSize: "contain",
                                backgroundPosition: "center",
                                height: "650px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <Text
                                style={{
                                    color: "white",
                                    fontSize: "30px",
                                    fontWeight: "bold",
                                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                                    padding: "20px",
                                }}
                            >
                                Football Stats Upcoming
                            </Text>
                        </div>
                        {/* <Text>
                            Matches Played:{" "}
                            {userData.footballStats.matchesPlayed}
                        </Text>
                        <br />
                        <Text>Goals: {userData.footballStats.goals}</Text>
                        <br />
                        <Text>Assists: {userData.footballStats.assists}</Text> */}
                    </Card>
                </Col>
            </Row>
            <SettingsModal
                visible={isModalVisible}
                onClose={handleModalClose}
            />
        </div>
    );
}
