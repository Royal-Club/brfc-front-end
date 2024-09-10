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

export const playerApi = apiWithTags.injectEndpoints({
    endpoints: (builder) => ({
        getPlayers: builder.query<PlayerList, void>({
            query: () => "players",
        }),

        getPlayerPositions: builder.query<PlayerPositions, void>({
            query: () => "football-positions",
        }),
    }),
});

export const { useGetPlayersQuery, useGetPlayerPositionsQuery } = playerApi;
