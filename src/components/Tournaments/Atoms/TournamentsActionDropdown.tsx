import React from "react";
import { Button, Dropdown, Menu } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import { IoTournamentSingleSummaryType } from "../../../state/features/tournaments/tournamentTypes";

interface TournamentsActionDropdownProps {
  record: IoTournamentSingleSummaryType;
  onMenuClick: (e: any, record: IoTournamentSingleSummaryType) => void;
}

const TournamentsActionDropdown: React.FC<TournamentsActionDropdownProps> = ({ record, onMenuClick }) => {
  const menu = (
    <Menu onClick={(e) => onMenuClick(e, record)}>
      <Menu.Item key="view">View</Menu.Item>
      <Menu.Item key="edit">Edit</Menu.Item>
      <Menu.Item key="delete">Delete</Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={["click"]}>
      <Button icon={<MoreOutlined />} />
    </Dropdown>
  );
};

export default TournamentsActionDropdown;
