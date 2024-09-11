import React, { useState } from "react";
import { Button, Dropdown, Menu } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import { IoTournamentSingleSummaryType } from "../../../state/features/tournaments/tournamentTypes";
import CreateTournament from "./CreateTournamentModal";

interface TournamentsActionDropdownProps {
    record: IoTournamentSingleSummaryType;
    onMenuClick: (e: any, record: IoTournamentSingleSummaryType) => void;
    tournamentId?: number;
}

const TournamentsActionDropdown: React.FC<TournamentsActionDropdownProps> = ({
    record,
    onMenuClick,
    tournamentId,
}) => {
    const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
    const handleSetIsUpdateModalVisible = (value: boolean) => {
        setIsUpdateModalVisible(value);
    };

    const handleMenuClick = (e: any) => {
        if (e?.key === "update") {
            console.log("update");
            handleSetIsUpdateModalVisible(true);
        }
        onMenuClick(e, record);
    };

    const menu = (
        <Menu onClick={handleMenuClick}>
            <Menu.Item key="join">Join Tournament</Menu.Item>
            <Menu.Item key="team-building">Team Building</Menu.Item>
            <Menu.Item key="update">Update Tournament</Menu.Item>
            <Menu.Item key="change-status">Change Tournament Status</Menu.Item>
        </Menu>
    );

    return (
        <>
            <Dropdown overlay={menu} trigger={["click"]}>
                <Button icon={<MoreOutlined />} />
            </Dropdown>

            <CreateTournament
                tournamentId={tournamentId}
                isUpdateModalVisible={isUpdateModalVisible}
                handleSetIsUpdateModalVisible={handleSetIsUpdateModalVisible}
                tournamentData={record}
            />
        </>
    );
};

export default TournamentsActionDropdown;
