import IFootballPosition from "../../../interfaces/IFootballPosition";
import IPlayer from "../../../interfaces/IPlayer";
import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
    addTagTypes: ["player"],
});

export interface PlayerList extends BasicResType {
    content: IPlayer[];
}

export interface PlayerPositions extends BasicResType {
    content: IFootballPosition[];
}

export interface GoalkeepingHistoryRecord {
    playerId: number;
    playerName: string;
    roundNumber: number;
    playedDate: string;
}

export interface PlayerGoalkeepingHistoryResType extends BasicResType {
    content: GoalkeepingHistoryRecord[];
}

export const playerApi = apiWithTags.injectEndpoints({
    endpoints: (builder) => ({
        getPlayers: builder.query<PlayerList, void>({
            query: () => "players",
        }),

        getPlayerPositions: builder.query<PlayerPositions, void>({
            query: () => "football-positions",
        }),

        getPlayerGoalkeepingHistory: builder.query<PlayerGoalkeepingHistoryResType, { playerId: number }>({
            query: ({ playerId }) => `players/goalkeeping-history?playerId=${playerId}`,
            providesTags: ["player"],
        }),

        getMyGoalkeepingHistory: builder.query<PlayerGoalkeepingHistoryResType, void>({
            query: () => "players/goalkeeping-history",
            providesTags: ["player"],
        }),
    }),
});

export const { 
    useGetPlayersQuery, 
    useGetPlayerPositionsQuery,
    useGetPlayerGoalkeepingHistoryQuery,
    useGetMyGoalkeepingHistoryQuery 
} = playerApi;
