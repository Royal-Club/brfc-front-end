import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
    addTagTypes: ["roles"],
});

export interface Role {
    id: number;
    name: string;
}

export interface RolesListResType extends BasicResType {
    content: Role[];
}

export interface AssignRolesPayload {
    playerRoleMappings: {
        [playerId: string]: number[];
    };
    /**
     * Which cash account each player should hold, for players being made an ACCOUNTANT.
     * Omitting a player means "open a new account for them".
     */
    cashAccountSelections?: {
        [playerId: string]: number;
    };
}

export interface CashAccountOption {
    id: number;
    code: string;
    name: string;
    /** Null when the account is free to assign. */
    holderId: number | null;
    holderName: string | null;
    balance: number;
}

export interface CashAccountOptionsResType extends BasicResType {
    content: CashAccountOption[];
}

export const rolesApi = apiWithTags.injectEndpoints({
    endpoints: (build) => ({
        getRoles: build.query<RolesListResType, void>({
            query: () => "/roles",
            providesTags: ["roles"],
        }),
        assignRoles: build.mutation<BasicResType, AssignRolesPayload>({
            query: (data) => ({
                url: "roles/assign",
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["roles"],
        }),
        getAssignableCashAccounts: build.query<CashAccountOptionsResType, void>({
            query: () => "/roles/cash-accounts",
            providesTags: ["roles"],
        }),
        getPlayerRoles: build.query<RolesListResType, { playerId: number }>({
            query: ({ playerId }) => `/players/${playerId}/roles`,
            providesTags: ["roles"],
        }),
    }),
});

export const {
    useGetRolesQuery,
    useAssignRolesMutation,
    useGetPlayerRolesQuery,
    useGetAssignableCashAccountsQuery,
} = rolesApi;
