import { apiTags } from "@/utils/constant";
import { baseApi } from "./baseApi";

export const requestsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllRequests: builder.query({
      query: (params) => ({
        url: "/requests",
        method: "GET",
        params,
      }),
      providesTags: [apiTags.REQUESTS],
    }),
    getRequestById: builder.query({
      query: (id) => ({
        url: `/requests/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: apiTags.REQUESTS, id }],
    }),
    createRequest: builder.mutation({
      query: (requestData) => ({
        url: "/requests",
        method: "POST",
        data: requestData,
      }),
      invalidatesTags: [apiTags.REQUESTS],
    }),
    updateRequest: builder.mutation({
      query: ({ id, ...requestData }) => ({
        url: `/requests/${id}`,
        method: "PATCH",
        data: requestData,
      }),
      invalidatesTags: (result, error, { id }) => [
        apiTags.REQUESTS,
        { type: apiTags.REQUESTS, id },
      ],
    }),
    deleteRequest: builder.mutation({
      query: (id) => ({
        url: `/requests/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [apiTags.REQUESTS],
    }),
    // New endpoint for request action (approve/reject)
    requestAction: builder.mutation({
      query: ({ id, approvalFlow }) => ({
        url: `/requests/${id}/action`,
        method: "PATCH",
        data: { approvalFlow },
      }),
      invalidatesTags: (result, error, { id }) => [
        apiTags.REQUESTS,
        { type: apiTags.REQUESTS, id },
      ],
    }),
    // New endpoint for uploading documents to a request
    uploadRequestDocuments: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/requests/${id}`,
        method: "POST",
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      }),
      invalidatesTags: (result, error, { requestId }) => [
        apiTags.REQUESTS,
        { type: apiTags.REQUESTS, id: requestId },
      ],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetAllRequestsQuery,
  useGetRequestByIdQuery,
  useCreateRequestMutation,
  useUpdateRequestMutation,
  useDeleteRequestMutation,
  useRequestActionMutation,
  useUploadRequestDocumentsMutation,
} = requestsApi;

// Export the reducer to be included in the store
export default requestsApi.reducer;
