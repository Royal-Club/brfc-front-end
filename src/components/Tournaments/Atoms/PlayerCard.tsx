import React from "react";
import { Button, Dropdown, Menu, Skeleton, Space, Tooltip, Badge } from "antd";
import { Player } from "../tournamentTypes";
import { MoreOutlined, CrownOutlined, EditOutlined } from "@ant-design/icons";

interface PlayerCardProps {
    player: Player;
    handleRemovePlayer?: () => void;
    handleAddPosition?: () => void;
    handleRemovePosition?: () => void;
    handleEditDetails?: () => void;
    handleToggleCaptain?: () => void;
    showOptions?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
    player,
    handleRemovePlayer,
    handleAddPosition,
    handleRemovePosition,
    handleEditDetails,
    handleToggleCaptain,
    showOptions = false,
}) => {
    const playerMenu = (
        <Menu>
            {handleEditDetails && (
                <Menu.Item onClick={handleEditDetails} icon={<EditOutlined />}>
                    Edit Details
                </Menu.Item>
            )}
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
            {handleToggleCaptain && (
                <Menu.Item
                    onClick={handleToggleCaptain}
                    icon={<CrownOutlined />}
                >
                    {player.isCaptain ? "Remove Captain" : "Make Captain"}
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
                        <Space>
                            {player.jerseyNumber && (
                                <Badge
                                    count={player.jerseyNumber}
                                    style={{
                                        backgroundColor: "#1890ff",
                                        fontWeight: "bold",
                                    }}
                                />
                            )}
                            {player.isCaptain && (
                                <Tooltip title="Captain">
                                    <CrownOutlined
                                        style={{
                                            color: "#faad14",
                                            fontSize: "16px",
                                        }}
                                    />
                                </Tooltip>
                            )}
                            {player?.playerName
                                ? player?.playerName
                                : "processing..."}
                        </Space>
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
                <Space>
                    {player.jerseyNumber && (
                        <Badge
                            count={player.jerseyNumber}
                            style={{
                                backgroundColor: "#1890ff",
                                fontWeight: "bold",
                            }}
                        />
                    )}
                    {player.isCaptain && (
                        <Tooltip title="Captain">
                            <CrownOutlined
                                style={{
                                    color: "#faad14",
                                    fontSize: "16px",
                                }}
                            />
                        </Tooltip>
                    )}
                    {player.playerName}
                </Space>
            )}
        </>
    );
};

export default PlayerCard;
