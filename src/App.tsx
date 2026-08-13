import { Layout, ConfigProvider, theme, Button } from "antd";
import { useLayoutEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import "./styles/toastStyles.css";
import ContentComponent from "./components/Content/ContentComponent";
import LeftSidebarComponent from "./components/Sidebar/LeftSidebarComponent";
import TournamentViewerPage from "./components/TournamentViewer/TournamentViewerPage";
import { useAuthHook } from "./hooks/useAuthHook";
import { checkTockenValidity } from "./utils/utils";
import LoginPage from "./components/authPages/LoginPage";
import PasswordResetPage from "./components/authPages/PasswordResetPage";
import ForgotPasswordPage from "./components/authPages/ForgotPasswordPage";
import PasswordResetLinkPage from "./components/authPages/PasswordResetLinkPage";
import { useSelector } from "react-redux";
import { selectResetPassword } from "./state/slices/loginInfoSlice";
import { AuctionRegistrationPage } from "./components/Auction";
import RsvpPage from "./components/Rsvp/RsvpPage";
import AppFooter from "./components/CommonAtoms/AppFooter";
import { club } from "./theme/clubTheme";

function App() {
    const [collapsed, setCollapsed] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);

    const { login, user, clearSession } = useAuthHook();
    const needsPasswordReset = useSelector(selectResetPassword);
    const location = useLocation();

    const handleToggleCollapse = (value: boolean) => {
        setCollapsed(value);
    };

    useLayoutEffect(() => {
        const tokenContent = localStorage.getItem("tokenContent");
        if (tokenContent && checkTockenValidity(tokenContent)) {
            login(tokenContent);
        } else {
            // An expired token has to be cleared, not just left unloaded. redux-persist has already
            // rehydrated loginInfo from a previous visit, and every auth branch below keys off
            // user.token - so leaving the dead token in the store renders the whole app as if
            // signed in, and its first API call 401s straight back to here.
            clearSession();
        }

        localStorage.getItem("isDarkMode") === "false"
            ? setIsDarkMode(false)
            : setIsDarkMode(true);
    }, []);

    // Public route: RSVP confirmation from an invitation/reminder email.
    // Checked before the auth branches because the link must work whether or not the
    // member happens to be logged in — the signed token in the URL is the credential.
    if (location.pathname.startsWith("/rsvp")) {
        return (
            <ConfigProvider
                theme={{
                    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
                    token: { colorPrimary: isDarkMode ? club.gold : club.navy },
                }}
            >
                <Layout className={isDarkMode ? "dark-mode" : "light-mode"} style={{ minHeight: "100vh" }}>
                    <Routes>
                        <Route path="/rsvp" element={<RsvpPage />} />
                    </Routes>
                </Layout>
            </ConfigProvider>
        );
    }

    // Public routes: emailed password recovery. Checked before the auth branches for the same
    // reason as /rsvp — someone who cannot sign in has to reach these, and a stale session must
    // not swallow the reset link either. Note /password-reset is the emailed-link page and is a
    // different thing from PasswordResetPage below, which is the forced change after a login.
    const isPasswordRecoveryRoute =
        location.pathname.startsWith("/forgot-password") ||
        location.pathname.startsWith("/password-reset");

    if (isPasswordRecoveryRoute) {
        return (
            <ConfigProvider
                theme={{
                    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
                }}
            >
                <Layout className={isDarkMode ? "dark-mode" : "light-mode"} style={{ minHeight: "100vh" }}>
                    <Routes>
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/password-reset" element={<PasswordResetLinkPage />} />
                    </Routes>
                </Layout>
            </ConfigProvider>
        );
    }

    // Public route: Auction Registration (no login required)
    const isPublicAuctionRoute = location.pathname.startsWith("/auction/register/");

    if (!user?.token && isPublicAuctionRoute) {
        return (
            <ConfigProvider
                theme={{
                    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
                    token: { colorPrimary: "#1890ff" },
                }}
            >
                <Layout className={isDarkMode ? "dark-mode" : "light-mode"} style={{ minHeight: "100vh" }}>
                    <Routes>
                        <Route path="auction/register/:tournamentId" element={<AuctionRegistrationPage />} />
                    </Routes>
                </Layout>
            </ConfigProvider>
        );
    }

    if (!user?.token) {
        return (
            <ConfigProvider
                theme={{
                    algorithm: isDarkMode
                        ? theme.darkAlgorithm
                        : theme.defaultAlgorithm,
                }}
            >
                <Layout
                    className={isDarkMode ? "dark-mode" : "light-mode"}
                    style={{ minHeight: "100vh" }}
                >
                    <ToastContainer
                        theme={isDarkMode ? "dark" : "light"}
                        position="top-right"
                        autoClose={3000}
                        hideProgressBar={false}
                        newestOnTop={true}
                        closeOnClick={true}
                        pauseOnHover={true}
                        draggable={true}
                    />
                    {location.pathname !== "/login" && (
                        <div style={{ position: "fixed", top: 12, right: 12, zIndex: 1200 }}>
                            <Link to="/login">
                                {/* <Button type="primary">Login</Button> */}
                            </Link>
                        </div>
                    )}
                    <div style={{ flex: 1 }}>
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="*" element={<TournamentViewerPage hasHeader={false} />} />
                        </Routes>
                    </div>
                    <AppFooter />
                </Layout>
            </ConfigProvider>
        );
    }

    if (needsPasswordReset) {
        return (
            <Layout className={isDarkMode ? "dark-mode" : "light-mode"}>
                <ToastContainer
                    theme={isDarkMode ? "dark" : "light"}
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={true}
                    closeOnClick={true}
                    pauseOnHover={true}
                    draggable={true}
                />
                <PasswordResetPage />
            </Layout>
        );
    }

    return (
        <ConfigProvider
            theme={{
                algorithm: isDarkMode
                    ? theme.darkAlgorithm
                    : theme.defaultAlgorithm,
                token: {
                    // Basic colors — club brand primary (champagne gold reads on the
                    // dark UI, deep navy reads on the light UI). Text on solid brand
                    // fills flips so gold buttons get dark text and navy buttons white.
                    colorPrimary: isDarkMode ? club.gold : club.navy,
                    colorTextLightSolid: isDarkMode ? club.navyDeep : "#ffffff",
                    colorLink: isDarkMode ? club.goldSoft : club.navy,
                    colorLinkHover: isDarkMode ? club.gold : club.navySoft,
                    colorBgContainer: isDarkMode ? "#141414" : "#ffffff",
                    colorText: isDarkMode ? "#ffffff" : "#000000",
                    colorTextSecondary: isDarkMode ? "#a6a6a6" : "#595959",

                    // Layout
                    colorBgLayout: isDarkMode ? "#000000" : "#f0f2f5",

                    // Modal
                    colorBgMask: "rgba(0, 0, 0, 0.45)",
                    colorBgElevated: isDarkMode ? "#1f1f1f" : "#ffffff",

                    // Border
                    colorBorder: isDarkMode ? "#303030" : "#d9d9d9",
                    colorBorderSecondary: isDarkMode ? "#303030" : "#f0f0f0",

                    // Other
                    colorFillSecondary: isDarkMode ? "#2a2a2a" : "#f5f5f5",
                    colorFillTertiary: isDarkMode ? "#3a3a3a" : "#fafafa",
                    colorFillQuaternary: isDarkMode ? "#4a4a4a" : "#f0f0f0",
                },
                components: {
                    Typography: {
                        colorTextHeading: isDarkMode ? "#ffffff" : "#000000",
                        colorTextSecondary: isDarkMode ? "#a6a6a6" : "#595959",
                        colorText: isDarkMode ? "#ffffff" : "#000000",
                    },
                    Menu: {
                        // Dark sidebar — club navy panel with clearly readable
                        // light text and a gold "selected" pill (navy text on gold).
                        darkItemBg: club.navyDeep,
                        darkSubMenuItemBg: "#0A1526",
                        darkPopupBg: club.navy,
                        darkItemColor: "rgba(245, 247, 250, 0.78)",
                        darkItemHoverColor: "#ffffff",
                        darkItemHoverBg: "rgba(198, 161, 91, 0.14)",
                        darkItemSelectedBg: club.gold,
                        darkItemSelectedColor: club.navyDeep,
                        darkGroupTitleColor: "rgba(245, 247, 250, 0.45)",
                        darkItemDisabledColor: "rgba(245, 247, 250, 0.28)",
                        // Light sidebar counterpart.
                        itemColor: "rgba(20, 33, 61, 0.85)",
                        itemHoverColor: club.navy,
                        itemHoverBg: "rgba(20, 33, 61, 0.06)",
                        itemSelectedBg: "rgba(198, 161, 91, 0.18)",
                        itemSelectedColor: club.navy,
                    },
                    Button: {
                        colorPrimary: isDarkMode ? club.gold : club.navy,
                        colorPrimaryHover: isDarkMode ? club.goldSoft : club.navySoft,
                        colorPrimaryActive: isDarkMode ? club.gold : club.navyDeep,
                    },
                    Input: {
                        colorBgContainer: isDarkMode ? "#1f1f1f" : "#ffffff",
                        colorBorder: isDarkMode ? "#434343" : "#d9d9d9",
                        colorText: isDarkMode ? "#ffffff" : "#000000",
                    },
                    Table: {
                        colorBgContainer: isDarkMode ? "#1f1f1f" : "#ffffff",
                        colorText: isDarkMode ? "#ffffff" : "#000000",
                        colorTextHeading: isDarkMode ? "#ffffff" : "#000000",
                    },
                },
            }}
        >
            <Layout className={isDarkMode ? "dark-mode" : "light-mode"}>
                <ToastContainer
                    theme={isDarkMode ? "dark" : "light"}
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={true}
                    closeOnClick={true}
                    pauseOnHover={true}
                    draggable={true}
                />
                {user?.token && (
                    <LeftSidebarComponent
                        collapsed={collapsed}
                        onToggleCollapse={handleToggleCollapse}
                        isDarkMode={isDarkMode}
                    />
                )}
                <ContentComponent
                    collapsed={collapsed}
                    onToggleCollapse={handleToggleCollapse}
                    setIsDarkMode={setIsDarkMode}
                    isDarkMode={isDarkMode}
                />
            </Layout>
        </ConfigProvider>
    );
}

export default App;
