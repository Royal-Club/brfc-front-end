import React from "react";
import { Button, Dropdown, Menu, Space } from "antd";
import { Player } from "../tournamentTypes";
import { MoreOutlined } from "@ant-design/icons";

interface PlayerCardProps {
    player: Player;
    handleRemovePlayer?: () => void;
    handleAddPosition?: () => void;
    showOptions?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
    player,
    handleRemovePlayer,
    handleAddPosition,
    showOptions = false,
}) => {
    const playerMenu = (
        <Menu>
            <Menu.Item onClick={handleRemovePlayer}>Remove Player</Menu.Item>
            <Menu.Item onClick={handleAddPosition}>Add Position</Menu.Item>
        </Menu>
    );

    return (
        <Dropdown overlay={playerMenu} trigger={["click"]}>
            <Space
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {player.playerName}
                {showOptions && (
                    <Button
                        onClick={(e) => e.preventDefault()}
                        icon={<MoreOutlined />}
                    />
                )}
            </Space>
        </Dropdown>
    );
};

export default PlayerCard;
