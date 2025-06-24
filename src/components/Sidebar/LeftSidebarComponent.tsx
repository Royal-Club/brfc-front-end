import {
    BookOutlined,
  DollarOutlined,
  PieChartOutlined,
  ProjectOutlined,
  RadarChartOutlined,
  TrophyOutlined
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Layout, Menu, Typography } from "antd";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import companyLogo from "./../../assets/logo.png";

const { Sider } = Layout;
const { Title } = Typography;
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

// ];

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
  const loginInfo = useSelector(selectLoginInfo);
  const [isMobile, setIsMobile] = useState(false);

  const isUserAdmin = loginInfo.roles.includes("ADMIN");

  const items: MenuProps["items"] = [
    getItem("Dashboard", "/", <PieChartOutlined />),
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
      getItem("Tourtnaments", "/tournaments"),
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

  const onClick: MenuProps["onClick"] = (e) => {
    navigate(e.key);
    // Close sidebar on mobile after navigation
    if (isMobile) {
      onToggleCollapse(true);
    }
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
        }}
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
              transition: "all 0.2s ease-in-out",
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
          theme={isDarkMode ? "dark" : "light"}
        />
      </Sider>
    </>
  );
};

export default LeftSidebarComponent;
