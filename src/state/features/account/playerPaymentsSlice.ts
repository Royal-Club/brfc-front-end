import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

/**
 * One line of a player's own payment history, mirroring the backend
 * PlayerPaymentResponse. `amount` is this player's share of the collection
 * (not the batch total), and `monthOfPayment` is the month the dues are for.
 */
export interface IPlayerPayment {
  collectionId: number;
  transactionId: string;
  monthOfPayment: string;
  date: string;
  amount: number;
  description?: string;
}

export interface PlayerPaymentsResType extends BasicResType {
  content: IPlayerPayment[];
}

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["playerPayments"],
});

export const playerPaymentsApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * A single player's payment history, newest month first.
     * Backend enforces access: players may only read their own; admins anyone's.
     */
    getPlayerPayments: builder.query<PlayerPaymentsResType, { playerId: number }>({
      query: ({ playerId }) => ({
        url: `/ac/collections/player/${playerId}`,
        method: "GET",
      }),
      providesTags: ["playerPayments"],
    }),
  }),
});

export const { useGetPlayerPaymentsQuery } = playerPaymentsApi;

export default playerPaymentsApi;
