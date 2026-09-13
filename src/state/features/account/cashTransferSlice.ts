import ICashTransferOptions, {
  CashTransferPayload,
  IPendingCashTransfers,
} from "../../../interfaces/ICashTransfer";
import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: [
    "cashTransfer",
    "pendingCashTransfers",
    "myCashInHand",
    "cashPosition",
    "accountSummary",
  ],
});

export interface CashTransferOptionsResType extends BasicResType {
  content: ICashTransferOptions;
}

export interface PendingCashTransfersResType extends BasicResType {
  content: IPendingCashTransfers;
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
    // Handovers waiting on the signed-in member, both offered to them and by them.
    getPendingCashTransfers: builder.query<PendingCashTransfersResType, void>({
      query: () => ({
        url: `/ac/cash-transfers/pending`,
        method: "GET",
      }),
      providesTags: ["pendingCashTransfers"],
    }),
    // Offering only creates a pending record; nothing moves until the receiver accepts.
    transferCash: builder.mutation<BasicResType, CashTransferPayload>({
      query: (body) => ({
        url: `/ac/cash-transfers`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["pendingCashTransfers"],
    }),
    // Accepting is the one moment the ledger moves, so every view of the club's cash is now stale.
    acceptCashTransfer: builder.mutation<BasicResType, number>({
      query: (id) => ({
        url: `/ac/cash-transfers/${id}/accept`,
        method: "POST",
      }),
      invalidatesTags: [
        "pendingCashTransfers",
        "myCashInHand",
        "cashPosition",
        "accountSummary",
      ],
    }),
    rejectCashTransfer: builder.mutation<BasicResType, { id: number; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/ac/cash-transfers/${id}/reject`,
        method: "POST",
        body: reason ? { reason } : undefined,
      }),
      invalidatesTags: ["pendingCashTransfers"],
    }),
    cancelCashTransfer: builder.mutation<BasicResType, number>({
      query: (id) => ({
        url: `/ac/cash-transfers/${id}/cancel`,
        method: "POST",
      }),
      invalidatesTags: ["pendingCashTransfers"],
    }),
  }),
});

export const {
  useGetCashTransferOptionsQuery,
  useGetPendingCashTransfersQuery,
  useTransferCashMutation,
  useAcceptCashTransferMutation,
  useRejectCashTransferMutation,
  useCancelCashTransferMutation,
} = cashTransferApi;

export default cashTransferApi;
