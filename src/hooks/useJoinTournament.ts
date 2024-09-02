import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import {
    useAddParticipationToTournamentMutation,
    useGetTournamentParticipantsListQuery,
} from "../state/features/tournaments/tournamentsSlice";
import { TournamentPlayerInfoType } from "../state/features/tournaments/tournamentTypes";

export default function useJoinTournament(tournamentId: number) {
    const {
        data: nextTournament,
        isLoading,
        isError,
    } = useGetTournamentParticipantsListQuery({ tournamentId });

    const [addParticipationToTournament, { isLoading: isUpdating }] =
        useAddParticipationToTournamentMutation();

    const [players, setPlayers] = useState<TournamentPlayerInfoType[]>([]);

    useEffect(() => {
        if (nextTournament?.content?.players) {
            setPlayers(nextTournament.content.players);
        }
        if (isError) {
            message.error("Failed to fetch tournament participants.");
        }
    }, [nextTournament, isError]);

    const handleUpdate = useCallback(
        (playerId: number, comments: string, participationStatus: boolean) => {
            const player = players.find((p) => p.playerId === playerId);
            if (player && nextTournament?.content) {
                const { tournamentId } = nextTournament.content;

                message.loading({
                    content: "Updating player information...",
                    key: playerId,
                });

                addParticipationToTournament({
                    tournamentId,
                    playerId,
                    participationStatus,
                    comments,
                    tournamentParticipantId: player.tournamentParticipantId,
                })
                    .unwrap()
                    .then(() => {
                        setPlayers((prevPlayers) =>
                            prevPlayers.map((p) =>
                                p.playerId === playerId
                                    ? { ...p, comments, participationStatus }
                                    : p
                            )
                        );
                        message.success({
                            content: "Player information updated!",
                            key: playerId,
                        });
                    })
                    .catch(() => {
                        message.error({
                            content: "Failed to update player information.",
                            key: playerId,
                        });
                    });
            }
        },
        [players, nextTournament, addParticipationToTournament]
    );

    return {
        players,
        isLoading,
        isUpdating,
        handleUpdate,
        nextTournament: nextTournament?.content,
    };
}
