import apiSlice from "../../api/apiSlice";
import {
  IGetTournamentStandingsResponse,
  IGetTopScorersResponse,
  IGetTopAssistsResponse,
  IGetTopCardsResponse,
  IGetMatchStatisticsResponse,
  IGetPlayerTournamentStatisticsResponse,
} from "./statisticsTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["statistics"],
});

export const statisticsApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get tournament standings (teams ranked by points, goal difference, etc.)
     */
    getTournamentStandings: builder.query<
      IGetTournamentStandingsResponse,
      { tournamentId: number }
    >({
      query: ({ tournamentId }) => ({
        url: `/statistics/tournaments/${tournamentId}/standings`,
        method: "GET",
      }),
      providesTags: ["statistics"],
    }),

    /**
     * Get top scorers in a tournament
     */
    getTopScorers: builder.query<
      IGetTopScorersResponse,
      { tournamentId: number }
    >({
      query: ({ tournamentId }) => ({
        url: `/statistics/tournaments/${tournamentId}/top-scorers`,
        method: "GET",
      }),
      providesTags: ["statistics"],
    }),

    /**
     * Get top assist providers in a tournament
     */
    getTopAssists: builder.query<
      IGetTopAssistsResponse,
      { tournamentId: number }
    >({
      query: ({ tournamentId}) => ({
        url: `/statistics/tournaments/${tournamentId}/top-assists`,
        method: "GET",
      }),
      providesTags: ["statistics"],
    }),

    /**
     * Get players with most disciplinary cards in a tournament
     */
    getTopCards: builder.query<
      IGetTopCardsResponse,
      { tournamentId: number }
    >({
      query: ({ tournamentId }) => ({
        url: `/statistics/tournaments/${tournamentId}/top-cards`,
        method: "GET",
      }),
      providesTags: ["statistics"],
    }),

    /**
     * Get all player statistics for a specific match
     */
    getMatchStatistics: builder.query<
      IGetMatchStatisticsResponse,
      { matchId: number }
    >({
      query: ({ matchId }) => ({
        url: `/statistics/matches/${matchId}`,
        method: "GET",
      }),
      providesTags: ["statistics"],
    }),

    /**
     * Get all statistics for a player across all matches in a tournament
     */
    getPlayerTournamentStatistics: builder.query<
      IGetPlayerTournamentStatisticsResponse,
      { tournamentId: number; playerId: number }
    >({
      query: ({ tournamentId, playerId }) => ({
        url: `/statistics/tournaments/${tournamentId}/players/${playerId}`,
        method: "GET",
      }),
      providesTags: ["statistics"],
    }),
  }),
});

export const {
  useGetTournamentStandingsQuery,
  useGetTopScorersQuery,
  useGetTopAssistsQuery,
  useGetTopCardsQuery,
  useGetMatchStatisticsQuery,
  useGetPlayerTournamentStatisticsQuery,
} = statisticsApi;
