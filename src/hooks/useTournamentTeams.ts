import { useState, useEffect } from "react";
import { message } from "antd";
import { useGetTournamentSummaryQuery } from "../state/features/tournaments/tournamentsSlice";
import {
    useAddPlayerToTeamMutation,
    usePlayerListToAddToTeamQuery,
} from "../state/features/tournaments/tournamentTeamSlice";

interface Player {
    playerId: number;
    playerName: string;
    employeeId: string;
    participationStatus: boolean;
    comments: string;
    tournamentParticipantId: number;
}

interface TeamPlayer {
    teamId: number;
    playerId: number;
    playerName: string;
    playingPosition: string;
}

interface Teams {
    teamId: number;
    teamName: string;
    players: TeamPlayer[];
}

const useTournamentTeams = (tournamentId: number) => {
    const tournamentQueryParams = { tournamentId };

    const { data: tournamentSummary, refetch: refetchTournament } =
        useGetTournamentSummaryQuery(tournamentQueryParams);
    const { data: playerListToAddToTeam, refetch: refetchPlayer } =
        usePlayerListToAddToTeamQuery(tournamentQueryParams);
    const [addPlayerToTeam] = useAddPlayerToTeamMutation();

    const [teams, setTeams] = useState<Teams[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);

    useEffect(() => {
        if (tournamentSummary) {
            const teamsData = tournamentSummary?.content[0].teams || [];
            const teams: Teams[] = teamsData.map((team) => ({
                teamId: team.teamId,
                teamName: team.teamName,
                players: team.players.map((player) => ({
                    teamId: team.teamId,
                    playerId: player.playerId,
                    playerName: player.playerName,
                    playingPosition: "",
                })),
            }));
            setTeams(teams);
        }

        if (playerListToAddToTeam) {
            const playersData = playerListToAddToTeam?.content || [];
            const players: Player[] = playersData.map((player) => ({
                playerId: player.playerId,
                playerName: player.playerName,
                employeeId: player.employeeId,
                participationStatus: player.participationStatus,
                comments: player.comments,
                tournamentParticipantId: player.tournamentParticipantId,
            }));
            setPlayers(players);
        }
    }, [tournamentSummary, playerListToAddToTeam]);

    const handleAddPlayerToTeam = (
        playingPosition: string,
        teamId: number,
        playerId: number
    ) => {
        addPlayerToTeam({ playingPosition, teamId, playerId })
            .unwrap()
            .then(
                () => {
                    message.success("Player added to team successfully");
                    refetchPlayer();
                    refetchTournament();
                },
                () => {
                    message.error("Failed to add player to team");
                }
            );
    };

    const handleRemovePlayer = (teamId: number, playerId: number) => {
        message.info(
            `Remove player with ID ${playerId} from team with ID ${teamId}`
        );
    };

    const handleRenameTeam = (teamId: number, newName: string) => {
        message.info(`Rename team with ID ${teamId} to ${newName}`);
    };
    const handleRemoveTeam = (teamId: number) => {
        message.info(`Remove team with ID ${teamId}`);
    };

    return {
        teams,
        players,
        refetchTournament,
        handleAddPlayerToTeam,
        handleRemovePlayer,
        handleRenameTeam,
        handleRemoveTeam,
    };
};

export default useTournamentTeams;
