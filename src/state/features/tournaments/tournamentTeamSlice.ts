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
            { tournamentId: number; teamName: string; logoKey?: string }
        >({
            query: ({ tournamentId, teamName, logoKey }) => ({
                url: `teams`,
                method: "POST",
                body: { tournamentId, teamName, logoKey },
            }),
            invalidatesTags: ["tournamentTeam"],
        }),

        renameTeam: builder.mutation<
            BasicResType,
            { teamId: number; teamName: string; tournamentId: number; logoKey?: string }
        >({
            query: ({ teamId, teamName, tournamentId, logoKey }) => ({
                url: `teams`,
                method: "POST",
                body: { id: teamId, teamName, tournamentId, logoKey },
            }),
            invalidatesTags: ["tournamentTeam"],
        }),

        presignTeamLogoUpload: builder.mutation<
            BasicResType & { content: { key: string; url: string; uploadUrl: string; expiresInSeconds: number } },
            { fileName: string; contentType: string }
        >({
            query: ({ fileName, contentType }) => ({
                url: `files/team-logos/presign`,
                method: "POST",
                params: { fileName, contentType },
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
    usePresignTeamLogoUploadMutation,
    usePlayerListToAddToTeamQuery,
    useDeleteTournamentTeamMutation,
    useAddPlayerToTeamMutation,
    useUpdatePlayerInTeamMutation,
    useRemovePlayerFromTeamMutation,
} = tournamentTeamApi;
