import React, { useState } from "react";
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
import EditPlayerDetailsModal from "./EditPlayerDetailsModal";
import { Team, Player } from "../tournamentTypes";
import { MoreOutlined } from "@ant-design/icons";
import DoubleClickTextInputField from "../../CommonAtoms/DoubleClickTextInputField";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import { canManageTeams } from "../../../utils/roleUtils";

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
        id?: number,
        isCaptain?: boolean,
        teamPlayerRole?: string,
        jerseyNumber?: number
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

    const canManage = canManageTeams(loginInfo.roles);

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);


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
        <Card
            hoverable
            title={
                <Dropdown
                    overlay={teamMenu}
                    trigger={
                        canManage
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
                                !canManage
                            }
                        />
                        {canManage && (
                            <Button
                                onClick={(e) => e.preventDefault()}
                                icon={<MoreOutlined />}
                            />
                        )}
                    </Space>
                </Dropdown>
            }
            bordered={true}
            style={{
                minWidth: "300px",
                maxWidth: "400px",
            }}
        >
            <Droppable
                droppableId={team.teamId.toString()}
                isDropDisabled={!canManage}
            >
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{ 
                            height: 300, 
                            overflow: "auto",
                            minHeight: 0
                        }}
                        className="noscrollbar"
                    >
                        {isLoading ? (
                            <Skeleton
                                active
                                paragraph={{ rows: team.players.length }}
                            />
                        ) : (
                            <>
                                {team.players.map((player, index) => (
                                    <Draggable
                                        key={`${team.teamId}-${player.playerId}`}
                                        draggableId={`${team.teamId}-${player.playerId}`}
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
                                                    handleAddPosition={() => {
                                                        handleAddPlayerToTeam(
                                                            "GOALKEEPER",
                                                            team.teamId,
                                                            player.playerId,
                                                            player.id,
                                                            player.isCaptain,
                                                            player.teamPlayerRole,
                                                            player.jerseyNumber
                                                        );
                                                    }}
                                                    handleRemovePosition={() => {
                                                        handleAddPlayerToTeam(
                                                            "UNASSIGNED",
                                                            team.teamId,
                                                            player.playerId,
                                                            player.id,
                                                            player.isCaptain,
                                                            player.teamPlayerRole,
                                                            player.jerseyNumber
                                                        );
                                                    }}
                                                    handleToggleCaptain={() => {
                                                        handleAddPlayerToTeam(
                                                            player.playingPosition || "UNASSIGNED",
                                                            team.teamId,
                                                            player.playerId,
                                                            player.id,
                                                            !player.isCaptain,
                                                            !player.isCaptain ? "CAPTAIN" : "PLAYER",
                                                            player.jerseyNumber
                                                        );
                                                    }}
                                                    handleEditDetails={() => {
                                                        setSelectedPlayer(player);
                                                        setEditModalVisible(true);
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </>
                        )}
                    </div>
                )}
            </Droppable>
            <EditPlayerDetailsModal
                visible={editModalVisible}
                player={selectedPlayer}
                onClose={() => {
                    setEditModalVisible(false);
                    setSelectedPlayer(null);
                }}
                onSave={(
                    playerId,
                    teamId,
                    playingPosition,
                    id,
                    isCaptain,
                    teamPlayerRole,
                    jerseyNumber
                ) => {
                    handleAddPlayerToTeam(
                        playingPosition,
                        teamId,
                        playerId,
                        id,
                        isCaptain,
                        teamPlayerRole,
                        jerseyNumber
                    );
                }}
            />
        </Card>
    );
};

export default TeamCard;
