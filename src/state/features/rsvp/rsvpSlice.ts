import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

export type RsvpVoteStatus =
    | "RECORDED"
    | "UPDATED"
    | "INVALID"
    | "EXPIRED"
    | "TOURNAMENT_CANCELLED"
    | "TOURNAMENT_STARTED";

export interface RsvpVoteContent {
    status: RsvpVoteStatus;
    playerName?: string;
    tournamentName?: string;
    tournamentDate?: string;
    venueName?: string;
    attending: boolean;
    message?: string;
}

export interface RsvpVoteResType extends BasicResType {
    content: RsvpVoteContent;
}

export const rsvpApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Read-only: describes the link without recording anything, so a mail scanner
        // that follows the URL cannot cast a vote.
        previewRsvp: builder.query<RsvpVoteResType, { token: string }>({
            query: ({ token }) => ({
                url: `rsvp/preview?token=${encodeURIComponent(token)}`,
                method: "GET",
            }),
        }),
        submitRsvp: builder.mutation<RsvpVoteResType, { token: string }>({
            query: ({ token }) => ({
                url: `rsvp/vote?token=${encodeURIComponent(token)}`,
                method: "POST",
            }),
        }),
    }),
});

export const { usePreviewRsvpQuery, useSubmitRsvpMutation } = rsvpApi;
