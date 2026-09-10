import IBillPaymentReport from "../../../interfaces/IBillPaymentReport";
import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["billPaymentReport"],
});

export interface BillPaymentReportResType extends BasicResType {
  content: IBillPaymentReport;
}

export interface BillPaymentReportParams {
  /** Any date within the first month of the range, as "YYYY-MM-DD". */
  from: string;
  /** Any date within the last month of the range, as "YYYY-MM-DD". */
  to: string;
}

export const billPaymentReportApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    getBillPaymentReport: builder.query<BillPaymentReportResType, BillPaymentReportParams>({
      query: (params) => ({
        url: `/ac/reports/bill-payments`,
        method: "GET",
        params,
      }),
      providesTags: ["billPaymentReport"],
    }),
  }),
});

export const { useGetBillPaymentReportQuery } = billPaymentReportApi;

export default billPaymentReportApi;
