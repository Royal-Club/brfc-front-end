import React, { useState } from "react";
import { Card, Col, Row, Avatar, Typography, Skeleton, theme } from "antd";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { Radar } from "react-chartjs-2";

import {
    UserOutlined,
    PhoneOutlined,
    IdcardOutlined,
    MailOutlined,
    SettingOutlined,
} from "@ant-design/icons";

import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from "chart.js";
import "./authStyles.css";
import SettingsModal from "../CommonAtoms/SettingsModal";
import { useGetUserProfileQuery } from "../../state/features/auth/authSlice";

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
    const {
        token: { colorTextSecondary },
    } = theme.useToken();

    const {
        data: playerProfileData,
        isLoading,
        refetch,
    } = useGetUserProfileQuery({
        id: loginInfo?.userId,
    });

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

    // Updated radarOptions to include background color using colorTextSecondary
    const radarOptions = {
        scales: {
            r: {
                angleLines: {
                    display: true,
                },
                suggestedMin: 0,
                suggestedMax: 100,
                grid: {
                    color: colorTextSecondary,
                },
                ticks: {
                    backdropColor: colorTextSecondary, // Setting the radar graph background to colorTextSecondary
                },
            },
        },
        plugins: {
            legend: {
                labels: {
                    color: colorTextSecondary, // Set label color to match theme
                },
            },
        },
    };

    const handleSettingsClick = () => {
        refetch();
        setIsModalVisible(true);
    };

    const handleModalClose = () => {
        refetch();
        setIsModalVisible(false);
    };

    return (
        <div className="userProfileContainer">
            <Row gutter={[16, 16]} justify="center">
                <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                    <Card
                        actions={[
                            <SettingOutlined
                                key="setting"
                                onClick={handleSettingsClick}
                            />,
                        ]}
                    >
                        {isLoading ? (
                            <Skeleton
                                active
                                avatar={{ size: 100 }}
                                paragraph={{ rows: 3 }}
                            />
                        ) : (
                            <>
                                <Avatar size={100} src={loginInfo.image} />
                                <Title level={4} style={{ marginTop: 16 }}>
                                    <UserOutlined />{" "}
                                    {playerProfileData?.content?.name ||
                                        loginInfo.username}
                                </Title>

                                <Text>
                                    {
                                        playerProfileData?.content
                                            ?.playingPosition
                                    }
                                </Text>
                                <br />
                                <Text>
                                    <PhoneOutlined />{" "}
                                    {playerProfileData?.content?.mobileNo ||
                                        "no phone available"}
                                </Text>
                                <br />
                                <Text>
                                    <IdcardOutlined /> Employee ID :{" "}
                                    {playerProfileData?.content?.employeeId ||
                                        "no employee Id available"}
                                </Text>
                                <br />
                                <Text>
                                    <MailOutlined /> {loginInfo.email}
                                </Text>

                                <hr className="hrStyle" />
                                <div className="radarDataStyle">
                                    <Radar
                                        data={radarData}
                                        options={radarOptions}
                                    />
                                </div>
                            </>
                        )}
                    </Card>
                </Col>
                <Col xs={24} sm={24} md={16} lg={16} xl={16}>
                    <Card title="Football Statistics">
                        {isLoading ? (
                            <Skeleton.Image
                                style={{ width: "100%", height: "500px" }}
                            />
                        ) : (
                            <div
                                style={{
                                    backgroundImage: `url("https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg?cs=srgb&dl=pexels-grizzlybear-399187.jpg&fm=jpg")`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    height: "100%",
                                    minHeight: "500px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                            >
                                <Text
                                    style={{
                                        color: "white",
                                        fontSize: "20px",
                                        fontWeight: "bold",
                                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                                        padding: "20px",
                                    }}
                                >
                                    Football Stats Upcoming
                                </Text>
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
            {playerProfileData && (
                <SettingsModal
                    visible={isModalVisible}
                    onClose={handleModalClose}
                    playerData={{
                        id: playerProfileData?.content?.id,
                        name: playerProfileData?.content?.name,
                        email: playerProfileData?.content?.email,
                        employeeId: playerProfileData?.content?.employeeId,
                        fullName: playerProfileData?.content?.fullName,
                        skypeId: playerProfileData?.content?.skypeId,
                        mobileNo: playerProfileData?.content?.mobileNo,
                        playingPosition:
                            playerProfileData?.content?.playingPosition,
                    }}
                />
            )}
        </div>
    );
}
