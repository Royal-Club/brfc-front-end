import React, { useEffect } from "react";
import {
    DragDropContext,
    Draggable,
    Droppable,
    DropResult,
} from "react-beautiful-dnd";
import { useParams } from "react-router-dom";
import { Card, Skeleton, Space, Typography } from "antd";
import useTournamentTeams from "../../hooks/useTournamentTeams";
import "./tournament.css";
import CreateTeamComponent from "./Atoms/CreateTeamComponent";
import PlayerCard from "./Atoms/PlayerCard";
import TeamCard from "./Atoms/TeamCard";
import GoalKeeperDrawer from "./Atoms/GoalKeeperDrawer";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import PickerWheelModal from "./Atoms/pickerWheel/PickerWheelModal";
import { RightSquareOutlined, TrophyOutlined } from "@ant-design/icons";
import { showBdLocalTime } from "../../utils/utils";
import colors from "../../utils/colors";

const { Text } = Typography;

function SingleTournament() {
    const { id = "" } = useParams();
    const tournamentId = Number(id);
    const loginInfo = useSelector(selectLoginInfo);

    const {
        teams,
        players,
        tournamentSummary,
        handleAddPlayerToTeam,
        handleRemovePlayer,
        handleRenameTeam,
        handleRemoveTeam,
        refetchTournament,
        refetchPlayer,
    } = useTournamentTeams(tournamentId);

    useEffect(() => {
        refetchTournament();
        refetchPlayer();
    }, []);

    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;

        const dragId = draggableId.split("-");

        const draggedPlayerId = Number(dragId[0]);
        const sourceTeamId = Number(source.droppableId);
        const destinationTeamId = destination.droppableId;

        if (destinationTeamId === source.droppableId) {
            return;
        }

        if (destinationTeamId === "players") {
            handleRemovePlayer(sourceTeamId, draggedPlayerId);
        } else {
            dragId?.length > 1
                ? handleAddPlayerToTeam(
                      "",
                      Number(destinationTeamId),
                      draggedPlayerId,
                      Number(dragId[1]),
                      Number(dragId[2])
                  )
                : handleAddPlayerToTeam(
                      "",
                      Number(destinationTeamId),
                      draggedPlayerId
                  );
        }
    };

    return (
        <Space
            className="SingleTournament-container"
            direction="vertical"
            style={{ width: "100%", minHeight: "80vh" }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    backgroundColor: colors.white,
                    padding: "10px ",
                    borderRadius: "10px",
                }}
            >
                <Space
                    direction="horizontal"
                    size={0}
                    style={{
                        lineHeight: 1.2,
                        display: "flex",
                        gap: "30px",
                    }}
                >
                    <Typography.Title level={5} style={{ margin: 0 }}>
                        <TrophyOutlined /> {tournamentSummary?.content[0].name}
                    </Typography.Title>
                    <Typography.Title
                        level={5}
                        type="secondary"
                        style={{ margin: 0 }}
                    >
                        <RightSquareOutlined />{" "}
                        {tournamentSummary?.content[0]?.tournamentDate &&
                            showBdLocalTime(
                                tournamentSummary?.content[0]?.tournamentDate
                            )}
                    </Typography.Title>
                </Space>
                <Space
                    style={{
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    {loginInfo.roles.includes("ADMIN") && (
                        <CreateTeamComponent
                            tournamentId={tournamentId}
                            existingTeams={teams.map((team) => team.teamName)}
                            refetchSummary={refetchTournament}
                        />
                    )}
                    {loginInfo.roles.includes("ADMIN") && <PickerWheelModal />}
                    <GoalKeeperDrawer tournamentId={tournamentId} />
                </Space>
            </div>
            <div className="team-container">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="team-card-container">
                        {teams.length > 0 ? (
                            teams.map((team) => (
                                <TeamCard
                                    isLoading={false}
                                    key={team.teamId}
                                    team={team}
                                    handleRemovePlayer={handleRemovePlayer}
                                    handleRenameTeam={handleRenameTeam}
                                    handleRemoveTeam={handleRemoveTeam}
                                    handleAddPlayerToTeam={
                                        handleAddPlayerToTeam
                                    }
                                />
                            ))
                        ) : (
                            <Text
                                type="secondary"
                                style={{ textAlign: "center", width: "100%" }}
                            >
                                Create team to add player
                            </Text>
                        )}
                    </div>

                    <Droppable droppableId="players">
                        {(provided) => (
                            <Card
                                title={`Players (${players.length})`}
                                bordered={true}
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                style={{
                                    marginTop: "16px",
                                    marginBottom: "10px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "repeat(auto-fill, minmax(250px, 1fr))",
                                        gap: "8px",
                                        maxHeight: "130px",
                                        overflowY: "auto",
                                        padding: "0 8px 0 0",
                                    }}
                                    className="team-player-container"
                                >
                                    {players.length > 0 ? (
                                        players.map((player, index) => (
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
                                                            backgroundColor:
                                                                "#f0f0f0",
                                                            borderRadius: "4px",
                                                            cursor: "grab",
                                                            ...provided
                                                                .draggableProps
                                                                .style,
                                                        }}
                                                    >
                                                        <PlayerCard
                                                            player={player}
                                                        />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))
                                    ) : (
                                        <Text type="secondary">
                                            No Player Found
                                        </Text>
                                    )}
                                    {provided.placeholder}
                                </div>
                            </Card>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>
        </Space>
    );
}

export default SingleTournament;
