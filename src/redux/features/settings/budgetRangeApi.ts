import { baseApi } from "../../api/baseApi";

export interface IBudgetRange {
  _id?: string;
  name: string;
  nameBn?: string;
  value: string;
  order?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const budgetRangeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBudgetRanges: builder.query({
      query: (params: { keyword?: string; isActive?: string } = {}) => {
        const search = new URLSearchParams();
        if (params.keyword) search.set("keyword", params.keyword);
        if (params.isActive !== undefined && params.isActive !== "")
          search.set("isActive", params.isActive);
        const qs = search.toString();
        return {
          url: `/budget-ranges${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["budget-ranges"],
    }),

    createBudgetRange: builder.mutation({
      query: (data: Partial<IBudgetRange>) => ({
        url: "/budget-ranges",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["budget-ranges"],
    }),

    updateBudgetRange: builder.mutation({
      query: ({
        id,
        data,
      }: {
        id: string;
        data: Partial<IBudgetRange>;
      }) => ({
        url: `/budget-ranges/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["budget-ranges"],
    }),

    deleteBudgetRange: builder.mutation({
      query: (id: string) => ({
        url: `/budget-ranges/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["budget-ranges"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBudgetRangesQuery,
  useCreateBudgetRangeMutation,
  useUpdateBudgetRangeMutation,
  useDeleteBudgetRangeMutation,
} = budgetRangeApi;
