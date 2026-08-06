import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";
import {
    PlayerListToAddToTeamType,
    TournamentPlayerInfoType,
} from "./tournamentTypes";

// "teamFormation" is owned by teamFormationSlice, but a line-up carries its
// team's squad inside its own payload — so anything that changes who is in a
// team leaves the cached line-up stale until it is invalidated here too.
const apiWithTags = apiSlice.enhanceEndpoints({
    addTagTypes: ["tournamentTeam", "teamFormation"],
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
            // The name and crest are shown on the line-up too.
            invalidatesTags: ["tournamentTeam", "teamFormation"],
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
            invalidatesTags: ["tournamentTeam", "teamFormation"],
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
            invalidatesTags: ["tournamentTeam", "teamFormation"],
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
            // Shirt number, position and captaincy all show on the pitch tokens.
            invalidatesTags: ["tournamentTeam", "teamFormation"],
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
            invalidatesTags: ["tournamentTeam", "teamFormation"],
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
