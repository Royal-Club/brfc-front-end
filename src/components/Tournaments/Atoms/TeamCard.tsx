import React from "react";
import {
    Button,
    Card,
    Dropdown,
    Menu,
    Popconfirm,
    Space,
    Typography,
    Skeleton,
    theme,
} from "antd";
import { Droppable, Draggable } from "react-beautiful-dnd";
import PlayerCard from "./PlayerCard";
import { Team } from "../tournamentTypes";
import { MoreOutlined } from "@ant-design/icons";
import DoubleClickTextInputField from "../../CommonAtoms/DoubleClickTextInputField";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";

interface TeamCardProps {
    team: Team;
    isLoading: boolean;
    handleRemovePlayer: (teamId: number, playerId: number) => void;
    handleRenameTeam: (teamId: number, newName: string) => void;
    handleRemoveTeam: (teamId: number, teamName: string) => void;
    handleAddPlayerToTeam: (
        playingPosition: string,
        teamId: number,
        playerId: number,
        id?: number
    ) => void;
}

const TeamCard: React.FC<TeamCardProps> = ({
    team,
    isLoading,
    handleRemovePlayer,
    handleRenameTeam,
    handleRemoveTeam,
    handleAddPlayerToTeam,
}) => {
    const loginInfo = useSelector(selectLoginInfo);
    const {
        token: { colorBgLayout },
      } = theme.useToken();


    const handleRenameTeamClick = (newName: string) => {
        handleRenameTeam(team.teamId, newName);
    };

    const teamMenu = (
        <Menu>
            <Menu.Item>
                <Popconfirm
                    title="Delete the team"
                    description="Are you sure you want to delete this team?"
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
        <Droppable
            droppableId={team.teamId.toString()}
            isDropDisabled={!loginInfo.roles.includes("ADMIN")}
        >
            {(provided) => (
                <Card
                    hoverable
                    title={
                        <Dropdown
                            overlay={teamMenu}
                            trigger={
                                loginInfo.roles.includes("ADMIN")
                                    ? ["click"]
                                    : []
                            }
                        >
                            <Space
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <DoubleClickTextInputField
                                    initialName={team.teamName}
                                    onNameChange={handleRenameTeamClick}
                                    isDiabled={
                                        !loginInfo.roles.includes("ADMIN")
                                    }
                                />
                                {loginInfo.roles.includes("ADMIN") && (
                                    <Button
                                        onClick={(e) => e.preventDefault()}
                                        icon={<MoreOutlined />}
                                    />
                                )}
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
                    {isLoading ? (
                        <div
                            style={{ height: 300, overflow: "auto" }}
                            className="noscrollbar"
                        >
                            <Skeleton
                                active
                                paragraph={{ rows: team.players.length }}
                            />
                        </div>
                    ) : (
                        <div
                            style={{ height: 300, overflow: "auto" }}
                            className="noscrollbar"
                        >
                            {team.players.map((player, index) => (
                                <Draggable
                                    key={player.playerId.toString()}
                                    draggableId={
                                        player.id && player?.teamId
                                            ? player?.playerId.toString() +
                                              "-" +
                                              player?.id.toString() +
                                              "-" +
                                              player?.teamId.toString()
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
                                                background : colorBgLayout,
                                                borderRadius: "4px",
                                                ...provided.draggableProps
                                                    .style,
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
                                                handleAddPosition={() => {
                                                    handleAddPlayerToTeam(
                                                        "GOALKEEPER",
                                                        team.teamId,
                                                        player.playerId,
                                                        player.id
                                                    );
                                                }}
                                                handleRemovePosition={() => {
                                                    handleAddPlayerToTeam(
                                                        "UNASSIGNED",
                                                        team.teamId,
                                                        player.playerId,
                                                        player.id
                                                    );
                                                }}
                                            />
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Card>
            )}
        </Droppable>
    );
};

export default TeamCard;
