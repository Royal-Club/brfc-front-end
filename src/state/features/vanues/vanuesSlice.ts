import apiSlice from "../../api/apiSlice";
import { AllVenueResType } from "./vanuesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
    addTagTypes: ["global"],
});

export const commonApi = apiWithTags.injectEndpoints({
    endpoints: (builder) => ({
        getVanues: builder.query<AllVenueResType, void>({
            query: () => ({
                url: "venues",
                method: "GET",
            }),
            providesTags: ["global"],
        }),
    }),
    overrideExisting: false,
});

export const { useGetVanuesQuery } = commonApi;
