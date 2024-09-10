import IPlayer from "../../../interfaces/IPlayer";
import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
    addTagTypes: ["auth"],
});

export interface LoginResType extends BasicResType {
    content: {
        token: string;
        username: string;
        email: string;
        userId: string;
        roles: string[];
    };
}

export interface PlayerProfileResType extends BasicResType {
    content: IPlayer;
}

export const tournamentsApi = apiWithTags.injectEndpoints({
    endpoints: (build) => ({
        login: build.mutation<
            LoginResType,
            {
                email: string;
                password: string;
            }
        >({
            query: (data) => ({
                url: "auth/login",
                method: "POST",
                body: data,
            }),
        }),
        changePassword: build.mutation<BasicResType, any>({
            query: (data) => ({
                url: "auth/change-password",
                method: "PUT",
                body: data,
            }),
        }),
        getUserProfile: build.query<
            PlayerProfileResType,
            {
                id: string;
            }
        >({
            query: ({ id }) => `/players/${id}`,
            providesTags: ["auth"],
        }),
        updatePlayerData: build.mutation<
            BasicResType,
            {
                id: number;
                data: {
                    name: string;
                    email: string;
                    mobileNo: string;
                    skypeId: string;
                    playerPosition?: string;
                    employeeId: string;
                    playingPosition?: string;
                };
            }
        >({
            query: ({ id, data }) => ({
                url: `players/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["auth"],
        }),
    }),
});

export const {
    useLoginMutation,
    useChangePasswordMutation,
    useGetUserProfileQuery,
    useUpdatePlayerDataMutation,
} = tournamentsApi;
