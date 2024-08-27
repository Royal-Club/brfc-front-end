import React, { useState } from "react";
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
} from "react-beautiful-dnd";

interface Player {
    id: string;
    name: string;
}

interface Teams {
    [key: string]: Player[];
}

const initialPlayers: Player[] = [
    { id: "player-1", name: "Player 1" },
    { id: "player-2", name: "Player 2" },
    { id: "player-3", name: "Player 3" },
    { id: "player-4", name: "Player 4" },
    { id: "player-5", name: "Player 5" },
];

const initialTeams: Teams = {
    teamA: [],
    teamB: [],
    teamC: [],
};

function SingleTournament() {
    const [players, setPlayers] = useState<Player[]>(initialPlayers);
    const [teams, setTeams] = useState<Teams>(initialTeams);

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) {
            return;
        }

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        if (
            source.droppableId === "players" &&
            destination.droppableId !== "players"
        ) {
            const player = players.find((p) => p.id === draggableId);
            if (!player) return;

            const newTeams = {
                ...teams,
                [destination.droppableId]: [
                    ...teams[destination.droppableId],
                    player,
                ],
            };
            setTeams(newTeams);
            setPlayers(players.filter((p) => p.id !== draggableId));
        } else if (source.droppableId !== "players") {
            const sourceTeam = teams[source.droppableId];
            const player = sourceTeam[source.index];
            const newSourceTeam = Array.from(sourceTeam);
            newSourceTeam.splice(source.index, 1);
            const newDestinationTeam = Array.from(
                teams[destination.droppableId]
            );
            newDestinationTeam.splice(destination.index, 0, player);

            const newTeams = {
                ...teams,
                [source.droppableId]: newSourceTeam,
                [destination.droppableId]: newDestinationTeam,
            };
            setTeams(newTeams);
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="teams">
                {Object.keys(teams).map((teamId) => (
                    <Droppable key={teamId} droppableId={teamId}>
                        {(provided) => (
                            <div
                                className="team"
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                            >
                                <h3>{teamId}</h3>
                                {teams[teamId].map((player, index) => (
                                    <Draggable
                                        key={player.id}
                                        draggableId={player.id}
                                        index={index}
                                    >
                                        {(provided) => (
                                            <div
                                                className="player-card"
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                            >
                                                {player.name}
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                ))}
            </div>
            <Droppable droppableId="players">
                {(provided) => (
                    <div
                        className="players"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                    >
                        {players.map((player, index) => (
                            <Draggable
                                key={player.id}
                                draggableId={player.id}
                                index={index}
                            >
                                {(provided) => (
                                    <div
                                        className="player-card"
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                    >
                                        {player.name}
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
}

export default SingleTournament;
