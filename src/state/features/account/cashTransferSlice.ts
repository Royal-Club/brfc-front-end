import ICashTransferOptions, { CashTransferPayload } from "../../../interfaces/ICashTransfer";
import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["cashTransfer", "myCashInHand", "cashPosition", "accountSummary"],
});

export interface CashTransferOptionsResType extends BasicResType {
  content: ICashTransferOptions;
}

export const cashTransferApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    getCashTransferOptions: builder.query<CashTransferOptionsResType, void>({
      query: () => ({
        url: `/ac/cash-transfers/options`,
        method: "GET",
      }),
      providesTags: ["cashTransfer"],
    }),
    transferCash: builder.mutation<BasicResType, CashTransferPayload>({
      query: (body) => ({
        url: `/ac/cash-transfers`,
        method: "POST",
        body,
      }),
      // Both custodians' balances moved, so every view of the club's cash is now stale.
      invalidatesTags: ["cashTransfer", "myCashInHand", "cashPosition", "accountSummary"],
    }),
  }),
});

export const { useGetCashTransferOptionsQuery, useTransferCashMutation } = cashTransferApi;

export default cashTransferApi;
