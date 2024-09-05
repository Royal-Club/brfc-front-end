import IPlayer from "../../../interfaces/IPlayer";
import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
    addTagTypes: ["player"],
});

export interface PlayerList extends BasicResType {
    content: IPlayer[];
}

export const playerApi = apiWithTags.injectEndpoints({
    endpoints: (builder) => ({
        getPlayers: builder.query<PlayerList, void>({
            query: () => "players",
        }),
    }),
});

export const { useGetPlayersQuery } = playerApi;
