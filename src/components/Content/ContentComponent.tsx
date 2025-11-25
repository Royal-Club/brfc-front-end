import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, SettingOutlined, LogoutOutlined, BulbOutlined, TrophyOutlined } from "@ant-design/icons";
import {
    Avatar,
    Button,
    Col,
    Dropdown,
    Layout,
    Menu,
    Modal,
    Row,
    Space,
    Switch,
    theme,
    Typography,
    Drawer,
    Timeline,
    Empty,
    Spin,
} from "antd";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useAuthHook } from "../../hooks/useAuthHook";
import { useGetUserProfileQuery } from "../../state/features/auth/authSlice";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import AcBillPayment from "../Account/BillPayment/AcBillPayment";
import AcCollection from "../Account/Collection/AcCollection";
import AcChart from "../Account/Configuration/AcChart";
import AcNature from "../Account/Configuration/AcNature";
import AcVoucherType from "../Account/Configuration/AcVoucherType";
import AccountBalanceSheet from "../Account/Report/AccountBalanceSheet";
import AccountBalanceSummary from "../Account/Report/AccountBalanceSummary";
import AccountsReport from "../Account/Report/AccountReport";
import AcVouchers from "../Account/Voucher/AcVouchers";
import UserProfile from "../authPages/UserProfile";
import SettingsModal from "../CommonAtoms/SettingsModal";
import Dashboard from "../Dashboard/DashboardComponent";
import Player from "../Player/Player";
import Players from "../Player/Players";
import JoinTournament from "../Tournaments/JoinTournament";
import SingleTournament from "../Tournaments/SingleTournament";
import TournamentsPage from "../Tournaments/TournamentsPage";
import Venue from "../Venue/Venue";
import ContentOutlet from "./ContentOutlet";
import ClubRules from "../ClubRules/ClubRules";
import companyLogo from "../../assets/logo.png";
import type { MenuProps } from "antd";
import { useGetMyGoalkeepingHistoryQuery } from "../../state/features/player/playerSlice";
import { showBdLocalTime } from "../../utils/utils";

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
    const [isMobile, setIsMobile] = useState(false);
    const [goalkeepingHistoryDrawerVisible, setGoalkeepingHistoryDrawerVisible] = useState(false);

    const { user, logout } = useAuthHook();
    const navigate = useNavigate();

    const { data: playerProfileData, refetch } = useGetUserProfileQuery({
        id: loginInfo?.userId || "",
    }, {
        skip: !loginInfo?.userId
    });

    const { 
        data: goalkeepingHistoryData, 
        isLoading: isLoadingGoalkeepingHistory,
        refetch: refetchGoalkeepingHistory 
    } = useGetMyGoalkeepingHistoryQuery();

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

    const handleGoalkeepingHistoryClick = () => {
        setGoalkeepingHistoryDrawerVisible(true);
        refetchGoalkeepingHistory();
    };

    const handleGoalkeepingHistoryClose = () => {
        setGoalkeepingHistoryDrawerVisible(false);
    };

    const items: MenuProps['items'] = [
        {
            label: (
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'flex-start',
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
                }}>
                    <Typography.Text 
                        strong 
                        style={{ 
                            fontSize: '14px', 
                            lineHeight: '20px',
                            marginBottom: '2px'
                        }}
                    >
                        {user.username}
                    </Typography.Text>
                    <Typography.Text 
                        type="secondary" 
                        style={{ 
                            fontSize: '12px', 
                            lineHeight: '16px'
                        }}
                    >
                        {loginInfo?.roles?.join(', ') || 'User'}
                    </Typography.Text>
                </div>
            ),
            key: "user-info",
        },
        {
            label: (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BulbOutlined />
                        Theme
                    </span>
                    <Switch
                        checked={isDarkMode}
                        onChange={handleThemeChange}
                        size="small"
                        checkedChildren="🌙"
                        unCheckedChildren="☀️"
                        onClick={(checked, e) => {
                            e?.stopPropagation();
                        }}
                    />
                </div>
            ),
            key: "theme",
        },
        {
            type: 'divider',
            key: 'divider1',
        },
        {
            label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserOutlined />
                    Profile
                </span>
            ),
            key: "1",
            onClick: () => {
                navigate("/profile");
            },
        },
        {
            label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrophyOutlined />
                    My Goalkeeping History
                </span>
            ),
            key: "goalkeeping-history",
            onClick: () => {
                handleGoalkeepingHistoryClick();
            },
        },
        {
            label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <SettingOutlined />
                    Settings
                </span>
            ),
            key: "2",
            onClick: () => {
                handleSettingsClick();
            },
        },
        {
            label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff4d4f' }}>
                    <LogoutOutlined />
                    Logout
                </span>
            ),
            key: "3",
            onClick: () => confirmLogout(),
        },
    ];

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    return (
        <>
            <Layout style={{ 
                marginLeft: isMobile ? 0 : 0,
                minHeight: '100vh'
            }}>
                {user?.token && (
                    <Header
                        style={{
                            padding: 0,
                            backgroundColor: colorBgContainer,
                            height: '64px',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <Row justify="space-between" align="middle" style={{ width: '100%', height: '100%' }}>
                            <Col style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
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
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                />
                                {isMobile && (
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        marginLeft: '8px',
                                        height: '100%'
                                    }}>
                                        <img 
                                            src={companyLogo} 
                                            alt="BRFC Logo" 
                                            style={{ 
                                                height: '32px', 
                                                objectFit: 'contain' 
                                            }} 
                                        />
                                        <Typography.Text 
                                            strong 
                                            style={{ 
                                                marginLeft: '8px', 
                                                fontSize: '18px',
                                                color: isDarkMode ? '#ffffff' : '#000000'
                                            }}
                                        >
                                            BRFC
                                        </Typography.Text>
                                    </div>
                                )}
                            </Col>
                            <Col
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    height: '100%',
                                    paddingRight: isMobile ? 16 : 32,
                                }}
                            >
                                {user.token && (
                                    <Dropdown
                                        overlay={<Menu items={items} />}
                                        trigger={["click"]}
                                        placement="bottomRight"
                                    >
                                        <Space style={{ cursor: 'pointer', height: '100%', alignItems: 'center' }}>
                                            <Avatar
                                                src={user?.image}
                                                alt={user.username}
                                                size={isMobile ? 32 : 40}
                                            />
                                            {!isMobile && (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                                                    <Typography.Text 
                                                        strong 
                                                        style={{ 
                                                            fontSize: '14px', 
                                                            lineHeight: '18px'
                                                        }}
                                                    >
                                                        {user.username}
                                                    </Typography.Text>
                                                    <Typography.Text 
                                                        type="secondary" 
                                                        style={{ 
                                                            fontSize: '12px', 
                                                            lineHeight: '16px'
                                                        }}
                                                    >
                                                        {loginInfo?.roles?.join(', ') || 'User'}
                                                    </Typography.Text>
                                                </div>
                                            )}
                                        </Space>
                                    </Dropdown>
                                )}
                            </Col>
                        </Row>
                    </Header>
                )}
                <Content
                    style={{
                        minHeight: isMobile ? 'calc(100vh - 64px)' : 'calc(100vh - 64px)',
                        overflow: 'auto',
                    }}
                >
                    <Routes>
                        <Route path="/" element={<ContentOutlet />}>
                            <Route index element={<Dashboard isDarkMode={isDarkMode} />} />
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
                            <Route
                                path="ac/bill-payments"
                                element={<AcBillPayment />}
                            />
                            <Route path="ac/charts" element={<AcChart />} />
                            <Route
                                path="ac/reports/accounts-summary"
                                element={<AccountsReport />}
                            />
                            <Route
                                path="ac/reports/balance-summary"
                                element={<AccountBalanceSummary />}
                            />
                            <Route
                                path="/ac/reports/balance-sheet"
                                element={<AccountBalanceSheet />}
                            />
                            {/* <Route path="ac/voucher" element={<AcVoucher />} /> */}
                            <Route
                                path="ac/vouchers"
                                element={<AcVouchers />}
                            />
                            {/* <Route path="ac/vouchers/:id" element={<AcVoucher />} /> */}

                            <Route path="club-rules" element={<ClubRules />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                    {playerProfileData && loginInfo?.userId && (
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

            {/* Goalkeeping History Drawer */}
            <Drawer
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TrophyOutlined style={{ color: '#faad14' }} />
                        <span>My Goalkeeping History</span>
                    </div>
                }
                placement="right"
                onClose={handleGoalkeepingHistoryClose}
                open={goalkeepingHistoryDrawerVisible}
                width={isMobile ? '100%' : 480}
                bodyStyle={{ padding: '24px' }}
            >
                {isLoadingGoalkeepingHistory ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Spin size="large" />
                        <div style={{ marginTop: 16 }}>Loading your goalkeeping history...</div>
                    </div>
                ) : goalkeepingHistoryData?.content && goalkeepingHistoryData.content.length > 0 ? (
                    <div>
                        <div style={{ 
                            marginBottom: 24, 
                            padding: '16px', 
                            borderRadius: '8px',
                            border: '1px solid rgba(24, 144, 255, 0.2)'
                        }}>
                            <Typography.Title level={5} style={{ margin: 0, marginBottom: 8 }}>
                                Summary
                            </Typography.Title>
                            <Typography.Text>
                                You have played as goalkeeper <strong>{goalkeepingHistoryData.content.length}</strong> times.
                            </Typography.Text>
                        </div>
                        
                        <Timeline
                            mode="left"
                            style={{ marginTop: 16 }}
                            items={goalkeepingHistoryData.content.map((record, index) => ({
                                dot: <TrophyOutlined style={{ fontSize: '16px', color: '#faad14' }} />,
                                children: (
                                    <div style={{ 
                                        padding: '12px 16px',
                                        borderRadius: '8px',
                                        border: '1px solid #f0f0f0'
                                    }}>
                                        <div style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            marginBottom: 4
                                        }}>
                                            <Typography.Text strong style={{ fontSize: '16px' }}>
                                                Round {record.roundNumber}
                                            </Typography.Text>
                                            <Typography.Text 
                                                type="secondary" 
                                                style={{ fontSize: '12px' }}
                                            >
                                                #{goalkeepingHistoryData.content.length - index}
                                            </Typography.Text>
                                        </div>
                                        <Typography.Text 
                                            type="secondary" 
                                            style={{ fontSize: '14px' }}
                                        >
                                            {showBdLocalTime(record.playedDate)}
                                        </Typography.Text>
                                    </div>
                                ),
                            }))}
                        />
                    </div>
                ) : (
                    <Empty
                        image={<TrophyOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
                        description={
                            <div>
                                <Typography.Title level={4} type="secondary">
                                    No Goalkeeping History
                                </Typography.Title>
                                <Typography.Text type="secondary">
                                    You haven't played as a goalkeeper yet. Keep playing and this section will show your goalkeeping records!
                                </Typography.Text>
                            </div>
                        }
                        style={{ padding: '40px 0' }}
                    />
                )}
            </Drawer>
        </>
    );
};


export default ContentComponent;
