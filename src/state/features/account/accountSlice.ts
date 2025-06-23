import apiSlice from "../../api/apiSlice";
import IAcCollection from "../../../interfaces/IAcCollection";
import IPlayer from "../../../interfaces/IPlayer";
import IAcChart from "../../../interfaces/IAcChart";
import IAcNature from "../../../interfaces/IAcNature";
import IAcVoucherType from "../../../interfaces/IAcVoucherType";
import IAccountsReport from "../../../interfaces/IAccountsReport";
import IAccountBalanceSummary from "../../../interfaces/IAccountBalanceSummary";
import IBalanceSheetReport from "../../../interfaces/IBalanceSheetReport";
// import IAccountSummaryResponse from "../../../interfaces/AccountSummaryResponse";
export interface BasicResType<T> {
  message: string;
  statusCode: number;
  timeStamp: string;
  status: boolean;
  content: T;
}

const acCollectionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch AC Collection list
    getAcCollections: builder.query<BasicResType<IAcCollection[]>, void>({
      query: () => ({
        url: `/ac/collections`,
        method: "GET",
      }),
    }),

    // Create new AC Collection
    createAcCollection: builder.mutation<
      BasicResType<IAcCollection>,
      Partial<IAcCollection>
    >({
      query: (data) => ({
        url: `/ac/collections`,
        method: "POST",
        body: data,
      }),
    }),

    // Update existing AC Collection
    updateAcCollection: builder.mutation<
      BasicResType<IAcCollection>,
      { id: number; data: Partial<IAcCollection> }
    >({
      query: ({ id, data }) => ({
        url: `/ac/collections/${id}`,
        method: "PUT",
        body: data,
      }),
    }),

    // Fetch player list
    getPlayers: builder.query<BasicResType<IPlayer[]>, void>({
      query: () => ({
        url: `/players`,
        method: "GET",
      }),
    }),

    // Fetch specific AC Collection by ID
    getAcCollectionById: builder.query<BasicResType<IAcCollection>, number>({
      query: (id) => ({
        url: `/ac/collections/${id}`,
        method: "GET",
      }),
    }),

    getAcChartList: builder.query<BasicResType<IAcChart[]>, void>({
      query: () => ({
        url: `/ac/charts`,
        method: "GET",
      }),
    }),

    getAcReportList: builder.query<BasicResType<IAccountsReport[]>, void>({
      query: () => ({
        url: `/ac/reports/accounts-summary`,
        method: "GET",
      }),
    }),

    getAcBalanceSummaryList: builder.query<BasicResType<IAccountBalanceSummary[]>, void>({
      query: () => ({
        url: `/ac/reports/balance-summary`,
        method: "GET",
      }),
    }),
    getAcBalanceSheetList: builder.query<BasicResType<IBalanceSheetReport[]>, void>({
      query: () => ({
        url: `/ac/reports/balance-sheet`,
        method: "GET",
      }),
    }),
    getAcNatureList: builder.query<BasicResType<IAcNature[]>, void>({
      query: () => ({
        url: `/ac/natures`,
        method: "GET",
      }),
    }),
    getAcVoucherTypeList: builder.query<BasicResType<IAcVoucherType[]>, void>({
      query: () => ({
        url: `/ac/voucher-types`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useGetAcCollectionsQuery,
  // removed useGetAcSummaryQuery as it's now in accountSummarySlice
  useCreateAcCollectionMutation,
  useUpdateAcCollectionMutation,
  useGetPlayersQuery,
  useGetAcCollectionByIdQuery,
  useGetAcChartListQuery,
  useGetAcNatureListQuery,
  useGetAcVoucherTypeListQuery,
  useGetAcReportListQuery,
  useGetAcBalanceSummaryListQuery,
  useGetAcBalanceSheetListQuery,
} = acCollectionApi;

