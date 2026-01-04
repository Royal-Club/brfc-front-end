import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";
import {
    PlayerListToAddToTeamType,
    TournamentPlayerInfoType,
} from "./tournamentTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
    addTagTypes: ["tournamentTeam"],
});

export const tournamentTeamApi = apiWithTags.injectEndpoints({
    endpoints: (builder) => ({
        createTournamentTeam: builder.mutation<
            TournamentPlayerInfoType,
            { tournamentId: number; teamName: string }
        >({
            query: ({ tournamentId, teamName }) => ({
                url: `teams`,
                method: "POST",
                body: { tournamentId, teamName },
            }),
            invalidatesTags: ["tournamentTeam"],
        }),

        renameTeam: builder.mutation<
            BasicResType,
            { teamId: number; teamName: string; tournamentId: number }
        >({
            query: ({ teamId, teamName, tournamentId }) => ({
                url: `teams`,
                method: "POST",
                body: { id: teamId, teamName, tournamentId },
            }),
            invalidatesTags: ["tournamentTeam"],
        }),

        deleteTournamentTeam: builder.mutation<
            BasicResType,
            { teamId: number }
        >({
            query: ({ teamId }) => ({
                url: `teams/${teamId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["tournamentTeam"],
        }),

        playerListToAddToTeam: builder.query<
            PlayerListToAddToTeamType,
            { tournamentId: number }
        >({
            query: ({ tournamentId }) => ({
                url: `tournament-participants/${tournamentId}/to-be-selected`,
                method: "GET",
            }),
            providesTags: ["tournamentTeam"],
        }),

        addPlayerToTeam: builder.mutation<
            BasicResType,
            {
                playingPosition: string;
                teamId: number;
                playerId: number;
                isCaptain?: boolean;
                teamPlayerRole?: string;
                jerseyNumber?: number;
            }
        >({
            query: ({ playingPosition, teamId, playerId, isCaptain = false, teamPlayerRole = "PLAYER", jerseyNumber }) => {
                const body: any = {
                    playerId,
                    teamId,
                    playingPosition,
                    isCaptain,
                    teamPlayerRole,
                };

                // Only include jerseyNumber if it's provided
                if (jerseyNumber !== undefined && jerseyNumber !== null) {
                    body.jerseyNumber = jerseyNumber;
                }

                return {
                    url: `teams/players`,
                    method: "POST",
                    body,
                };
            },
            invalidatesTags: ["tournamentTeam"],
        }),

        updatePlayerInTeam: builder.mutation<
            BasicResType,
            {
                playingPosition: string;
                teamId: number;
                playerId: number;
                isCaptain?: boolean;
                teamPlayerRole?: string;
                jerseyNumber?: number;
            }
        >({
            query: ({ playingPosition, teamId, playerId, isCaptain = false, teamPlayerRole = "PLAYER", jerseyNumber }) => {
                const body: any = {
                    playerId,
                    teamId,
                    playingPosition,
                    isCaptain,
                    teamPlayerRole,
                };

                // Only include jerseyNumber if it's provided
                if (jerseyNumber !== undefined && jerseyNumber !== null) {
                    body.jerseyNumber = jerseyNumber;
                }

                return {
                    url: `teams/players`,
                    method: "PUT",
                    body,
                };
            },
            invalidatesTags: ["tournamentTeam"],
        }),
        removePlayerFromTeam: builder.mutation<
            BasicResType,
            { teamId: number; playerId: number }
        >({
            query: ({ teamId, playerId }) => ({
                url: `teams/players`,
                method: "DELETE",
                body: { teamId, playerId },
            }),
            invalidatesTags: ["tournamentTeam"],
        }),
    }),
});

export const {
    useCreateTournamentTeamMutation,
    useRenameTeamMutation,
    usePlayerListToAddToTeamQuery,
    useDeleteTournamentTeamMutation,
    useAddPlayerToTeamMutation,
    useUpdatePlayerInTeamMutation,
    useRemovePlayerFromTeamMutation,
} = tournamentTeamApi;
