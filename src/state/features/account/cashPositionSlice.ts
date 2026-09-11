import ICashPosition from "../../../interfaces/ICashPosition";
import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["cashPosition"],
});

export interface CashPositionResType extends BasicResType {
  content: ICashPosition;
}

export const cashPositionApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    getCashPosition: builder.query<CashPositionResType, void>({
      query: () => ({
        url: `/ac/reports/cash-position`,
        method: "GET",
      }),
      providesTags: ["cashPosition"],
    }),
  }),
});

export const { useGetCashPositionQuery } = cashPositionApi;

export default cashPositionApi;
