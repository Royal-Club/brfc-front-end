import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

/**
 * Every step of the emailed reset flow answers 200 with one of these, failures included — a dead
 * link is a normal outcome here, so it should render as a page rather than surface as a toast.
 */
export type PasswordResetStatus =
    | "SENT"
    | "LIMIT_REACHED"
    | "SEND_FAILED"
    | "VALID"
    | "RESET"
    | "INVALID"
    | "EXPIRED"
    | "ALREADY_USED"
    | "WEAK_PASSWORD";

export interface PasswordResetContent {
    status: PasswordResetStatus;
    playerName?: string;
    message?: string;
}

export interface PasswordResetResType extends BasicResType {
    content: PasswordResetContent;
}

export const passwordResetApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Answers identically for an address with no account, so the login page cannot be used
        // to discover who is a member.
        requestPasswordReset: builder.mutation<PasswordResetResType, { email: string }>({
            query: (body) => ({
                url: "auth/forgot-password",
                method: "POST",
                body,
            }),
        }),

        // Read-only: decides whether to show the form or an explanation, without spending the link.
        validatePasswordResetToken: builder.query<PasswordResetResType, { token: string }>({
            query: ({ token }) => ({
                url: `auth/password-reset/validate?token=${encodeURIComponent(token)}`,
                method: "GET",
            }),
        }),

        confirmPasswordReset: builder.mutation<
            PasswordResetResType,
            { token: string; newPassword: string }
        >({
            query: (body) => ({
                url: "auth/password-reset/confirm",
                method: "POST",
                body,
            }),
        }),
    }),
});

export const {
    useRequestPasswordResetMutation,
    useValidatePasswordResetTokenQuery,
    useConfirmPasswordResetMutation,
} = passwordResetApi;
