import { useState, useEffect } from "react";
import { message } from "antd";
import { useGetTournamentSummaryQuery } from "../state/features/tournaments/tournamentsSlice";
import {
  useAddPlayerToTeamMutation,
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
  teamId: number;
  playerId: number;
  playerName: string;
  playingPosition?: string;
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
          playingPosition: player.playingPosition ? player.playingPosition : "",
          id: player.id,
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
    previousTeamId?: number
  ) => {
    console.log(
      "handleAddPlayerToTeam",
      playingPosition,
      teamId,
      playerId,
      id,
      previousTeamId
    );

    try {
      setIsLoading(true);

      // Update local state immediately
      
        playingPosition !== "GOALKEEPER" &&
          setTeams((prevTeams) => {
            let updatedTeams = [...prevTeams];

            // Remove player from previous team if exists
            if (previousTeamId) {
              updatedTeams = updatedTeams.map((team) =>
                team.teamId === previousTeamId
                  ? {
                      ...team,
                      players: team.players.filter(
                        (player) => player.playerId !== playerId
                      ),
                    }
                  : team
              );
            } else {
              // Remove player from player list
              setPlayers((prevPlayers) =>
                prevPlayers.filter((player) => player.playerId !== playerId)
              );
            }

            // Add player to the new team
            updatedTeams = updatedTeams.map((team) =>
              team.teamId === teamId
                ? {
                    ...team,
                    players: [
                      ...team.players,
                      {
                        teamId,
                        playerId,
                        playerName:
                          players.find((p) => p.playerId === playerId)
                            ?.playerName || "",
                        playingPosition,
                      },
                    ],
                  }
                : team
            );

            return updatedTeams;
          });
      

      await addPlayerToTeam({
        playingPosition,
        teamId,
        playerId,
        id,
      }).unwrap();

      message.success("Player added to team successfully");
      await refetchPlayer();
      await refetchTournament();
    } catch {
      message.error("Failed to add player to team");
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
    } catch {
      message.error("Failed to remove player from team");
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
          team.teamId === teamId ? { ...team, teamName: newName } : team
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
    } catch {
      message.error("Failed to rename team");
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
    } catch {
      message.error("Failed to remove team");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    teams,
    players,
    isLoading,
    refetchTournament,
    handleAddPlayerToTeam,
    handleRemovePlayer,
    handleRenameTeam,
    handleRemoveTeam,
  };
};

export default useTournamentTeams;
