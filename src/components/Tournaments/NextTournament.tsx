import React, { useState } from "react";
import { Card, Row, Col } from "antd";
import Draggable from "react-draggable";

// Define Player and Team types
interface Player {
  playerId: number;
  playerName: string;
  employeeId: string;
  participationStatus: string | null;
  comments: string | null;
}

interface Team {
  teamId: number;
  teamName: string;
  players: Player[];
}

export default function NextTournament() {
  const initialTeams: Team[] = [
    {
      teamId: 1,
      teamName: "Team A",
      players: [],
    },
    {
      teamId: 2,
      teamName: "Test Team",
      players: [],
    },
  ];

  const initialPlayers: Player[] = [
    {
      playerId: 1,
      playerName: "Golam Sarower",
      employeeId: "10051",
      participationStatus: null,
      comments: null,
    },
    {
      playerId: 2,
      playerName: "Rezaul Karim (Admin)",
      employeeId: "10797",
      participationStatus: null,
      comments: null,
    },
    {
      playerId: 3,
      playerName: "Aktaruzzaman Rakib",
      employeeId: "11305",
      participationStatus: null,
      comments: null,
    },
  ];

  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [hoveredTeamId, setHoveredTeamId] = useState<number | null>(null);
  const [playerPositions, setPlayerPositions] = useState<Record<number, { x: number; y: number }>>({});

  const handleStop = (event: any, data: any, player: Player) => {
    if (hoveredTeamId) {
      // Add player to the hovered team
      const updatedTeams = teams.map((team) => {
        if (team.teamId === hoveredTeamId) {
          return {
            ...team,
            players: [...team.players, player],
          };
        }
        return team;
      });

      setTeams(updatedTeams);
      setPlayers(players.filter((p) => p.playerId !== player.playerId));
    } else {
      // Revert the player's position if not dropped on a team
      setPlayerPositions((prevPositions) => ({
        ...prevPositions,
        [player.playerId]: { x: 0, y: 0 },
      }));
    }
  };

  const handleDrag = (event: any, data: any, player: Player) => {
    // Update the player's position while dragging
    setPlayerPositions((prevPositions) => ({
      ...prevPositions,
      [player.playerId]: { x: data.x, y: data.y },
    }));

    // Check if the player is being dragged over a team
    const elementUnderCursor = document.elementFromPoint(
      event.clientX,
      event.clientY
    );
    const teamCard = elementUnderCursor?.closest(".team-card");
    const teamId = teamCard ? parseInt(teamCard.getAttribute("data-team-id")!) : null;
    setHoveredTeamId(teamId);
  };

  const handleDragEnd = (event: any, player: Player) => {
    setHoveredTeamId(null);
  };

  return (
    <div>
      <Row gutter={16}>
        {teams.map((team) => (
          <Col span={12} key={team.teamId}>
            <Card
              title={team.teamName}
              bordered
              className="team-card"
              data-team-id={team.teamId}
              style={{
                borderColor: hoveredTeamId === team.teamId ? "green" : "black",
                borderWidth: "2px",
              }}
            >
              {team.players.length > 0 ? (
                team.players.map((player: Player) => (
                  <p key={player.playerId}>{player.playerName}</p>
                ))
              ) : (
                <p>No players added yet</p>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16} style={{ marginTop: "20px" }}>
        {players.map((player) => (
          <Col span={8} key={player.playerId}>
            <Draggable

              position={playerPositions[player.playerId] || { x: 0, y: 0 }}
              onDrag={(e, data) => handleDrag(e, data, player)}
              onStop={(e, data) => handleStop(e, data, player)}
              onMouseDown={(e) => handleDrag(e, { x: 0, y: 0 }, player)}

            >
              <Card bordered>
                <p>{player.playerName}</p>
              </Card>
            </Draggable>
          </Col>
        ))}
      </Row>
    </div>
  );
}
