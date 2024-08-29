import React from "react";
import {
    DragDropContext,
    Draggable,
    Droppable,
    DropResult,
} from "react-beautiful-dnd";
import { useParams } from "react-router-dom";
import { Card, Space } from "antd";
import useTournamentTeams from "../../hooks/useTournamentTeams";
import "./tournament.css";
import CreateTeamComponent from "./Atoms/CreateTeamComponent";
import PlayerCard from "./Atoms/PlayerCard";
import TeamCard from "./Atoms/TeamCard";

function SingleTournament() {
    const { id = "" } = useParams();
    const tournamentId = Number(id);

    const {
        teams,
        players,
        handleAddPlayerToTeam,
        handleRemovePlayer,
        handleRenameTeam,
        handleRemoveTeam,
        refetchTournament,
    } = useTournamentTeams(tournamentId);

    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;

        const draggedPlayerId = Number(draggableId);
        const sourceTeamId = Number(source.droppableId);
        const destinationTeamId = destination.droppableId;

        if (destinationTeamId === source.droppableId) {
            return;
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
        <Space
            direction="vertical"
            style={{ width: "100%", minHeight: "80vh" }}
        >
            <CreateTeamComponent
                tournamentId={tournamentId}
                existingTeams={teams.map((team) => team.teamName)}
                refetchSummary={refetchTournament}
            />
            <div className="team-container">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="team-card-container">
                        {teams.map((team) => (
                            <TeamCard
                                key={team.teamId}
                                team={team}
                                handleRemovePlayer={handleRemovePlayer}
                                handleRenameTeam={handleRenameTeam}
                                handleRemoveTeam={handleRemoveTeam}
                            />
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
                                                <PlayerCard
                                                    player={player}
                                                    handleRemovePlayer={() =>
                                                        handleRemovePlayer(
                                                            0,
                                                            player.playerId
                                                        )
                                                    }
                                                    handleAddPosition={() =>
                                                        console.log(
                                                            "Add Position clicked"
                                                        )
                                                    }
                                                />
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
        </Space>
    );
}

export default SingleTournament;
