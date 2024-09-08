import React from "react";
import { Button, Dropdown, Menu, Skeleton, Space, Tooltip } from "antd";
import { Player } from "../tournamentTypes";
import { MoreOutlined } from "@ant-design/icons";

interface PlayerCardProps {
    player: Player;
    handleRemovePlayer?: () => void;
    handleAddPosition?: () => void;
    handleRemovePosition?: () => void;
    showOptions?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
    player,
    handleRemovePlayer,
    handleAddPosition,
    handleRemovePosition,
    showOptions = false,
}) => {
    const playerMenu = (
        <Menu>
            <Menu.Item onClick={handleRemovePlayer}>Remove Player</Menu.Item>
            {player.playingPosition === "GOALKEEPER" ? (
                <Menu.Item onClick={handleRemovePosition}>
                    Remove from Goalkeeper
                </Menu.Item>
            ) : (
                <Menu.Item onClick={handleAddPosition}>
                    Make Goalkeeper
                </Menu.Item>
            )}
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
                        {player?.playerName
                            ? player?.playerName
                            : "processing..."}
                        <Space>
                            {player.playingPosition === "GOALKEEPER" && (
                                <Tooltip title="Goalkeeper">
                                    <img
                                        src={require("./../../../assets/red-gloves.png")}
                                        alt="goalkeeper"
                                        style={{ width: "20px" }}
                                    />
                                </Tooltip>
                            )}
                            <Button
                                onClick={(e) => e.preventDefault()}
                                icon={<MoreOutlined />}
                            />
                        </Space>
                    </Space>
                </Dropdown>
            ) : (
                <Space>{player.playerName}</Space>
            )}
        </>
    );
};

export default PlayerCard;
