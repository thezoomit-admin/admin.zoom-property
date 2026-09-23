import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
} from "antd";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import LangInput from "../../components/Common/LangInput";
import PermissionGate from "../../components/Common/PermissionGate";
import UploadMedia from "../../components/shared/UploadMedia";
import AntImage from "../../components/shared/AntImage";
import {
  useCreateSubAreaMutation,
  useDeleteSubAreaMutation,
  useGetSubAreasQuery,
  useUpdateSubAreaMutation,
} from "../../redux/features/subArea/subAreaApi";
import { mediaSrc } from "../../utils/mediaSrc";

const { confirm } = Modal;

/**
 * Sub-areas that sit under one neighbourhood — managed from the Area edit page.
 */
const AreaSubAreasPanel = ({
  areaId,
  areaName,
}: {
  areaId: string;
  areaName?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading } = useGetSubAreasQuery(
    { area: areaId, limit: 200, sort: "order" },
    { skip: !areaId },
  );
  const [createSubArea, { isLoading: creating }] = useCreateSubAreaMutation();
  const [updateSubArea, { isLoading: updating }] = useUpdateSubAreaMutation();
  const [deleteSubArea] = useDeleteSubAreaMutation();

  const rows = data?.result ?? [];
  const saving = creating || updating;

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const img = editing.image;
      form.setFieldsValue({
        ...editing,
        image: img?._id ?? img,
        imageUrl: mediaSrc(img) || undefined,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ isActive: true, area: areaId });
    }
  }, [open, editing, areaId, form]);

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setOpen(true);
  };

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      const { imageUrl, ...rest } = values;
      void imageUrl;
      const body = { ...rest, area: areaId };
      if (editing?._id) {
        await updateSubArea({ id: editing._id, data: body }).unwrap();
        toast.success("Sub-area updated");
      } else {
        await createSubArea(body).unwrap();
        toast.success("Sub-area created");
      }
      setOpen(false);
      setEditing(null);
    } catch (e: any) {
      if (e?.errorFields) return;
      toast.error(e?.data?.message || "Could not save sub-area");
    }
  };

  const onDelete = (row: any) =>
    confirm({
      title: "Delete this sub-area?",
      content: `"${row.name}" will be removed. Sub-areas with projects cannot be deleted — deactivate instead.`,
      okText: "Yes, delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteSubArea(row._id).unwrap();
          toast.success("Sub-area deleted");
        } catch (e: any) {
          toast.error(e?.data?.message || "Could not delete sub-area");
        }
      },
    });

  const onToggleActive = async (row: any, value: boolean) => {
    try {
      await updateSubArea({
        id: row._id,
        data: { isActive: value },
      }).unwrap();
      toast.success("Status updated");
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not update status");
    }
  };

  const columns = [
    {
      title: "Order",
      dataIndex: "order",
      width: 80,
      align: "center" as const,
    },
    {
      title: "Sub-area",
      key: "name",
      render: (_: unknown, r: any) => (
        <div className="flex items-center gap-3">
          <AntImage
            src={mediaSrc(r.image)}
            alt={r.name}
            className="size-10 rounded object-cover"
          />
          <div>
            <div className="font-medium text-gray-900">{r.name}</div>
            {r.nameBn ? (
              <div className="text-xs text-gray-500">{r.nameBn}</div>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      title: "Projects",
      dataIndex: "projectCount",
      width: 100,
      align: "center" as const,
      render: (n: number) => <Tag>{n ?? 0}</Tag>,
    },
    {
      title: "Active",
      dataIndex: "isActive",
      width: 90,
      render: (v: boolean, r: any) => (
        <Switch
          checked={v}
          size="small"
          onChange={(checked) => onToggleActive(r, checked)}
        />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 100,
      render: (_: unknown, r: any) => (
        <Space>
          <PermissionGate module="Areas" action="update">
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<Edit className="size-4" />}
                onClick={() => openEdit(r)}
              />
            </Tooltip>
          </PermissionGate>
          <PermissionGate module="Areas" action="delete">
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                danger
                icon={<Trash2 className="size-4" />}
                onClick={() => onDelete(r)}
              />
            </Tooltip>
          </PermissionGate>
        </Space>
      ),
    },
  ];

  return (
    <div className="mt-8 rounded-lg border border-gray-300 bg-white p-5 shadow-xs">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-base font-semibold text-gray-900">
            Sub-areas
            {areaName ? (
              <span className="font-normal text-gray-500"> · {areaName}</span>
            ) : null}
          </h3>
          <p className="mt-0.5 text-sm text-gray-500">
            Pockets inside this neighbourhood. The website shows them on the
            area page; projects can be assigned to one.
          </p>
        </div>
        <PermissionGate module="Areas" action="create">
          <Button type="primary" icon={<Plus className="size-4" />} onClick={openCreate}>
            Add sub-area
          </Button>
        </PermissionGate>
      </div>

      <Table
        rowKey="_id"
        loading={isLoading}
        columns={columns}
        dataSource={rows}
        pagination={false}
        size="middle"
        locale={{ emptyText: "No sub-areas yet — add the first pocket." }}
      />

      <Modal
        title={editing ? `Edit: ${editing.name}` : "New sub-area"}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
        }}
        onOk={onSave}
        confirmLoading={saving}
        okText={editing ? "Save" : "Create"}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="area" hidden>
            <Input />
          </Form.Item>
          <LangInput
            label="Name (English)"
            name="name"
            lang="en"
            required
            placeholder="e.g. Town Hall"
          />
          <LangInput
            label="Name (Bangla)"
            name="nameBn"
            lang="bn"
            sourceFieldName="name"
            form={form}
            placeholder="যেমন: টাউন হল"
          />
          <LangInput
            label="Tagline (English)"
            name="tagline"
            lang="en"
            placeholder="Short line under the name"
          />
          <LangInput
            label="Tagline (Bangla)"
            name="taglineBn"
            lang="bn"
            sourceFieldName="tagline"
            form={form}
          />
          <Form.Item label="Photo" name="imageUrl">
            <UploadMedia
              form={form}
              fieldPath="imageUrl"
              idFieldPath="image"
              type="image"
            />
          </Form.Item>
          <Form.Item name="image" hidden>
            <Input />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="Order" name="order">
              <InputNumber className="w-full" min={1} placeholder="Auto" />
            </Form.Item>
            <Form.Item
              label="Active"
              name="isActive"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AreaSubAreasPanel;
