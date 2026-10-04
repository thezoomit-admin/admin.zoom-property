import { Button, Form, Input, List, Modal, Popconfirm, Space, Switch } from "antd";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

import {
  useCreateBlogCategoryMutation,
  useDeleteBlogCategoryMutation,
  useGetBlogCategoriesQuery,
  useUpdateBlogCategoryMutation,
} from "../../redux/features/blog/blogApi";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * The category list, edited in place.
 *
 * A category is a name and a switch, so a page of its own would be a page with
 * two fields on it. Deleting one that articles still use is refused by the
 * server — an article with no category falls out of every filter on the blog
 * index and is then only reachable by a URL nobody has.
 */
const BlogCategoriesModal = ({ open, onClose }: Props) => {
  const [form] = Form.useForm();
  const { data: categories = [], isFetching } = useGetBlogCategoriesQuery({});
  const [createCategory, { isLoading: creating }] =
    useCreateBlogCategoryMutation();
  const [updateCategory] = useUpdateBlogCategoryMutation();
  const [deleteCategory] = useDeleteBlogCategoryMutation();
  const [busyId, setBusyId] = useState<string | null>(null);

  const onAdd = async (values: any) => {
    try {
      await createCategory(values).unwrap();
      toast.success("Category added");
      form.resetFields();
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

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Blog categories"
      footer={null}
      width={560}
      destroyOnClose
    >
      <Form form={form} layout="inline" onFinish={onAdd} className="!mb-4 gap-2">
        <Form.Item
          name="name"
          rules={[{ required: true, message: "Name it" }]}
          className="!flex-1"
        >
          <Input placeholder="Market" />
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

      <List
        loading={isFetching}
        dataSource={categories as any[]}
        locale={{ emptyText: "No categories yet" }}
        renderItem={(c: any) => (
          <List.Item
            actions={[
              <Switch
                key="active"
                size="small"
                checked={c.isActive}
                loading={busyId === c._id}
                onChange={() => onToggle(c._id, c.isActive)}
              />,
              <Popconfirm
                key="delete"
                title="Delete this category?"
                onConfirm={() => onDelete(c._id)}
              >
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<Trash2 className="h-4 w-4" />}
                />
              </Popconfirm>,
            ]}
          >
            <Space direction="vertical" size={0}>
              <span className="font-medium text-secondary-800">{c.name}</span>
              {c.nameBn && (
                <span className="text-xs text-secondary-400">{c.nameBn}</span>
              )}
            </Space>
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default BlogCategoriesModal;
