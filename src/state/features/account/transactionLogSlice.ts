import ITransactionLog, { TransactionLogSource } from "../../../interfaces/ITransactionLog";
import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["transactionLog"],
});

export interface TransactionLogResType extends BasicResType {
  content: ITransactionLog;
}

export interface TransactionLogParams {
  /** First date included, as "YYYY-MM-DD". */
  from: string;
  /** Last date included, as "YYYY-MM-DD". */
  to: string;
  /**
   * Which kinds of movement to include. Omit for all of them.
   *
   * fetchBaseQuery joins the array with commas, which is exactly what Spring reads back into a
   * Set<TransactionLogSource> — so no manual serialisation is needed here.
   */
  sources?: TransactionLogSource[];
  /** Matched against reference, description, party and who entered the row. */
  search?: string;
  /** Zero-based. */
  page?: number;
  size?: number;
}

export const transactionLogApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    getTransactionLog: builder.query<TransactionLogResType, TransactionLogParams>({
      query: (params) => ({
        url: `/ac/transaction-logs`,
        method: "GET",
        params,
      }),
      providesTags: ["transactionLog"],
    }),
  }),
});

export const { useGetTransactionLogQuery, useLazyGetTransactionLogQuery } = transactionLogApi;

export default transactionLogApi;
