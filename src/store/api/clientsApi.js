import { apiTags, roles } from "@/utils/constant";
import { baseApi } from "./baseApi";

export const clientsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllClients: builder.query({
      query: (params) => ({
        url: "/users",
        method: "GET",
        params: { ...params, role: roles?.CLIENT },
      }),
      providesTags: [apiTags.CLIENTS],
    }),
    getClientById: builder.query({
      query: (id) => ({
        url: `users/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: apiTags.CLIENTS, id }],
    }),
    createClient: builder.mutation({
      query: (userData) => ({
        url: "users",
        method: "POST",
        data: { ...userData, role: roles.CLIENT },
      }),
      invalidatesTags: [apiTags.CLIENTS],
    }),
    updateClient: builder.mutation({
      query: ({ id, ...userData }) => ({
        url: `users/${id}`,
        method: "PATCH",
        data: userData,
      }),
      invalidatesTags: (result, error, { id }) => [
        apiTags.CLIENTS,
        { type: apiTags.CLIENTS, id },
      ],
    }),
    deleteClient: builder.mutation({
      query: (id) => ({
        url: `users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [apiTags.CLIENTS],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetAllClientsQuery,
  useGetClientByIdQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} = clientsApi;

// Export the reducer to be included in the store
export default clientsApi.reducer;
