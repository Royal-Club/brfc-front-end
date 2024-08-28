import React from "react";
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
} from "react-beautiful-dnd";
import { useParams } from "react-router-dom";
import CreateTeamModal from "./Atoms/CreateTeamModal";
import { Card } from "antd";
import useTournamentTeams from "../../hooks/useTournamentTeams";
import "./tournament.css"; // Import the CSS file

function SingleTournament() {
    const { id = "" } = useParams();
    const tournamentId = Number(id);

    const { teams, players, handleAddPlayerToTeam, handleRemovePlayer } =
        useTournamentTeams(tournamentId);

    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;

        const draggedPlayerId = Number(draggableId);
        const sourceTeamId = Number(source.droppableId);
        const destinationTeamId = destination.droppableId;

        if (destinationTeamId === source.droppableId) {
            return; // No change in position, do nothing.
        }

        if (destinationTeamId === "players") {
            handleRemovePlayer(sourceTeamId, draggedPlayerId);
        } else {
            handleAddPlayerToTeam(
                "",
                Number(destinationTeamId),
                draggedPlayerId
            );
        }
    };

    return (
        <>
            <CreateTeamModal
                tournamentId={tournamentId}
                tournamentName={teams.length > 0 ? teams[0].teamName : ""}
                refetchSummary={() => {}}
            />
            <div className="team-container">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="team-card-container">
                        {teams.map((team) => (
                            <div key={team.teamId}>
                                <Droppable droppableId={team.teamId.toString()}>
                                    {(provided) => (
                                        <Card
                                            style={{
                                                minWidth: "250px",
                                                maxWidth: "400px",
                                                minHeight: "200px",
                                            }}
                                            title={team.teamName}
                                            bordered={true}
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                        >
                                            {team.players.map(
                                                (player, index) => (
                                                    <Draggable
                                                        key={player.playerId.toString()}
                                                        draggableId={player.playerId.toString()}
                                                        index={index}
                                                    >
                                                        {(provided) => (
                                                            <div
                                                                ref={
                                                                    provided.innerRef
                                                                }
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                style={{
                                                                    padding:
                                                                        "8px",
                                                                    margin: "4px 0",
                                                                    backgroundColor:
                                                                        "#f0f0f0",
                                                                    borderRadius:
                                                                        "4px",
                                                                    ...provided
                                                                        .draggableProps
                                                                        .style,
                                                                }}
                                                                onClick={() =>
                                                                    handleRemovePlayer(
                                                                        team.teamId,
                                                                        player.playerId
                                                                    )
                                                                }
                                                            >
                                                                {
                                                                    player.playerName
                                                                }
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                )
                                            )}
                                            {provided.placeholder}
                                        </Card>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>
                    <Droppable droppableId="players">
                        {(provided) => (
                            <Card
                                title="Available Players"
                                bordered={true}
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                style={{ marginTop: "16px" }}
                            >
                                {players.map((player, index) => (
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
                                                    ...provided.draggableProps
                                                        .style,
                                                    cursor: "grab",
                                                    maxWidth: "300px",
                                                }}
                                            >
                                                {player.playerName}
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </Card>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>
        </>
    );
}

export default SingleTournament;
