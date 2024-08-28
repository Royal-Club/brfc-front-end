//create-team to create a new team
//tournament-summery to see all the tournaments teams, players a - localhost:9191/tournaments/details?tournamentId=1
// players-add-to-team- to drag and drop players to teams

import {
    DownOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
} from "@ant-design/icons";
import {
    Button,
    Col,
    Dropdown,
    Flex,
    Layout,
    MenuProps,
    Row,
    Space,
    theme,
} from "antd";
import { Route, Routes } from "react-router-dom";
import Players from "../Player/Players";
import Player from "../Player/Player";
import TournamentsPage from "../Tournaments/TournamentsPage";

import Dashboard from "../Dashboard/DashboardComponent";
import SingleTournament from "../Tournaments/SingleTournament";
import JoinTournament from "../Tournaments/JoinTournament";

const { Header, Sider, Content } = Layout;
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

    // const { user, logout } = AuthUser();

    const items: MenuProps["items"] = [
        {
            label: "Logout",
            key: "3",
        },
    ];

    // const handleMenuClick: MenuProps["onClick"] = (e) => {
    //   logout();
    // };

    return (
        <>
            <Layout>
                <Header style={{ padding: 0, background: colorBgContainer }}>
                    <Row>
                        <Col span={22}>
                            <Flex justify="space-between">
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
                                {/* <div>
                  <Dropdown
                    menu={{ items, onClick: handleMenuClick }}
                    trigger={["click"]}
                  >
                    <a onClick={(e) => e.preventDefault()}>
                      <Space>
                        {user?.name}
                        <DownOutlined />
                      </Space>
                    </a>
                  </Dropdown>
                </div> */}
                            </Flex>
                        </Col>
                    </Row>
                </Header>
                <Content
                    style={{
                        margin: "24px 16px",
                        padding: 24,
                        minHeight: 360,
                        background: colorBgContainer,
                    }}
                >
                    <div>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="player" element={<Player />} />
                            <Route path="players/:id" element={<Player />} />
                            <Route path="players" element={<Players />} />
                            <Route
                                path="tournaments"
                                element={<TournamentsPage />}
                            />
                            <Route
                                path="tournaments/team-building/:id"
                                element={<SingleTournament />}
                            />
                            <Route
                                path="tournaments/join-tournament/:id"
                                element={<JoinTournament />}
                            />
                        </Routes>
                    </div>
                </Content>
            </Layout>
        </>
    );
};

export default ContentComponent;
