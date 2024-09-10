import {
    DollarOutlined,
    PieChartOutlined,
    PlayCircleOutlined,
    ProjectOutlined,
    RadarChartOutlined,
    TrophyOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Layout, Menu, Typography } from "antd";
import React from "react";
import { useNavigate } from "react-router-dom";
import companyLogo from "./../../assets/logo.png";

const { Sider } = Layout;
const { Title } = Typography;
type MenuItem = Required<MenuProps>["items"][number];
function getItem(
    label: React.ReactNode,
    key: React.Key,
    icon?: React.ReactNode,
    children?: MenuItem[],
    type?: "group"
): MenuItem {
    return {
        key,
        icon,
        children,
        label,
        type,
    } as MenuItem;
}

const items: MenuProps["items"] = [
    getItem("Dashboard", "/", <PieChartOutlined />),
    getItem("Player", "setupSubMenu", <RadarChartOutlined />, [
        getItem("Player Registration", "/player"),
        getItem("Player List", "/players"),
    ]),
    getItem("Finance", "financeSubMenu", <DollarOutlined />, [
        getItem("Configuration", "ConfigurationSubMenu", null, [
            getItem("Voucher Types", "/ac/voucher-types"),
            getItem("AC Natures", "/ac/natures"),
            getItem("Chart of Account", "/ac/charts"),
        ]),
        getItem("Income (+)", "IncomeSubMenu", null, [
            getItem("Collections", "/ac/collections"),
            // getItem("Collections Register", "/ac/collections-register"),
        ]),
        // getItem("Expense (-)", "ExpenseSubMenu", null, [
        //     getItem("Expense", "/company"),
        //     getItem("Expense List", "/companies"),
        // ]),
    ]),
    getItem("Venue", "venueSubMenu", <ProjectOutlined />, [
        getItem("Venues", "/venues"),
    ]),
    // getItem("Mach Schedule", "matchScheduleSubMenu", <ProjectOutlined />, [
    //     getItem("Mach Schedule", "/venue"),
    //     getItem("Mach Schedule List", "/venues"),
    // ]),
    // getItem("Game Planner", "gameSubMenu", <PlayCircleOutlined />, [
    //     getItem("Match Participant", "/match-participant"),
    //     getItem("Match List", "/matches"),
    // ]),
    getItem("Tournaments", "tournamentSubMenu", <TrophyOutlined />, [
        getItem("Tourtnaments", "/tournaments"),
    ]),
];
interface LeftSidebarComponentProps {
    collapsed: boolean;
    onToggleCollapse: (value: boolean) => void;
    isDarkMode: boolean;
}
const LeftSidebarComponent: React.FC<LeftSidebarComponentProps> = ({
    collapsed,
    onToggleCollapse,
    isDarkMode, // New prop for dark mode
}) => {
    const navigate = useNavigate();

    const onClick: MenuProps["onClick"] = (e) => {
        navigate(e.key);
    };

    return (
        <>
            <Sider
                width={260}
                theme={isDarkMode ? "dark" : "light"} // Change theme based on dark mode
                breakpoint="lg"
                onBreakpoint={(broken: any) => {
                    // handle breakpoint
                }}
                onCollapse={(collapsed: any, type: any) => {
                    onToggleCollapse(collapsed);
                }}
                style={{ height: "100vh" }}
                trigger={null}
                collapsible
                collapsed={collapsed}
            >
                <div
                    className="demo-logo-vertical"
                    onClick={() => navigate("/")}
                    style={{
                        cursor: "pointer",
                    }}
                >
                    <img src={companyLogo} alt="" />
                    <Title
                        level={2}
                        style={{
                            margin: collapsed ? "0px" : "0 80px 0 10px",
                            fontSize: collapsed ? "0px" : "32px",
                        }}
                    >
                        BRFC
                    </Title>
                </div>
                <Menu
                    onClick={onClick}
                    defaultSelectedKeys={["/"]}
                    items={items}
                    mode="inline"
                    style={{
                        borderRight: 0,
                        height: "calc(100vh - 64px)",
                        overflow: "auto",
                    }}
                    theme={isDarkMode ? "dark" : "light"} // Apply dark theme
                />
            </Sider>
        </>
    );
};

export default LeftSidebarComponent;
