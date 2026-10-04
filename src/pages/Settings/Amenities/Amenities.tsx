import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Tooltip,
} from "antd";
import { Edit, Plus, Search, Trash2, icons } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import PageHeader from "../../../components/Common/PageHeader";
import PageMeta from "../../../components/Common/PageMeta";
import PermissionGate from "../../../components/Common/PermissionGate";
import OrderInputCell from "../../../components/shared/OrderInputCell";
import DataTable from "../../../components/Table/DataTable";
import {
  useCreatePropertyOptionMutation,
  useDeletePropertyOptionMutation,
  useGetPropertyOptionsQuery,
  useUpdatePropertyOptionMutation,
} from "../../../redux/features/property/propertyApi";

/** Helper to resolve dynamic Lucide icon by kebab-case or PascalCase name */
const getLucideIcon = (name?: string) => {
  if (!name) return null;
  const clean = name.trim();
  const pascal = clean
    .split(/[-_ ]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");

  return (icons as any)[pascal] || (icons as any)[clean] || null;
};

const AmenityIconBadge = ({ iconName }: { iconName?: string }) => {
  if (!iconName) {
    return <span className="text-secondary-300">—</span>;
  }
  const IconComponent = getLucideIcon(iconName);

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary-100 bg-primary-50 text-primary-600 shadow-xs">
        {IconComponent ? (
          <IconComponent className="h-4 w-4" />
        ) : (
          <span className="font-mono text-xs font-semibold text-secondary-400">?</span>
        )}
      </div>
      <span className="font-mono text-xs text-secondary-600">{iconName}</span>
    </div>
  );
};

/**
 * The amenity list every listing form picks from.
 */
const Amenities = () => {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const iconValue = Form.useWatch("icon", form);

  const { data: optionResult = { rows: [], meta: {} }, isFetching } = useGetPropertyOptionsQuery({
    kind: "amenities",
  });
  const rows = Array.isArray(optionResult) ? optionResult : optionResult.rows;

  const [createOption, { isLoading: creating }] =
    useCreatePropertyOptionMutation();
  const [updateOption, { isLoading: updating }] =
    useUpdatePropertyOptionMutation();
  const [deleteOption] = useDeletePropertyOptionMutation();

  const handleUpdateOrder = async (id: string, nextOrder: number) => {
    return updateOption({
      kind: "amenities",
      id,
      data: { order: nextOrder },
    }).unwrap();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r: any) =>
      [r.name, r.icon, r.description]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(q))
    );
  }, [rows, search]);

  const visible = useMemo(
    () => filtered.slice((page - 1) * limit, page * limit),
    [filtered, page, limit]
  );

  useEffect(() => {
    if (!open) return form.resetFields();
    if (editing) form.setFieldsValue(editing);
  }, [open, editing, form]);

  const onFinish = async (values: any) => {
    try {
      if (editing) {
        await updateOption({
          kind: "amenities",
          id: editing._id,
          data: values,
        }).unwrap();
        toast.success("Amenity updated");
      } else {
        await createOption({ kind: "amenities", data: values }).unwrap();
        toast.success("Amenity added");
      }
      setOpen(false);
      setEditing(null);
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not save the amenity");
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteOption({ kind: "amenities", id }).unwrap();
      toast.success("Amenity deleted");
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not delete the amenity");
    }
  };

  const columns = [
    {
      title: "Amenity",
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <p className="font-medium text-secondary-800">{name}</p>
      ),
    },
    {
      title: "Icon",
      dataIndex: "icon",
      key: "icon",
      width: 200,
      render: (icon: string) => <AmenityIconBadge iconName={icon} />,
    },
    {
      title: "Order",
      dataIndex: "order",
      key: "order",
      width: 140,
      align: "center" as const,
      render: (_: any, record: any, index: number) => (
        <OrderInputCell
          record={record}
          index={index}
          onUpdateOrder={handleUpdateOrder}
        />
      ),
    },
    {
      title: "Active",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (active: boolean, r: any) => (
        <PermissionGate
          module="Properties"
          action="Update"
          fallback={<span>{active ? "Yes" : "No"}</span>}
        >
          <Switch
            size="small"
            checked={active}
            onChange={() =>
              updateOption({
                kind: "amenities",
                id: r._id,
                data: { isActive: !active },
              })
            }
          />
        </PermissionGate>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: unknown, r: any) => (
        <Space>
          <PermissionGate module="Properties" action="Update">
            <Tooltip title="Edit">
              <Button
                icon={<Edit className="h-4 w-4" />}
                onClick={() => {
                  setEditing(r);
                  setOpen(true);
                }}
              />
            </Tooltip>
          </PermissionGate>
          <PermissionGate module="Properties" action="Delete">
            <Popconfirm
              title="Delete this amenity?"
              onConfirm={() => onDelete(r._id)}
            >
              <Button danger icon={<Trash2 className="h-4 w-4" />} />
            </Popconfirm>
          </PermissionGate>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageMeta
        title="Amenities · Zoom Property Admin"
        description="The amenity list every listing form picks from."
        noindex
      />
      <PageHeader
        title="Amenities"
        subtitle="What a listing can say it has"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Settings" },
          { title: "Amenities" },
        ]}
        extra={
          <PermissionGate module="Properties" action="Create">
            <Button
              type="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              Add amenity
            </Button>
          </PermissionGate>
        }
      />

      <div className="mb-6">
        <Input
          allowClear
          placeholder="Search by name, Bangla name or icon"
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

      <Modal
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing ? "Edit amenity" : "Add an amenity"}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ isActive: true, order: 0 }}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Name the amenity" }]}
          >
            <Input placeholder="Lift" />
          </Form.Item>
          <Form.Item
            label="Icon"
            name="icon"
            tooltip="A lucide icon name (e.g., arrow-up-down, zap, car, shield-check, wifi). See lucide.dev/icons"
          >
            <div className="flex items-center gap-2">
              <Input
                placeholder="e.g. arrow-up-down, car, zap, shield-check"
                className="flex-1"
              />
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-secondary-700 shadow-xs"
                title={iconValue ? `Preview: ${iconValue}` : "No icon"}
              >
                {(() => {
                  const IconComp = getLucideIcon(iconValue);
                  return IconComp ? (
                    <IconComp className="h-5 w-5 text-primary-600" />
                  ) : (
                    <span className="font-mono text-xs text-gray-400">—</span>
                  );
                })()}
              </div>
            </div>
          </Form.Item>
          <Space size="large">
            <Form.Item label="Order" name="order">
              <InputNumber min={0} />
            </Form.Item>
            <Form.Item label="Active" name="isActive" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setOpen(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={creating || updating}
            >
              {editing ? "Save changes" : "Add amenity"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Amenities;
