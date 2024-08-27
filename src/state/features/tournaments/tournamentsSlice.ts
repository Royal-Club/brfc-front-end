import apiSlice from "../../api/apiSlice";
import {
  IoTournamentSummaryResType,
  NextTournamentResType,
  TournamentPlayerInfoType,
} from "./tournamentTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["tournaments"],
});

//get tournaments summery
//route :  {}/tournaments/details

export const tournamentsApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    getTournaments: builder.query<IoTournamentSummaryResType, void>({
      query: () => "tournaments",
      providesTags: ["tournaments"],
    }),

    getNextTournament: builder.query<NextTournamentResType, void>({
      query: () => "tournament-participants/next-upcoming",
      providesTags: ["tournaments"],
    }),

    createTournamentTeam: builder.mutation<
      TournamentPlayerInfoType,
      {
        tournamentId: number;
        teamName: string;
      }
    >({
      query: (body) => ({
        url: "teams",
        method: "POST",
        body,
      }),
      invalidatesTags: ["tournaments"],
    }),
  }),
});

export const { useGetTournamentsQuery, useGetNextTournamentQuery , useCreateTournamentTeamMutation } =
  tournamentsApi;
