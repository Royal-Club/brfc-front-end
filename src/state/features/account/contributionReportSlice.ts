import IContributionReport from "../../../interfaces/IContributionReport";
import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["contributionReport"],
});

export interface ContributionReportResType extends BasicResType {
  content: IContributionReport;
}

export interface ContributionReportParams {
  /** Any date within the first month of the range, as "YYYY-MM-DD". */
  from: string;
  /** Any date within the last month of the range, as "YYYY-MM-DD". */
  to: string;
  activeOnly: boolean;
}

export const contributionReportApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    getContributionReport: builder.query<ContributionReportResType, ContributionReportParams>({
      query: (params) => ({
        url: `/ac/reports/contributions`,
        method: "GET",
        params,
      }),
      providesTags: ["contributionReport"],
    }),
  }),
});

export const { useGetContributionReportQuery } = contributionReportApi;

export default contributionReportApi;
