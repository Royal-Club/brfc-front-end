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
                method: "POST",
                body: data,
            }),
        }),
    }),
});

export const { useLoginMutation, useChangePasswordMutation } = tournamentsApi;
