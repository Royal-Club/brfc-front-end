import {
    DownOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
} from "@ant-design/icons";
import {
    Avatar,
    Button,
    Col,
    Dropdown,
    Layout,
    Menu,
    Row,
    Space,
    theme,
} from "antd";
import { Route, Routes, useNavigate } from "react-router-dom";
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
import { ProtectedRoute } from "./ProtectedRoute";
import UserProfile from "../authPages/UserProfile";

const { Header, Content } = Layout;

interface ContentComponentProps {
    onToggleCollapse: (value: boolean) => void;
    collapsed: boolean;
}

const ContentComponent: React.FC<ContentComponentProps> = ({
    onToggleCollapse,
    collapsed,
}) => {
    const {
        token: { colorBgContainer },
    } = theme.useToken();

    const { user, logout } = useAuthHook();
    const navigate = useNavigate();

    const items = [
        {
            label: "profile",
            key: "1",
            onClick: () => {
                navigate("/profile");
            },
        },
        {
            label: "Logout",
            key: "3",
            onClick: () => logout(),
        },
    ];

    return (
        <>
            <Layout>
                {user?.token && (
                    <Header
                        style={{ padding: 0, background: colorBgContainer }}
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
                        background: colorBgContainer,
                    }}
                >
                    <Routes>
                        {!user?.token ? (
                            <>
                                <Route path="/" element={<LoginPage />} />
                                <Route
                                    path="/change-password"
                                    element={<LoginPage />}
                                />
                            </>
                        ) : (
                            <Route path="/" element={<ContentOutlet />}>
                                <Route index element={<Dashboard />} />
                                <Route
                                    path="/profile"
                                    element={
                                        <ProtectedRoute>
                                            <UserProfile />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/player"
                                    element={
                                        <ProtectedRoute>
                                            <Player />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/players/:id"
                                    element={
                                        <ProtectedRoute>
                                            <Player />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/players"
                                    element={
                                        <ProtectedRoute>
                                            <Players />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/tournaments"
                                    element={
                                        <ProtectedRoute>
                                            <TournamentsPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/tournaments/team-building/:id"
                                    element={
                                        <ProtectedRoute>
                                            <SingleTournament />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/tournaments/join-tournament/:id"
                                    element={
                                        <ProtectedRoute>
                                            <JoinTournament />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route path="venues" element={<Venue />} />
                                <Route
                                    path="ac/voucher-types"
                                    element={<AcVoucherType />}
                                />
                                <Route
                                    path="/ac/natures"
                                    element={<AcNature />}
                                />{" "}
                                <Route
                                    path="ac/collections"
                                    element={<AcCollection />}
                                />
                                <Route path="ac/charts" element={<AcChart />} />
                            </Route>
                        )}
                    </Routes>
                </Content>
            </Layout>
        </>
    );
};

export default ContentComponent;
