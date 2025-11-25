import { Layout, ConfigProvider, theme } from "antd";
import { useLayoutEffect, useState } from "react";
import "./App.css";
import ContentComponent from "./components/Content/ContentComponent";
import LeftSidebarComponent from "./components/Sidebar/LeftSidebarComponent";
import { useAuthHook } from "./hooks/useAuthHook";
import { checkTockenValidity } from "./utils/utils";
import LoginPage from "./components/authPages/LoginPage";
import PasswordResetPage from "./components/authPages/PasswordResetPage";
import { useSelector } from "react-redux";
import { selectResetPassword } from "./state/slices/loginInfoSlice";

function App() {
    const [collapsed, setCollapsed] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);

    const { login, user } = useAuthHook();
    const needsPasswordReset = useSelector(selectResetPassword);

    const handleToggleCollapse = (value: boolean) => {
        setCollapsed(value);
    };

    useLayoutEffect(() => {
        const tokenContent = localStorage.getItem("tokenContent");
        if (tokenContent && checkTockenValidity(tokenContent)) {
            login(tokenContent);
        }

        localStorage.getItem("isDarkMode") === "false"
            ? setIsDarkMode(false)
            : setIsDarkMode(true);
    }, []);

    if (!user?.token) {
        return (
            <Layout>
                <LoginPage />
            </Layout>
        );
    }

    if (needsPasswordReset) {
        return (
            <Layout>
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
                    // Basic colors
                    colorPrimary: isDarkMode ? "#1890ff" : "#1890ff",
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
                        colorItemBg: isDarkMode ? "#141414" : "#ffffff",
                        colorSubItemBg: isDarkMode ? "#000000" : "#fafafa",
                        colorItemBgActive: isDarkMode ? "#177ddc" : "#e6f7ff",
                        colorItemBgHover: isDarkMode ? "#177ddc" : "#f5f5f5",
                    },
                    Button: {
                        colorPrimary: isDarkMode ? "#1890ff" : "#1890ff",
                        colorPrimaryHover: isDarkMode ? "#40a9ff" : "#40a9ff",
                        colorPrimaryActive: isDarkMode ? "#096dd9" : "#096dd9",
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
            <Layout>
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
