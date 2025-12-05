import apiSlice from "../../api/apiSlice";
import {
  IFixture,
  IFixtureGenerationRequest,
  IRecordMatchEventRequest,
  IGetFixturesResponse,
  IGetMatchResponse,
  IStartMatchResponse,
  IPauseMatchResponse,
  IResumeMatchResponse,
  ICompleteMatchResponse,
  IUpdateMatchResponse,
  IUpdateScoreResponse,
  IUpdateFixtureResponse,
  IClearFixturesResponse,
  IRecordMatchEventResponse,
  IGetMatchStatisticsResponse,
  IGetMatchEventsResponse,
  IDeleteEventResponse,
  IUpdateElapsedTimeResponse,
} from "./fixtureTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["fixtures", "matches"],
});

export const fixturesApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    // Fixture Management Endpoints - Simplified API

    /**
     * Generate fixtures (simplified - takes teamIds and matchDates)
     */
    generateFixtures: builder.mutation<
      IGetFixturesResponse,
      IFixtureGenerationRequest
    >({
      query: (body) => ({
        url: `/fixtures/generate`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["fixtures"],
    }),

    /**
     * Get all fixtures for a tournament
     */
    getFixtures: builder.query<IGetFixturesResponse, { tournamentId: number }>({
      query: ({ tournamentId }) => ({
        url: `/fixtures/tournament/${tournamentId}`,
        method: "GET",
      }),
      providesTags: ["fixtures"],
    }),

    /**
     * Clear all fixtures for a tournament
     */
    clearFixtures: builder.mutation<IClearFixturesResponse, { tournamentId: number }>({
      query: ({ tournamentId }) => ({
        url: `/fixtures/tournament/${tournamentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["fixtures"],
    }),

    /**
     * Update a fixture (edit matchDate and/or venueId)
     * Endpoint: PUT /fixtures/{fixtureId}
     */
    updateFixture: builder.mutation<
      IUpdateFixtureResponse,
      { matchId: number; matchDate?: string; venueId?: number }
    >({
      query: ({ matchId, ...body }) => ({
        url: `/fixtures/${matchId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["fixtures", "matches"],
    }),

    /**
     * Get fixture by ID
     */
    getFixtureById: builder.query<IFixture, { fixtureId: number }>({
      query: ({ fixtureId }) => ({
        url: `/fixtures/${fixtureId}`,
        method: "GET",
      }),
      providesTags: ["fixtures"],
    }),

    /**
     * Get match by ID
     */
    getMatchById: builder.query<IGetMatchResponse, { fixtureId: number }>({
      query: ({ fixtureId }) => ({
        url: `/matches/${fixtureId}`,
        method: "GET",
      }),
      providesTags: (result, error, { fixtureId }) => [
        { type: "matches", id: fixtureId },
      ],
    }),

    // Match Management Endpoints

    /**
     * Get match details
     */
    getMatch: builder.query<IGetMatchResponse, { matchId: number }>({
      query: ({ matchId }) => ({
        url: `matches/${matchId}`,
        method: "GET",
      }),
      providesTags: ["matches"],
    }),

    /**
     * Start a match (SCHEDULED -> ONGOING)
     */
    startMatch: builder.mutation<IStartMatchResponse, { matchId: number }>({
      query: ({ matchId }) => ({
        url: `/matches/${matchId}/start`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { matchId }) => [
        "fixtures",
        { type: "matches", id: matchId },
      ],
    }),

    /**
     * Pause a match
     */
    pauseMatch: builder.mutation<IPauseMatchResponse, { matchId: number }>({
      query: ({ matchId }) => ({
        url: `/matches/${matchId}/pause`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { matchId }) => [
        "fixtures",
        { type: "matches", id: matchId },
      ],
    }),

    /**
     * Resume a paused match
     */
    resumeMatch: builder.mutation<IResumeMatchResponse, { matchId: number }>({
      query: ({ matchId }) => ({
        url: `/matches/${matchId}/resume`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { matchId }) => [
        "fixtures",
        { type: "matches", id: matchId },
      ],
    }),

    /**
     * Complete a match (ONGOING -> COMPLETED)
     */
    completeMatch: builder.mutation<ICompleteMatchResponse, { matchId: number }>({
      query: ({ matchId }) => ({
        url: `/matches/${matchId}/complete`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { matchId }) => [
        "fixtures",
        { type: "matches", id: matchId },
      ],
    }),

    /**
     * Update match score
     */
    updateScore: builder.mutation<
      IUpdateScoreResponse,
      { matchId: number; homeTeamScore: number; awayTeamScore: number }
    >({
      query: ({ matchId, ...body }) => ({
        url: `/matches/${matchId}/score`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { matchId }) => [
        "fixtures",
        { type: "matches", id: matchId },
      ],
    }),

    /**
     * Record a match event (goal, card, substitution, etc.)
     * Endpoint: POST /matches/events
     * matchId goes in request body, not URL path
     */
    recordMatchEvent: builder.mutation<
      IRecordMatchEventResponse,
      IRecordMatchEventRequest
    >({
      query: (body) => ({
        url: `/matches/events`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "matches", id: arg.matchId },
      ],
    }),

    /**
     * Get match events
     */
    getMatchEvents: builder.query<IGetMatchEventsResponse, { matchId: number }>({
      query: ({ matchId }) => ({
        url: `/matches/${matchId}/events`,
        method: "GET",
      }),
      providesTags: (result, error, { matchId }) => [
        { type: "matches", id: matchId },
      ],
    }),

    /**
     * Update elapsed time
     */
    updateElapsedTime: builder.mutation<
      IUpdateElapsedTimeResponse,
      { matchId: number; elapsedTimeSeconds: number }
    >({
      query: ({ matchId, ...body }) => ({
        url: `/matches/${matchId}/elapsed-time`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { matchId }) => [
        { type: "matches", id: matchId },
      ],
    }),

    /**
     * Get match statistics
     */
    getMatchStatistics: builder.query<
      IGetMatchStatisticsResponse,
      { matchId: number }
    >({
      query: ({ matchId }) => ({
        url: `/matches/${matchId}/statistics`,
        method: "GET",
      }),
      providesTags: (result, error, { matchId }) => [
        { type: "matches", id: matchId },
      ],
    }),

    /**
     * Delete a match event
     * Endpoint: DELETE /matches/events/{eventId}
     * Automatically reverses GOAL scores
     */
    deleteMatchEvent: builder.mutation<
      IDeleteEventResponse,
      { matchId: number; eventId: number }
    >({
      query: ({ matchId, eventId }) => ({
        url: `/matches/${matchId}/events/${eventId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { matchId }) => [
        { type: "matches", id: matchId },
      ],
    }),
  }),
});

export const {
  useGenerateFixturesMutation,
  useGetFixturesQuery,
  useClearFixturesMutation,
  useUpdateFixtureMutation,
  useGetMatchQuery,
  useStartMatchMutation,
  usePauseMatchMutation,
  useResumeMatchMutation,
  useCompleteMatchMutation,
  useUpdateScoreMutation,
  useRecordMatchEventMutation,
  useGetMatchEventsQuery,
  useGetMatchStatisticsQuery,
  useDeleteMatchEventMutation,
  useUpdateElapsedTimeMutation,
  useGetFixtureByIdQuery,
  useGetMatchByIdQuery,
} = fixturesApi;
