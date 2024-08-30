import React from "react";
import { Button, Dropdown, Menu, Space, Tooltip } from "antd";
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
            <Menu.Item onClick={handleAddPosition}>Make Goalkeeper</Menu.Item>
        </Menu>
    );

    return (
        <>
            {showOptions ? (
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
                        {player.playingPosition === "GOALKEEPER" && (
                            <Tooltip title="Goalkeeper">
                                <img
                                    src={require("./../../../assets/red-gloves.png")}
                                    alt="goalkeeper"
                                    style={{ width: "20px" }}
                                />
                            </Tooltip>
                        )}
                        {showOptions && (
                            <Button
                                onClick={(e) => e.preventDefault()}
                                icon={<MoreOutlined />}
                            />
                        )}
                    </Space>
                </Dropdown>
            ) : (
                <Space>{player.playerName}</Space>
            )}
        </>
    );
};

export default PlayerCard;
