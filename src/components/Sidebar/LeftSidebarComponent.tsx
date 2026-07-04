import {
    BookOutlined,
    DollarOutlined,
    EyeOutlined,
    LogoutOutlined,
    PieChartOutlined,
    ProjectOutlined,
    RadarChartOutlined,
    TrophyOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar, Button, Layout, Menu, Modal, theme, Tooltip, Typography } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthHook } from "../../hooks/useAuthHook";
import { selectLoginInfo, selectUserImage } from "../../state/slices/loginInfoSlice";
import companyLogo from "./../../assets/logo.png";

const { Sider } = Layout;
const { Title, Text } = Typography;
type MenuItem = Required<MenuProps>["items"][number];
function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: "group",
  disabled?: boolean
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
    disabled,
  } as MenuItem;
}

/**
 * Maps a leaf route path to the submenu key(s) that must be open for that
 * route to be visible in the inline menu. Nested routes list every ancestor
 * (outermost first) so the whole branch expands on a deep link.
 */
const ROUTE_ANCESTORS: Record<string, string[]> = {
  "/player": ["setupSubMenu"],
  "/players": ["setupSubMenu"],
  "/player-statistics": ["setupSubMenu"],
  "/ac/voucher-types": ["financeSubMenu", "ConfigurationSubMenu"],
  "/ac/natures": ["financeSubMenu", "ConfigurationSubMenu"],
  "/ac/charts": ["financeSubMenu", "ConfigurationSubMenu"],
  "/ac/collections": ["financeSubMenu"],
  "/ac/bill-payments": ["financeSubMenu"],
  "/ac/vouchers": ["financeSubMenu", "VoucherSubMenu"],
  "/ac/reports/accounts-summary": ["financeSubMenu", "acReportsSubMenu"],
  "/ac/reports/balance-summary": ["financeSubMenu", "acReportsSubMenu"],
  "/ac/reports/balance-sheet": ["financeSubMenu", "acReportsSubMenu"],
  "/venues": ["venueSubMenu"],
  "/tournaments": ["tournamentSubMenu"],
};

const getAncestorKeys = (pathname: string): string[] => ROUTE_ANCESTORS[pathname] ?? [];

interface LeftSidebarComponentProps {
  collapsed: boolean;
  onToggleCollapse: (value: boolean) => void;
  isDarkMode: boolean;
}

const LeftSidebarComponent: React.FC<LeftSidebarComponentProps> = ({
  collapsed,
  onToggleCollapse,
  isDarkMode,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const loginInfo = useSelector(selectLoginInfo);
  const userImage = useSelector(selectUserImage);
  const { logout } = useAuthHook();
  const {
    token: { colorBorderSecondary, colorFillTertiary },
  } = theme.useToken();

  // Root path renders the Dashboard, so highlight the Dashboard item there.
  const selectedKey =
    location.pathname === "/" ? "/dashboard" : location.pathname;
  const [isMobile, setIsMobile] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>(() =>
    getAncestorKeys(selectedKey)
  );

  const isUserAdmin =
    loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN");

  const items: MenuProps["items"] = [
    getItem("Dashboard", "/dashboard", <PieChartOutlined />),
    getItem("Match Center", "/tournament-viewer", <EyeOutlined />),
    getItem("Player", "setupSubMenu", <RadarChartOutlined />, [
      getItem(
        "Player Registration",
        "/player",
        null,
        undefined,
        undefined,
        !isUserAdmin
      ),
      getItem("Player List", "/players"),
      getItem("Player Statistics", "/player-statistics"),
    ]),
    getItem("Finance", "financeSubMenu", <DollarOutlined />, [
      getItem("Configuration", "ConfigurationSubMenu", null, [
        getItem("Voucher Types", "/ac/voucher-types"),
        getItem("AC Natures", "/ac/natures"),
        getItem("Chart of Account", "/ac/charts"),
      ]),
      getItem("Collections (+)", "/ac/collections"),
      getItem("Bill Payment (-)", "/ac/bill-payments"),
      getItem("Voucher", "VoucherSubMenu", null, [
        getItem("Voucher Register", "/ac/vouchers"),
      ]),
      getItem("Accounts Reports", "acReportsSubMenu", null, [
        getItem("Accounts Report", "/ac/reports/accounts-summary"),
        getItem("Balances Summary", "/ac/reports/balance-summary"),
        getItem("Balances Sheet", "/ac/reports/balance-sheet"),
      ]),
    ]),
    getItem("Venue", "venueSubMenu", <ProjectOutlined />, [
      getItem("Venues", "/venues"),
    ]),
    getItem("Tournaments", "tournamentSubMenu", <TrophyOutlined />, [
      getItem("Tournaments", "/tournaments"),
    ]),
    getItem("Club Rules", "/club-rules", <BookOutlined />),
  ];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reveal the active branch on navigation without collapsing anything the
  // user opened manually.
  useEffect(() => {
    const ancestors = getAncestorKeys(selectedKey);
    if (ancestors.length === 0) return;
    setOpenKeys((prev) =>
      Array.from(new Set([...prev, ...ancestors]))
    );
  }, [selectedKey]);

  const onClick: MenuProps["onClick"] = (e) => {
    navigate(e.key);
    // Close sidebar on mobile after navigation
    if (isMobile) {
      onToggleCollapse(true);
    }
  };

  const onOpenChange: MenuProps["onOpenChange"] = (keys) => {
    setOpenKeys(keys as string[]);
  };

  const roleLabel = useMemo(
    () => loginInfo?.roles?.filter(Boolean).join(", ") || "User",
    [loginInfo?.roles]
  );

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

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && !collapsed && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
          onClick={() => onToggleCollapse(true)}
        />
      )}

      <Sider
        width={260}
        theme={isDarkMode ? "dark" : "light"}
        breakpoint="lg"
        onBreakpoint={(broken: any) => {
          // Auto collapse on mobile
          if (broken && !collapsed) {
            onToggleCollapse(true);
          }
        }}
        onCollapse={(collapsed: any, type: any) => {
          onToggleCollapse(collapsed);
        }}
        style={{
          height: "100vh",
          position: isMobile ? 'fixed' : 'relative',
          left: isMobile && collapsed ? '-260px' : '0',
          zIndex: isMobile ? 1000 : 'auto',
          transition: isMobile ? 'left 0.2s ease-in-out' : 'all 0.2s ease-in-out',
          // Match the menu's navy so logo + nav + footer read as one panel.
          background: isDarkMode ? "#0E1830" : undefined,
        }}
        trigger={null}
        collapsible
        collapsed={collapsed}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          {/* Logo — fixed 64px to align with the header row */}
          <div
            className="demo-logo-vertical"
            onClick={() => navigate("/")}
            style={{
              cursor: "pointer",
              height: 64,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: 10,
              padding: collapsed ? "0" : "0 16px",
              margin: 0,
            }}
          >
            <img src={companyLogo} alt="BRFC" />
            {!collapsed && (
              <Title level={2} style={{ margin: 0, fontSize: 32 }}>
                BRFC
              </Title>
            )}
          </div>

          {/* Navigation */}
          <Menu
            onClick={onClick}
            selectedKeys={[selectedKey]}
            openKeys={collapsed ? [] : openKeys}
            onOpenChange={onOpenChange}
            items={items}
            mode="inline"
            style={{
              borderRight: 0,
              flex: 1,
              minHeight: 0,
              overflow: "auto",
            }}
            theme={isDarkMode ? "dark" : "light"}
          />

          {/* Account footer */}
          <div
            style={{
              flexShrink: 0,
              borderTop: `1px solid ${colorBorderSecondary}`,
              padding: collapsed ? "12px 0" : "12px 16px",
              display: "flex",
              flexDirection: collapsed ? "column" : "row",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "space-between",
              gap: collapsed ? 8 : 12,
            }}
          >
            <div
              onClick={() => {
                navigate("/profile");
                if (isMobile) onToggleCollapse(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                minWidth: 0,
                flex: collapsed ? "unset" : 1,
              }}
            >
              <Tooltip title={collapsed ? loginInfo?.username : ""} placement="right">
                <Avatar src={userImage} alt={loginInfo?.username} size={collapsed ? 32 : 36} />
              </Tooltip>
              {!collapsed && (
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <Text strong ellipsis style={{ fontSize: 14, lineHeight: "18px" }}>
                    {loginInfo?.username || "User"}
                  </Text>
                  <Text
                    type="secondary"
                    ellipsis
                    style={{ fontSize: 12, lineHeight: "16px" }}
                  >
                    {roleLabel}
                  </Text>
                </div>
              )}
            </div>

            <Tooltip title="Logout" placement={collapsed ? "right" : "top"}>
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={confirmLogout}
                aria-label="Logout"
                style={{
                  color: "#ff4d4f",
                  flexShrink: 0,
                  background: collapsed ? "transparent" : colorFillTertiary,
                }}
              />
            </Tooltip>
          </div>
        </div>
      </Sider>
    </>
  );
};

export default LeftSidebarComponent;
