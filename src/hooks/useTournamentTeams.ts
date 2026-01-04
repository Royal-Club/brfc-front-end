import { useState, useEffect } from "react";
import { message } from "antd";
import { useGetTournamentSummaryQuery } from "../state/features/tournaments/tournamentsSlice";
import {
    useAddPlayerToTeamMutation,
    useUpdatePlayerInTeamMutation,
    useDeleteTournamentTeamMutation,
    usePlayerListToAddToTeamQuery,
    useRemovePlayerFromTeamMutation,
    useRenameTeamMutation,
} from "../state/features/tournaments/tournamentTeamSlice";

interface Player {
    id?: number;
    teamId?: number;
    playerId: number;
    playerName: string;
    employeeId: string;
    participationStatus: boolean;
    comments: string;
    tournamentParticipantId: number;
}

interface TeamPlayer {
    id?: number;
    teamId: number;
    playerId: number;
    playerName: string;
    playingPosition?: string;
    isCaptain?: boolean;
    teamPlayerRole?: string;
    jerseyNumber?: number;
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
    const [updatePlayerInTeam] = useUpdatePlayerInTeamMutation();
    const [deleteTournamentTeam] = useDeleteTournamentTeamMutation();
    const [removePlayerFromTeam] = useRemovePlayerFromTeamMutation();
    const [renameTeam] = useRenameTeamMutation();

    const [teams, setTeams] = useState<Teams[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

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
                    playingPosition: player.playingPosition
                        ? player.playingPosition
                        : "",
                    id: player.id,
                    isCaptain: player.isCaptain,
                    teamPlayerRole: player.teamPlayerRole,
                    jerseyNumber: player.jerseyNumber,
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

    const handleAddPlayerToTeam = async (
        playingPosition: string,
        teamId: number,
        playerId: number,
        id?: number,
        isCaptain?: boolean,
        teamPlayerRole?: string,
        jerseyNumber?: number,
        previousTeamId?: number
    ) => {
        console.log(
            "handleAddPlayerToTeam",
            playingPosition,
            teamId,
            playerId,
            id,
            isCaptain,
            teamPlayerRole,
            jerseyNumber,
            previousTeamId
        );

        try {
            setIsLoading(true);

            // Determine the operation type:
            // - isUpdate: Player is already in THIS team (updating details like position, captain, jersey)
            // - isMovingBetweenTeams: Player is moving from another team to this team (use POST)
            // - isNewAddition: Player is being added from unassigned pool (use POST)
            const isUpdate = id !== undefined && (!previousTeamId || previousTeamId === teamId);
            const isMovingBetweenTeams = previousTeamId !== undefined && previousTeamId !== teamId;

            // Use PUT for updates (player already in same team), POST for new additions or moves
            if (isUpdate) {
                // Player is already in this team - update their details (PUT)
                // Optimistic update for better UX
                playingPosition !== "GOALKEEPER" &&
                    setTeams((prevTeams) =>
                        prevTeams.map((team) =>
                            team.teamId === teamId
                                ? {
                                      ...team,
                                      players: team.players.map((player) =>
                                          player.playerId === playerId
                                              ? {
                                                    ...player,
                                                    playingPosition,
                                                    isCaptain,
                                                    teamPlayerRole,
                                                    jerseyNumber,
                                                }
                                              : player
                                      ),
                                  }
                                : team
                        )
                    );

                await updatePlayerInTeam({
                    playingPosition,
                    teamId,
                    playerId,
                    isCaptain,
                    teamPlayerRole,
                    jerseyNumber,
                }).unwrap();

                message.success("Player details updated successfully");
                await refetchTournament();
            } else if (isMovingBetweenTeams) {
                // Moving between teams - let backend handle completely, no optimistic updates
                // Backend will remove from old team and add to new team
                await addPlayerToTeam({
                    playingPosition,
                    teamId,
                    playerId,
                    isCaptain,
                    teamPlayerRole,
                    jerseyNumber,
                }).unwrap();

                message.success("Player moved successfully");
                await refetchPlayer();
                await refetchTournament();
            } else {
                // Adding from unassigned pool - optimistic update
                setPlayers((prevPlayers) =>
                    prevPlayers.filter((player) => player.playerId !== playerId)
                );

                playingPosition !== "GOALKEEPER" &&
                    setTeams((prevTeams) =>
                        prevTeams.map((team) =>
                            team.teamId === teamId
                                ? {
                                      ...team,
                                      players: [
                                          ...team.players,
                                          {
                                              teamId,
                                              playerId,
                                              playerName:
                                                  players.find(
                                                      (p) => p.playerId === playerId
                                                  )?.playerName || "",
                                              playingPosition,
                                              isCaptain,
                                              teamPlayerRole,
                                              jerseyNumber,
                                          },
                                      ],
                                  }
                                : team
                        )
                    );

                await addPlayerToTeam({
                    playingPosition,
                    teamId,
                    playerId,
                    isCaptain,
                    teamPlayerRole,
                    jerseyNumber,
                }).unwrap();

                message.success("Player added to team successfully");
                await refetchPlayer();
                await refetchTournament();
            }
        } catch (error: any) {
            console.error("Failed to add/update player:", error);
            // Error notification is already handled by apiSlice
            // Revert the optimistic update
            await refetchPlayer();
            await refetchTournament();
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemovePlayer = async (teamId: number, playerId: number) => {
        try {
            setIsLoading(true);

            // Find the player being removed
            const removedPlayer = teams
                .find((team) => team.teamId === teamId)
                ?.players.find((player) => player.playerId === playerId);

            // Update teams: remove the player from the team
            setTeams((prevTeams) =>
                prevTeams.map((team) =>
                    team.teamId === teamId
                        ? {
                              ...team,
                              players: team.players.filter(
                                  (player) => player.playerId !== playerId
                              ),
                          }
                        : team
                )
            );

            if (removedPlayer) {
                setPlayers((prevPlayers) => [
                    ...prevPlayers,
                    {
                        playerId: removedPlayer.playerId,
                        playerName: removedPlayer.playerName,
                        employeeId: "",
                        participationStatus: false,
                        comments: "",
                        tournamentParticipantId: 0,
                    },
                ]);
            }

            // API call to remove the player from the team
            await removePlayerFromTeam({ teamId, playerId }).unwrap();

            message.info("Player removed from team successfully");
            await refetchTournament();
            await refetchPlayer();
        } finally {
            setIsLoading(false);
        }
    };

    const handleRenameTeam = async (teamId: number, newName: string) => {
        try {
            setIsLoading(true);

            // Update local state immediately
            setTeams((prevTeams) =>
                prevTeams.map((team) =>
                    team.teamId === teamId
                        ? { ...team, teamName: newName }
                        : team
                )
            );

            await renameTeam({
                teamId,
                teamName: newName,
                tournamentId,
            }).unwrap();

            message.info(
                `Renamed team with ID ${teamId} to ${newName} in tournament ${tournamentId}`
            );
            await refetchTournament();
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveTeam = async (teamId: number, teamName: string) => {
        try {
            setIsLoading(true);

            // Update local state immediately
            setTeams((prevTeams) =>
                prevTeams.filter((team) => team.teamId !== teamId)
            );

            await deleteTournamentTeam({ teamId }).unwrap();
            message.success("Team removed successfully");
            await refetchTournament();
            await refetchPlayer();
        } finally {
            setIsLoading(false);
        }
    };

    return {
        teams,
        players,
        isLoading,
        tournamentSummary,
        refetchTournament,
        refetchPlayer,
        handleAddPlayerToTeam,
        handleRemovePlayer,
        handleRenameTeam,
        handleRemoveTeam,
    };
};

export default useTournamentTeams;
