import React, { useState } from "react";
import {
    Avatar,
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
import { MoreOutlined, UploadOutlined } from "@ant-design/icons";
import DoubleClickTextInputField from "../../CommonAtoms/DoubleClickTextInputField";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import { canManageTeams } from "../../../utils/roleUtils";
import { API_URL } from "../../../settings";

interface TeamCardProps {
    team: Team;
    isLoading: boolean;
    handleRemovePlayer: (teamId: number, playerId: number) => void;
    handleRenameTeam: (teamId: number, newName: string) => void;
    handleUploadTeamLogo: (teamId: number, file: File) => void;
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
    handleUploadTeamLogo,
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

    const logoInputId = `team-logo-input-${team.teamId}`;
    const logoSrc = team.logoUrl
        ? team.logoUrl.startsWith("http")
            ? team.logoUrl
            : `${API_URL}${team.logoUrl}`
        : undefined;


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
                        <Space align="center" size={8}>
                            <Avatar src={logoSrc} style={{ backgroundColor: "#1f1f1f" }}>
                                {team.teamName?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <DoubleClickTextInputField
                                initialName={team.teamName}
                                onNameChange={handleRenameTeamClick}
                                isDiabled={
                                    !canManage
                                }
                            />
                        </Space>
                        {canManage && (
                            <Space>
                                <Button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const fileInput = document.getElementById(logoInputId) as HTMLInputElement | null;
                                        fileInput?.click();
                                    }}
                                    icon={<UploadOutlined />}
                                />
                                <input
                                    id={logoInputId}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    onChange={(event) => {
                                        const file = event.target.files?.[0];
                                        if (file) {
                                            handleUploadTeamLogo(team.teamId, file);
                                        }
                                        event.target.value = "";
                                    }}
                                />
                                <Button
                                    onClick={(e) => e.preventDefault()}
                                    icon={<MoreOutlined />}
                                />
                            </Space>
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
