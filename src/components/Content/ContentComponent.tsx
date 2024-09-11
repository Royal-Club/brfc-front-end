import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import {
    Avatar,
    Button,
    Col,
    Dropdown,
    Layout,
    Menu,
    Row,
    Space,
    Switch,
    Modal,
    theme,
} from "antd";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Players from "../Player/Players";
import Player from "../Player/Player";
import TournamentsPage from "../Tournaments/TournamentsPage";
import Dashboard from "../Dashboard/DashboardComponent";
import SingleTournament from "../Tournaments/SingleTournament";
import JoinTournament from "../Tournaments/JoinTournament";
import Venue from "../Venue/Venue";
import AcVoucherType from "../Account/Configuration/AcVoucherType";
import AcNature from "../Account/Configuration/AcNature";
import AcCollection from "../Account/Collection/AcCollection";
import AcChart from "../Account/Configuration/AcChart";
import LoginPage from "../authPages/LoginPage";
import ContentOutlet from "./ContentOutlet";
import { useAuthHook } from "../../hooks/useAuthHook";
import UserProfile from "../authPages/UserProfile";
import { checkTockenValidity } from "../../utils/utils";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { useGetUserProfileQuery } from "../../state/features/auth/authSlice";
import { useState } from "react";
import SettingsModal from "../CommonAtoms/SettingsModal";

const { Header, Content } = Layout;

interface ContentComponentProps {
    onToggleCollapse: (value: boolean) => void;
    collapsed: boolean;
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
}

const ContentComponent: React.FC<ContentComponentProps> = ({
    onToggleCollapse,
    collapsed,
    isDarkMode,
    setIsDarkMode,
}) => {
    const {
        token: { colorBgContainer },
    } = theme.useToken();
    const loginInfo = useSelector(selectLoginInfo);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const { user, logout } = useAuthHook();
    const navigate = useNavigate();

    const { data: playerProfileData, refetch } = useGetUserProfileQuery({
        id: loginInfo?.userId,
    });

    const handleSettingsClick = () => {
        setIsModalVisible(true);
    };

    const handleModalClose = () => {
        refetch();
        setIsModalVisible(false);
    };

    const handleThemeChange = (checked: boolean) => {
        setIsDarkMode(checked);
        localStorage.setItem("isDarkMode", String(checked));
    };

    const confirmLogout = () => {
        Modal.confirm({
            title: "Confirm Logout",
            content: "Are you sure you want to logout?",
            okText: "Yes",
            cancelText: "No",
            onOk: () => {
                logout();
            },
        });
    };

    const items = [
        {
            label: "Profile",
            key: "1",
            onClick: () => {
                navigate("/profile");
            },
        },
        {
            label: "Settings",
            key: "2",
            onClick: () => {
                handleSettingsClick();
            },
        },
        {
            label: "Logout",
            key: "3",
            onClick: () => confirmLogout(),
        },
    ];

    return (
        <>
            <Layout>
                {user?.token && (
                    <Header
                        style={{
                            padding: 0,
                            backgroundColor: colorBgContainer,
                        }}
                    >
                        <Row justify="space-between" align="middle">
                            <Col>
                                <Button
                                    type="text"
                                    icon={
                                        collapsed ? (
                                            <MenuUnfoldOutlined />
                                        ) : (
                                            <MenuFoldOutlined />
                                        )
                                    }
                                    onClick={() => {
                                        onToggleCollapse(!collapsed);
                                    }}
                                    style={{
                                        fontSize: "16px",
                                        width: 64,
                                        height: 64,
                                    }}
                                />
                            </Col>
                            <Col
                                style={{
                                    textAlign: "right",
                                    paddingRight: 32,
                                    cursor: "pointer",
                                }}
                            >
                                <Switch
                                    checked={isDarkMode}
                                    onChange={handleThemeChange}
                                    checkedChildren="Dark"
                                    unCheckedChildren="Light"
                                />

                                {user.token && (
                                    <Dropdown
                                        overlay={<Menu items={items} />}
                                        trigger={["click"]}
                                    >
                                        <Space>
                                            <Avatar
                                                src={user?.image}
                                                alt={user.username}
                                            />
                                            {user.username}
                                        </Space>
                                    </Dropdown>
                                )}
                            </Col>
                        </Row>
                    </Header>
                )}
                <Content
                    style={{
                        minHeight: 360,
                    }}
                >
                    <Routes>
                        <Route path="/" element={<ContentOutlet />}>
                            <Route index element={<Dashboard />} />
                            <Route path="/profile" element={<UserProfile />} />
                            <Route path="/player" element={<Player />} />
                            {loginInfo.roles.includes("ADMIN") && (
                                <Route
                                    path="/players/:id"
                                    element={<Player />}
                                />
                            )}
                            <Route path="/players" element={<Players />} />
                            <Route
                                path="/tournaments"
                                element={<TournamentsPage />}
                            />
                            <Route
                                path="/tournaments/team-building/:id"
                                element={<SingleTournament />}
                            />
                            <Route
                                path="/tournaments/join-tournament/:id"
                                element={<JoinTournament />}
                            />
                            <Route path="venues" element={<Venue />} />
                            <Route
                                path="ac/voucher-types"
                                element={<AcVoucherType />}
                            />
                            <Route path="/ac/natures" element={<AcNature />} />
                            <Route
                                path="ac/collections"
                                element={<AcCollection />}
                            />
                            <Route path="ac/charts" element={<AcChart />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                    {playerProfileData && (
                        <SettingsModal
                            visible={isModalVisible}
                            onClose={handleModalClose}
                            playerData={{
                                id: playerProfileData?.content?.id,
                                name: playerProfileData?.content?.name,
                                email: playerProfileData?.content?.email,
                                employeeId:
                                    playerProfileData?.content?.employeeId,
                                fullName: playerProfileData?.content?.fullName,
                                skypeId: playerProfileData?.content?.skypeId,
                                mobileNo: playerProfileData?.content?.mobileNo,
                                playingPosition:
                                    playerProfileData?.content?.playingPosition,
                            }}
                        />
                    )}
                </Content>
            </Layout>
        </>
    );
};

export default ContentComponent;
