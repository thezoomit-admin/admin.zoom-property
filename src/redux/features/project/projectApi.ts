import { baseApi } from "../../api/baseApi";

const projectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query({
      query: (params: any) => {
        const q = new URLSearchParams();
        if (params) {
          if (params.page) q.append("page", String(params.page));
          if (params.limit) q.append("limit", String(params.limit));
          if (params.searchTerm) q.append("searchTerm", params.searchTerm);
          if (params.stage) q.append("stage", params.stage);
          if (params.area) q.append("area", params.area);
          if (params.activeOnly) q.append("activeOnly", "true");
        }
        return { url: `projects?${q.toString()}`, method: "GET" };
      },
      transformResponse: (r: { data: any[]; meta: any }) => ({
        result: r.data || [],
        meta: r.meta || {},
      }),
      providesTags: ["projects"],
    }),

    getProjectById: builder.query({
      query: (id: string) => ({ url: `projects/${id}`, method: "GET" }),
      transformResponse: (r: { data: any }) => r.data,
      providesTags: ["projects"],
    }),

    createProject: builder.mutation({
      query: (body) => ({ url: "projects", method: "POST", body }),
      invalidatesTags: ["projects"],
    }),

    updateProject: builder.mutation({
      query: ({ id, data }: { id: string; data: any }) => ({
        url: `projects/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["projects"],
    }),

    deleteProject: builder.mutation({
      query: (id: string) => ({ url: `projects/${id}`, method: "DELETE" }),
      invalidatesTags: ["projects"],
    }),

    getProjectLanding: builder.query({
      query: (id: string) => ({ url: `projects/${id}/landing`, method: "GET" }),
      transformResponse: (r: { data: any }) => r.data,
      providesTags: ["projects"],
    }),

    saveProjectLanding: builder.mutation({
      query: ({ id, data }: { id: string; data: any }) => ({
        url: `projects/${id}/landing`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["projects"],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectLandingQuery,
  useSaveProjectLandingMutation,
} = projectApi;
