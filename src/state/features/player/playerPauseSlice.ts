import IPlayerPause, { PauseReason } from "../../../interfaces/IPlayerPause";
import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["playerPauses", "contributionReport"],
});

export interface PlayerPauseResType extends BasicResType {
  content: IPlayerPause;
}

export interface PlayerPauseListResType extends BasicResType {
  content: IPlayerPause[];
}

export interface PausePlayerArgs {
  playerId: number;
  /** Any date within the first excused month, as "YYYY-MM-DD". */
  fromMonth: string;
  reason: PauseReason;
  note?: string;
}

export interface ResumePlayerArgs {
  playerId: number;
  /** The first month the player owes again, as "YYYY-MM-DD". */
  resumeFromMonth: string;
}

export const playerPauseApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    /** Every pause currently running, so the player list can badge them in one call. */
    getOpenPauses: builder.query<PlayerPauseListResType, void>({
      query: () => ({ url: `/players/pauses/open`, method: "GET" }),
      providesTags: ["playerPauses"],
    }),

    getPlayerPauses: builder.query<PlayerPauseListResType, number>({
      query: (playerId) => ({ url: `/players/${playerId}/pauses`, method: "GET" }),
      providesTags: ["playerPauses"],
    }),

    pausePlayer: builder.mutation<PlayerPauseResType, PausePlayerArgs>({
      query: ({ playerId, ...body }) => ({
        url: `/players/${playerId}/pauses`,
        method: "POST",
        body,
      }),
      // The report's on-hold months come straight from these records, so it has to refetch.
      invalidatesTags: ["playerPauses", "contributionReport"],
    }),

    resumePlayer: builder.mutation<PlayerPauseResType, ResumePlayerArgs>({
      query: ({ playerId, resumeFromMonth }) => ({
        url: `/players/${playerId}/pauses/resume`,
        method: "PUT",
        body: { resumeFromMonth },
      }),
      invalidatesTags: ["playerPauses", "contributionReport"],
    }),

    deletePause: builder.mutation<BasicResType, number>({
      query: (pauseId) => ({ url: `/players/pauses/${pauseId}`, method: "DELETE" }),
      invalidatesTags: ["playerPauses", "contributionReport"],
    }),
  }),
});

export const {
  useGetOpenPausesQuery,
  useGetPlayerPausesQuery,
  usePausePlayerMutation,
  useResumePlayerMutation,
  useDeletePauseMutation,
} = playerPauseApi;

export default playerPauseApi;
