import React from "react";
import { Button, Card, Dropdown, Menu, Space } from "antd";
import { Droppable, Draggable } from "react-beautiful-dnd";
import PlayerCard from "./PlayerCard";
import { Team } from "../tournamentTypes";
import { MoreOutlined } from "@ant-design/icons";

interface TeamCardProps {
    team: Team;
    handleRemovePlayer: (teamId: number, playerId: number) => void;
    handleRenameTeam: (teamId: number, newName: string) => void;
    handleRemoveTeam: (teamId: number) => void;
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
            <Menu.Item onClick={() => handleRemoveTeam(team.teamId)}>
                Remove Team
            </Menu.Item>
        </Menu>
    );

    return (
        <Droppable droppableId={team.teamId.toString()}>
            {(provided) => (
                <Card
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
                                {team.teamName}
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
                        minWidth: "250px",
                        maxWidth: "400px",
                        minHeight: "200px",
                        margin: "0 10px ",
                    }}
                >
                    {team.players.map((player, index) => (
                        <Draggable
                            key={player.playerId.toString()}
                            draggableId={player.playerId.toString()}
                            index={index}
                        >
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                        padding: "8px",
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
                </Card>
            )}
        </Droppable>
    );
};

export default TeamCard;
