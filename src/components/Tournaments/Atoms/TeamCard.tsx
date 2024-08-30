import React from "react";
import {
    Button,
    Card,
    Dropdown,
    Menu,
    Popconfirm,
    Space,
    Typography,
} from "antd";
import { Droppable, Draggable } from "react-beautiful-dnd";
import PlayerCard from "./PlayerCard";
import { Team } from "../tournamentTypes";
import { MoreOutlined } from "@ant-design/icons";

interface TeamCardProps {
    team: Team;
    handleRemovePlayer: (teamId: number, playerId: number) => void;
    handleRenameTeam: (teamId: number, newName: string) => void;
    handleRemoveTeam: (teamId: number, teamName: string) => void;
}

const TeamCard: React.FC<TeamCardProps> = ({
    team,
    handleRemovePlayer,
    handleRenameTeam,
    handleRemoveTeam,
}) => {
    const teamMenu = (
        <Menu>
            <Menu.Item
                onClick={() => handleRenameTeam(team.teamId, "New Name")}
            >
                Rename Team
            </Menu.Item>
            <Menu.Item>
                <Popconfirm
                    title="Delete the task"
                    description="Are you sure to delete this task?"
                    okText="Yes"
                    cancelText="No"
                    onConfirm={() =>
                        handleRemoveTeam(team.teamId, team.teamName)
                    }
                >
                    <Typography style={{ width: "100%" }}>
                        Remove Team
                    </Typography>
                </Popconfirm>
            </Menu.Item>
        </Menu>
    );

    return (
        <Droppable droppableId={team.teamId.toString()}>
            {(provided) => (
                <Card
                    hoverable
                    title={
                        <Dropdown overlay={teamMenu} trigger={["click"]}>
                            <Space
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                {team.teamName +
                                    "- (" +
                                    team.players.length +
                                    "*)"}
                                <Button
                                    onClick={(e) => e.preventDefault()}
                                    icon={<MoreOutlined />}
                                />
                            </Space>
                        </Dropdown>
                    }
                    bordered={true}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                        minWidth: "300px",
                        maxWidth: "400px",
                    }}
                >
                    <div
                        style={{ height: 300, overflow: "auto" }}
                        className="noscrollbar"
                    >
                        {team.players.map((player, index) => (
                            <Draggable
                                key={player.playerId.toString()}
                                draggableId={
                                    player.id
                                        ? player.playerId.toString() +
                                          "-" +
                                          player.id.toString()
                                        : player.playerId.toString()
                                }
                                index={index}
                            >
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        style={{
                                            padding: "4px",
                                            margin: "4px 0",
                                            backgroundColor: "#f0f0f0",
                                            borderRadius: "4px",
                                            ...provided.draggableProps.style,
                                        }}
                                    >
                                        <PlayerCard
                                            showOptions
                                            player={player}
                                            handleRemovePlayer={() =>
                                                handleRemovePlayer(
                                                    team.teamId,
                                                    player.playerId
                                                )
                                            }
                                            handleAddPosition={() => {}}
                                        />
                                    </div>
                                )}
                            </Draggable>
                        ))}

                        {provided.placeholder}
                    </div>
                </Card>
            )}
        </Droppable>
    );
};

export default TeamCard;
