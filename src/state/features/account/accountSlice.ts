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

/** Chart rows are edited from the Chart of Accounts screen, so the list has to refetch itself
 *  after a create or an edit rather than showing the account the user just added as missing. */
const apiWithTags = apiSlice.enhanceEndpoints({ addTagTypes: ["acChart"] });

/** Body accepted by both the create and the update chart endpoints. */
export interface AcChartRequest {
  name: string;
  code: string;
  description?: string;
  natureId: number;
  parentId?: number | null;
}

const acCollectionApi = apiWithTags.injectEndpoints({
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
      providesTags: ["acChart"],
    }),

    createAcChart: builder.mutation<BasicResType<number>, AcChartRequest>({
      query: (data) => ({
        url: `/ac/charts`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["acChart"],
    }),

    updateAcChart: builder.mutation<
      BasicResType<number>,
      { id: number; data: AcChartRequest }
    >({
      query: ({ id, data }) => ({
        url: `/ac/charts/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["acChart"],
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
  useCreateAcChartMutation,
  useUpdateAcChartMutation,
} = acCollectionApi;

