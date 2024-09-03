import {
  ApartmentOutlined,
  DollarOutlined,
  PieChartOutlined,
  PlayCircleOutlined,
  ProjectOutlined,
  RadarChartOutlined,
  SettingOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Layout, Menu } from "antd";
import React from "react";
import { useNavigate } from "react-router-dom";
const { Header, Content, Sider } = Layout;
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
    getItem("Finance Setup", "/finance"),
    getItem("Finance List", "/finances"),
    getItem("Cost Type", "CostTypeSubMenu", null, [
      getItem("Cost Type", "/company"),
      getItem("Cost Type List", "/companies"),
    ]),

    getItem("Income", "IncomeSubMenu", null, [
      getItem("Income", "/company"),
      getItem("Income List", "/companies"),
    ]),
    getItem("Match Schedule", "matchScheduleSubMenu", <ProjectOutlined />, [
      getItem("Match Schedule", "/venue/match-schedule"),
      getItem("Match Schedule List", "/venues/match-schedule-list"),
    ]),
    getItem("Game Planner", "gameSubMenu", <PlayCircleOutlined />, [
      getItem("Match Participant", "/match-participant"),
      getItem("Match List", "/matches"),
    ]),
    getItem("Tournaments", "tournamentSubMenu", <TrophyOutlined />, [
      getItem("Tourtnaments", "/tournaments"),
    ]),
    getItem("Finance Summary", "/finances"),
  ]),
  getItem("Venue", "venueSubMenu", <ProjectOutlined />, [
    getItem("Venues", "/venues"),
  ]),
  getItem("Mach Schedule", "matchScheduleSubMenu", <ProjectOutlined />, [
    getItem("Mach Schedule", "/venue"),
    getItem("Mach Schedule List", "/venues"),
  ]),
  getItem("Game Planner", "gameSubMenu", <PlayCircleOutlined />, [
    getItem("Match Participant", "/match-participant"),
    getItem("Match List", "/matches"),
  ]),
  getItem("Tournaments", "tournamentSubMenu", <TrophyOutlined />, [
    getItem("Tourtnaments", "/tournaments"),
  ]),
];
interface LeftSidebarComponentProps {
  collapsed: boolean;
  onToggleCollapse: (value: boolean) => void;
}
const LeftSidebarComponent: React.FC<LeftSidebarComponentProps> = ({
  collapsed,
  onToggleCollapse,
}) => {
  const navigate = useNavigate();

  const onClick: MenuProps["onClick"] = (e) => {
    navigate(e.key);
  };

  return (
    <>
      <Sider
        width={260}
        theme="light"
        breakpoint="lg"
        onBreakpoint={(broken: any) => {
          // console.log("broken", broken);
        }}
        onCollapse={(collapsed: any, type: any) => {
          onToggleCollapse(collapsed);
        }}
        trigger={null}
        collapsible
        collapsed={collapsed}
      >
        <div className="demo-logo-vertical">
          {/* <img src={companyLogo} alt="" /> */}
        </div>
        <Menu
          onClick={onClick}
          defaultSelectedKeys={["/"]}
          defaultOpenKeys={["invsum"]}
          mode="inline"
          items={items}
          style={{ height: "100%", borderRight: 0 }}
        />
      </Sider>
    </>
  );
};

export default LeftSidebarComponent;
