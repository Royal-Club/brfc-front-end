import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";
import {
    IoTournamentSummaryResType,
    NextTournamentResType,
    TournamentPlayerInfoType,
} from "./tournamentTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
    addTagTypes: ["tournaments"],
});

export const tournamentsApi = apiWithTags.injectEndpoints({
    endpoints: (builder) => ({
        createTournament: builder.mutation<
            BasicResType,
            {
                tournamentName: string;
                tournamentDate: string | Date;
                venueId: number;
            }
        >({
            query: ({ tournamentName, tournamentDate, venueId }) => ({
                url: "tournaments",
                method: "POST",
                body: { tournamentName, tournamentDate, venueId },
            }),
            invalidatesTags: ["tournaments"],
        }),
        getTournaments: builder.query<IoTournamentSummaryResType, void>({
            query: () => "tournaments",
            providesTags: ["tournaments"],
        }),

        getTournamentParticipantsList: builder.query<
            NextTournamentResType,
            { tournamentId: number }
        >({
            query: ({ tournamentId }) =>
                `tournament-participants/${tournamentId}/next-upcoming`,
            providesTags: ["tournaments"],
        }),

        addParticipationToTournament: builder.mutation<
            TournamentPlayerInfoType,
            {
                tournamentId: number;
                playerId: number;
                participationStatus: boolean;
                comments: string;
                tournamentParticipantId?: number;
            }
        >({
            query: ({
                tournamentId,
                playerId,
                participationStatus,
                comments,
                tournamentParticipantId,
            }) => ({
                url: `tournament-participants`,
                method: "POST",
                body: {
                    tournamentId,
                    playerId,
                    participationStatus,
                    comments,
                    tournamentParticipantId,
                },
            }),
            invalidatesTags: ["tournaments"],
        }),

        createTournamentTeam: builder.mutation<
            TournamentPlayerInfoType,
            { tournamentId: number; teamName: string }
        >({
            query: ({ tournamentId, teamName }) => ({
                url: `tournaments/${tournamentId}/teams`,
                method: "POST",
                body: { teamName },
            }),
            invalidatesTags: ["tournaments"],
        }),
    }),
});

export const {
    useCreateTournamentMutation,
    useGetTournamentsQuery,
    useGetTournamentParticipantsListQuery,
    useAddParticipationToTournamentMutation,
    useCreateTournamentTeamMutation,
} = tournamentsApi;
