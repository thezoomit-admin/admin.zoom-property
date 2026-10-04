import { Button, Form, Input, Popconfirm, Switch, Tag } from "antd";
import { Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";

import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import DataTable from "../../components/Table/DataTable";
import {
  useCreateBlogCategoryMutation,
  useDeleteBlogCategoryMutation,
  useGetBlogCategoriesQuery,
  useUpdateBlogCategoryMutation,
} from "../../redux/features/blog/blogApi";

/**
 * Blog categories.
 *
 * The shared `DataTable` rather than a list: the categories outgrew a column
 * of rows in a narrow card, and every other list in the panel is this table —
 * same paging control, same search box, same row height.
 *
 * The whole set arrives in one request (there are never many), so the search
 * and the paging both run here rather than round-tripping the API for a list
 * that is already in memory.
 */
const BlogCategories = () => {
  const [form] = Form.useForm();
  const { data: categories = [], isFetching } = useGetBlogCategoriesQuery({});
  const [createCategory, { isLoading: creating }] =
    useCreateBlogCategoryMutation();
  const [updateCategory] = useUpdateBlogCategoryMutation();
  const [deleteCategory] = useDeleteBlogCategoryMutation();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return categories as any[];
    return (categories as any[]).filter((c) =>
      [c.name, c.nameBn, c.slug]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(term)),
    );
  }, [categories, search]);

  const visible = useMemo(
    () => filtered.slice((page - 1) * limit, page * limit),
    [filtered, page, limit],
  );

  const onAdd = async (values: any) => {
    try {
      await createCategory(values).unwrap();
      toast.success("Category added");
      form.resetFields();
      // A new category lands at the end of the list, so jump to where it is.
      setPage(Math.max(1, Math.ceil((filtered.length + 1) / limit)));
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not add the category");
    }
  };

  const onToggle = async (id: string, isActive: boolean) => {
    setBusyId(id);
    try {
      await updateCategory({ id, data: { isActive: !isActive } }).unwrap();
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not update the category");
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteCategory(id).unwrap();
      toast.success("Category deleted");
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not delete the category");
    }
  };

  const columns = [
    {
      title: "Category",
      dataIndex: "name",
      key: "name",
      render: (_: unknown, c: any) => (
        <div className="flex flex-col">
          <span className="font-medium text-secondary-800">{c.name}</span>
          {c.nameBn ? (
            <span className="text-xs text-secondary-400">{c.nameBn}</span>
          ) : null}
        </div>
      ),
    },
    {
      title: "Slug",
      dataIndex: "slug",
      key: "slug",
      width: 220,
      render: (slug?: string) =>
        slug ? (
          <code className="rounded bg-secondary-50 px-1.5 py-0.5 text-xs text-secondary-600">
            {slug}
          </code>
        ) : (
          <span className="text-secondary-300">—</span>
        ),
    },
    {
      title: "Published",
      key: "isActive",
      width: 140,
      align: "center" as const,
      render: (_: unknown, c: any) => (
        <div className="flex items-center justify-center gap-2">
          <Switch
            size="small"
            checked={c.isActive}
            loading={busyId === c._id}
            onChange={() => onToggle(c._id, c.isActive)}
          />
          <Tag color={c.isActive ? "green" : "default"} className="!m-0">
            {c.isActive ? "Live" : "Hidden"}
          </Tag>
        </div>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 70,
      align: "center" as const,
      fixed: "right" as const,
      render: (_: unknown, c: any) => (
        <Popconfirm
          title="Delete this category?"
          description="Articles already using it keep their category name."
          okText="Delete"
          okButtonProps={{ danger: true }}
          onConfirm={() => onDelete(c._id)}
        >
          <Button type="text" danger size="small" icon={<Trash2 className="h-4 w-4" />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <PageMeta title="Blog Categories · Zoom Property Admin" noindex />
      <PageHeader
        title="Blog Categories"
        subtitle="Manage categories for your blog articles"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Blog", path: "/blog" },
          { title: "Categories" },
        ]}
      />

      <div className="mb-6 rounded-lg border border-secondary-100 bg-white p-4">
        <Form
          form={form}
          layout="inline"
          onFinish={onAdd}
          className="!m-0 flex flex-wrap gap-2"
        >
          <Form.Item
            name="name"
            rules={[{ required: true, message: "Name it" }]}
            className="!m-0 !flex-1 !min-w-56"
          >
            <Input placeholder="Category Name (e.g., Market)" />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<Plus className="h-4 w-4" />}
            loading={creating}
          >
            Add
          </Button>
        </Form>
      </div>

      <div className="mb-4">
        <Input
          allowClear
          placeholder="Search by name or slug"
          prefix={<Search className="h-4 w-4 text-gray-400" />}
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="max-w-sm"
        />
      </div>

      <DataTable
        data={visible}
        columns={columns as any}
        currentPage={page}
        setCurrentPage={setPage}
        limit={limit}
        setLimit={setLimit}
        total={filtered.length}
        isPaginate={filtered.length > limit}
        loading={isFetching}
        rowKey="_id"
      />
    </div>
  );
};

export default BlogCategories;
