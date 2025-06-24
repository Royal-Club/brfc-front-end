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
  const [isTablet, setIsTablet] = useState(false);

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
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1024;
      
      setIsMobile(mobile);
      setIsTablet(tablet);
      
      // Auto-collapse on mobile and tablet
      if (mobile || tablet) {
        onToggleCollapse(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [onToggleCollapse]);

  const onClick: MenuProps["onClick"] = (e) => {
    navigate(e.key);
    // Close sidebar on mobile/tablet after navigation
    if (isMobile || isTablet) {
      onToggleCollapse(true);
    }
  };

  return (
    <>
      {/* Mobile/Tablet overlay */}
      {(isMobile || isTablet) && !collapsed && (
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
        width={isMobile ? 240 : 260}
        theme={isDarkMode ? "dark" : "light"}
        breakpoint="lg"
        onBreakpoint={(broken: any) => {
          if (broken && !collapsed) {
            onToggleCollapse(true);
          }
        }}
        onCollapse={(collapsed: any, type: any) => {
          onToggleCollapse(collapsed);
        }}
        style={{
          height: "100vh",
          position: (isMobile || isTablet) ? 'fixed' : 'relative',
          left: (isMobile || isTablet) && collapsed ? '-260px' : '0',
          zIndex: (isMobile || isTablet) ? 1000 : 'auto',
          transition: (isMobile || isTablet) ? 'left 0.2s ease-in-out' : 'all 0.2s ease-in-out',
          overflow: 'hidden',
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
            padding: isMobile ? '12px' : '16px',
          }}
        >
          <img 
            src={companyLogo} 
            alt="" 
            style={{
              height: isMobile ? '28px' : '32px',
              objectFit: 'contain'
            }}
          />
          <Title
            level={2}
            style={{
              margin: collapsed ? "0px" : `0 ${isMobile ? '60px' : '80px'} 0 10px`,
              fontSize: collapsed ? "0px" : isMobile ? "28px" : "32px",
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
            fontSize: isMobile ? '14px' : '16px'
          }}
          theme={isDarkMode ? "dark" : "light"}
          inlineIndent={isMobile ? 16 : 24}
        />
      </Sider>
    </>
  );
};

export default LeftSidebarComponent;
