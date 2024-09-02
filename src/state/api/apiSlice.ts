/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";

// Correcting type definition for `prepareHeaders`
const baseQuery = fetchBaseQuery({
    baseUrl: "http://localhost:9191",
    // baseUrl: "http://192.168.0.106:8000/api",
    prepareHeaders: (headers, { getState }) => {
        const state = getState() as RootState;
        const token = state.loginInfo.token;
        console.log("baseQuery ", state);
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        return headers;
    },
});

const apiSlice = createApi({
    reducerPath: "api",

    baseQuery: async (args, api, extraOptions) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const result = await baseQuery(args, api, extraOptions);

        return result;
    },

    endpoints: () => ({}),
    tagTypes: [],
});

export default apiSlice;
