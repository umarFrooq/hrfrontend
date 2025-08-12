import { apiTags } from "@/utils/constant";
import { baseApi } from "./baseApi";

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardAnalytics: builder.query({
      query: (params) => ({
        url: "/analytics/dashboard",
        method: "GET",
        params,
      }),
      providesTags: [apiTags.ANALYTICS],
    }),
  }),
});

// Export hooks for usage in functional components
export const { useGetDashboardAnalyticsQuery } = analyticsApi;

// Export the reducer to be included in the store
export default analyticsApi.reducer;
