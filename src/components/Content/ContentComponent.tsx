import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, SettingOutlined, LogoutOutlined, BulbOutlined, TrophyOutlined, BarChartOutlined, DashboardOutlined } from "@ant-design/icons";
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
import { useState, useEffect, lazy, Suspense } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { useAuthHook } from "../../hooks/useAuthHook";
import { useGetUserProfileQuery } from "../../state/features/auth/authSlice";
import { selectLoginInfo, setImage } from "../../state/slices/loginInfoSlice";
import { API_URL } from "../../settings";
import SettingsModal from "../CommonAtoms/SettingsModal";
import ContentOutlet from "./ContentOutlet";
import TournamentViewerPage from "../TournamentViewer/TournamentViewerPage";
import companyLogo from "../../assets/logo.png";
import AppFooter from "../CommonAtoms/AppFooter";
import type { MenuProps } from "antd";
import { useGetMyGoalkeepingHistoryQuery } from "../../state/features/player/playerSlice";
import { showBdLocalTime } from "../../utils/utils";
// Not lazy, unlike the routed pages below: the dock is on every page, so a split chunk would be
// fetched on every page anyway. The heavy part - the room and its socket - is lazily loaded inside
// it, only once someone opens the panel.
import TeamChatDock from "../TeamChat/TeamChatDock";

/*
 * Route components are loaded on demand.
 *
 * These were static imports, which meant every visitor — including someone who only wanted the
 * public fixtures list, or who had not logged in at all — downloaded the accounting screens, the
 * auction module and the reporting charts before the login form could paint. Each lazy() below
 * becomes its own chunk, fetched the first time its route is opened and cached after that.
 *
 * ContentOutlet and SettingsModal stay eager: they are the shell around the routes rather than
 * destinations, so deferring them would only add a spinner to every navigation.
 */
const AcBillPayment = lazy(() => import("../Account/BillPayment/AcBillPayment"));
const AcCollection = lazy(() => import("../Account/Collection/AcCollection"));
const AcChart = lazy(() => import("../Account/Configuration/AcChart"));
const AcNature = lazy(() => import("../Account/Configuration/AcNature"));
const AcVoucherType = lazy(() => import("../Account/Configuration/AcVoucherType"));
const AccountBalanceSheet = lazy(() => import("../Account/Report/AccountBalanceSheet"));
const AccountBalanceSummary = lazy(() => import("../Account/Report/AccountBalanceSummary"));
const AccountsReport = lazy(() => import("../Account/Report/AccountReport"));
const AcVouchers = lazy(() => import("../Account/Voucher/AcVouchers"));
const UserProfile = lazy(() => import("../authPages/UserProfile"));
const Dashboard = lazy(() => import("../Dashboard/DashboardComponent"));
const Player = lazy(() => import("../Player/Player"));
const Players = lazy(() => import("../Player/Players"));
const PlayerStatistics = lazy(() => import("../Player/PlayerStatistics"));
const PlayerComparison = lazy(() => import("../Player/PlayerComparison"));
const PlayerAttendance = lazy(() => import("../Player/PlayerAttendance"));
const HallOfFame = lazy(() => import("../Player/HallOfFame"));
const JoinTournament = lazy(() => import("../Tournaments/JoinTournament"));
const SingleTournament = lazy(() => import("../Tournaments/SingleTournament"));
const TournamentsPage = lazy(() => import("../Tournaments/TournamentsPage"));
const Venue = lazy(() => import("../Venue/Venue"));
const ClubRules = lazy(() => import("../ClubRules/ClubRules"));
const ResourcesPage = lazy(() => import("../Resources/ResourcesPage"));
const ResourceDetailPage = lazy(() => import("../Resources/ResourceDetailPage"));
const MatchDetailsPage = lazy(() => import("../Tournaments/Fixtures/MatchDetailsPage"));
const TeamChatPage = lazy(() => import("../TeamChat/TeamChatPage"));

// Imported from their own files rather than the ../Auction barrel, so one auction screen does not
// drag the other seven into the same chunk.
const AuctionHubPage = lazy(() => import("../Auction/AuctionHubPage"));
const AuctionRegistrationPage = lazy(() => import("../Auction/AuctionRegistrationPage"));
const AuctionAdminApprovalPage = lazy(() => import("../Auction/AuctionAdminApprovalPage"));
const AuctionSettingsPage = lazy(() => import("../Auction/AuctionSettingsPage"));
const AuctionPlayerPoolPage = lazy(() => import("../Auction/AuctionPlayerPoolPage"));
const AuctionTeamBudgetsPage = lazy(() => import("../Auction/AuctionTeamBudgetsPage"));
const LiveAuctionPage = lazy(() => import("../Auction/LiveAuctionPage"));
const AuctionResultsPage = lazy(() => import("../Auction/AuctionResultsPage"));

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
    const location = useLocation();
    const dispatch = useDispatch();

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

    const handlePlayerStatisticsClick = () => {
        navigate("/player-statistics");
    };

    const handleDashboardClick = () => {
        navigate("/dashboard");
    };

    const isOnStatisticsPage = location.pathname === "/player-statistics";
    const isOnDashboard = location.pathname === "/" || location.pathname === "/dashboard";

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

    // Sync the real profile photo into the store so the header avatar and the
    // sidebar footer (both read loginInfo.image) show the user's actual photo.
    useEffect(() => {
        const photoUrl = playerProfileData?.content?.photoUrl;
        if (!photoUrl) return;
        const src = photoUrl.startsWith("http")
            ? photoUrl
            : `${API_URL}${photoUrl}`;
        dispatch(setImage(src));
    }, [playerProfileData, dispatch]);

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
                                {(isOnDashboard || isOnStatisticsPage) && (
                                    <Button
                                        type="text"
                                        icon={isOnStatisticsPage ? <DashboardOutlined /> : <BarChartOutlined />}
                                        onClick={isOnStatisticsPage ? handleDashboardClick : handlePlayerStatisticsClick}
                                        style={{
                                            fontSize: "16px",
                                            width: 64,
                                            height: 64,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                        title={isOnStatisticsPage ? "Dashboard" : "Player Statistics"}
                                    />
                                )}
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
                        height: 'calc(100vh - 64px)',
                        overflow: 'auto',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: '100%',
                        }}
                    >
                        <div style={{ flex: 1 }}>
                    {/* One boundary for every lazy route: each page arrives as its own chunk, and
                        this is what shows while that chunk is in flight. */}
                    <Suspense
                        fallback={
                            <div style={{ display: "flex", justifyContent: "center", padding: 64 }}>
                                <Spin size="large" />
                            </div>
                        }
                    >
                    <Routes>
                        <Route path="/" element={<ContentOutlet />}>
                            <Route index element={<Dashboard isDarkMode={isDarkMode} />} />
                            <Route
                                path="/tournament-viewer"
                                element={<TournamentViewerPage />}
                            />
                            <Route
                                path="/dashboard"
                                element={<Dashboard isDarkMode={isDarkMode} />}
                            />
                            <Route path="/profile" element={<UserProfile />} />
                            <Route path="/player" element={<Player />} />
                            {/* Any logged-in user can view a player's read-only profile */}
                            <Route path="/players/:id" element={<UserProfile />} />
                            {(loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN")) && (
                                <Route
                                    path="/players/:id/edit"
                                    element={<Player />}
                                />
                            )}
                            <Route path="/players" element={<Players />} />
                            <Route path="/player-statistics" element={<PlayerStatistics />} />
                            <Route path="/player-comparison" element={<PlayerComparison />} />
                            <Route path="/player-attendance" element={<PlayerAttendance />} />
                            <Route path="/hall-of-fame" element={<HallOfFame />} />
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
                            <Route
                                path="/fixtures/:matchId"
                                element={<MatchDetailsPage />}
                            />
                            <Route
                                path="/tournaments/team-chat/:tournamentId"
                                element={<TeamChatPage />}
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

                            {/* Resource Library */}
                            <Route path="resources" element={<ResourcesPage />} />
                            <Route path="resources/:slug" element={<ResourceDetailPage />} />

                            {/* Auction Routes */}
                            <Route path="auction" element={<AuctionHubPage />} />
                            <Route path="auction/register/:tournamentId" element={<AuctionRegistrationPage />} />
                            <Route path="auction/registrations/:tournamentId" element={<AuctionAdminApprovalPage />} />
                            <Route path="auction/settings/:tournamentId" element={<AuctionSettingsPage />} />
                            <Route path="auction/players/:tournamentId" element={<AuctionPlayerPoolPage />} />
                            <Route path="auction/team-budgets/:tournamentId" element={<AuctionTeamBudgetsPage />} />
                            <Route path="auction/live/:tournamentId" element={<LiveAuctionPage />} />
                            <Route path="auction/results/:tournamentId" element={<AuctionResultsPage />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                    </Suspense>
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
                        </div>
                        <AppFooter />
                    </div>
                </Content>
            </Layout>

            {/* Outside the Layout so it floats over the page rather than scrolling with it. Renders
                nothing unless the player is actually in an open room, and stands down on the chat's
                own full page so two live sockets never run on one subscription. */}
            {user?.token && <TeamChatDock />}

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
