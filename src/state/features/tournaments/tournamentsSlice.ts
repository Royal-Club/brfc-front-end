import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";
import {
    IoTournamentSummaryResType,
    NextTournamentResType,
    TournamentPlayerInfoType,
    TournamentSummeryResType,
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
        getTournamentSummary: builder.query<
            TournamentSummeryResType,
            { tournamentId: number }
        >({
            query: ({ tournamentId }) => ({
                url: `tournaments/details?tournamentId=${tournamentId}`,
                method: "GET",
            }),
            providesTags: ["tournaments"],
        }),
    }),
});

export const {
    useCreateTournamentMutation,
    useGetTournamentsQuery,
    useGetTournamentParticipantsListQuery,
    useAddParticipationToTournamentMutation,
    useGetTournamentSummaryQuery,
} = tournamentsApi;
