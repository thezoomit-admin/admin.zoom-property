import { baseApi } from "../../api/baseApi";

const subAreaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSubAreas: builder.query({
      query: (params: any) => {
        const q = new URLSearchParams();
        if (params) {
          if (params.page) q.append("page", String(params.page));
          if (params.limit) q.append("limit", String(params.limit));
          if (params.searchTerm) q.append("searchTerm", params.searchTerm);
          if (params.area) q.append("area", String(params.area));
          if (params.activeOnly) q.append("activeOnly", "true");
          if (params.sort) q.append("sort", String(params.sort));
        }
        return { url: `sub-areas?${q.toString()}`, method: "GET" };
      },
      transformResponse: (r: { data: any[]; meta: any }) => ({
        result: r.data || [],
        meta: r.meta || {},
      }),
      providesTags: ["sub-areas"],
    }),

    getSubAreaById: builder.query({
      query: (id: string) => ({ url: `sub-areas/${id}`, method: "GET" }),
      transformResponse: (r: { data: any }) => r.data,
      providesTags: ["sub-areas"],
    }),

    createSubArea: builder.mutation({
      query: (body) => ({ url: "sub-areas", method: "POST", body }),
      invalidatesTags: ["sub-areas"],
    }),

    updateSubArea: builder.mutation({
      query: ({ id, data }: { id: string; data: any }) => ({
        url: `sub-areas/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["sub-areas"],
    }),

    deleteSubArea: builder.mutation({
      query: (id: string) => ({ url: `sub-areas/${id}`, method: "DELETE" }),
      invalidatesTags: ["sub-areas"],
    }),
  }),
});

export const {
  useGetSubAreasQuery,
  useGetSubAreaByIdQuery,
  useCreateSubAreaMutation,
  useUpdateSubAreaMutation,
  useDeleteSubAreaMutation,
} = subAreaApi;
