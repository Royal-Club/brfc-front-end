import apiSlice from "../../api/apiSlice";
import IAcCollection from "../../../interfaces/IAcCollection";
import IPlayer from "../../../interfaces/IPlayer";
import IAcChart from "../../../interfaces/IAcChart";
import IAcNature from "../../../interfaces/IAcNature";
import ICostType from "../../../interfaces/ICostType";
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
const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["acChart", "costType"],
});

/** Body accepted by both the create and the update cost type endpoints. */
export interface CostTypeRequest {
  name: string;
  description: string;
  /** The expense account the type posts to. The column is NOT NULL, so this is not optional. */
  chartId: number;
}

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

    getCostTypeList: builder.query<BasicResType<ICostType[]>, void>({
      query: () => ({
        url: `/cost-types`,
        method: "GET",
      }),
      providesTags: ["costType"],
    }),

    /** Returns the created type, id included, so a form creating one inline can select it. */
    createCostType: builder.mutation<BasicResType<ICostType>, CostTypeRequest>({
      query: (data) => ({
        url: `/cost-types`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["costType"],
    }),

    updateCostType: builder.mutation<
      BasicResType<ICostType>,
      { id: number; data: CostTypeRequest }
    >({
      query: ({ id, data }) => ({
        url: `/cost-types/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["costType"],
    }),

    /** Deactivating is how a type already used by a payment is retired. */
    updateCostTypeStatus: builder.mutation<
      BasicResType<null>,
      { id: number; isActive: boolean }
    >({
      query: ({ id, isActive }) => ({
        url: `/cost-types/${id}/status?isActive=${isActive}`,
        method: "PUT",
      }),
      invalidatesTags: ["costType"],
    }),

    /** Only succeeds for a type nothing has been filed under; the server rejects the rest. */
    deleteCostType: builder.mutation<BasicResType<null>, number>({
      query: (id) => ({
        url: `/cost-types/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["costType"],
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
  useGetCostTypeListQuery,
  useCreateCostTypeMutation,
  useUpdateCostTypeMutation,
  useUpdateCostTypeStatusMutation,
  useDeleteCostTypeMutation,
} = acCollectionApi;

