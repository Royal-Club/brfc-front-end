import IMyCashInHand from "../../../interfaces/IMyCashInHand";
import apiSlice from "../../api/apiSlice";
import { BasicResType } from "../../responesTypes";

const apiWithTags = apiSlice.enhanceEndpoints({
  addTagTypes: ["myCashInHand"],
});

export interface MyCashInHandResType extends BasicResType {
  content: IMyCashInHand;
}

export const myCashInHandApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    // Scoped to the signed-in member by the server. There is deliberately no id parameter, so
    // one custodian cannot read another's pocket.
    getMyCashInHand: builder.query<MyCashInHandResType, void>({
      query: () => ({
        url: `/ac/reports/my-cash-in-hand`,
        method: "GET",
      }),
      providesTags: ["myCashInHand"],
    }),
  }),
});

export const { useGetMyCashInHandQuery } = myCashInHandApi;

export default myCashInHandApi;
