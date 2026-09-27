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
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import PageHeader from "../../../components/Common/PageHeader";
import LangInput from "../../../components/Common/LangInput";
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

const PropertyTypeIconBadge = ({ iconName }: { iconName?: string }) => {
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
 * The Property Type list every listing form picks from.
 */
const PropertyTypes = () => {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const iconValue = Form.useWatch("icon", form);

  const { data: optionResult, isFetching } = useGetPropertyOptionsQuery({
    kind: "types",
    page,
    limit,
    searchTerm: search,
  });
  const rows = Array.isArray(optionResult)
    ? optionResult
    : (optionResult as any)?.rows ?? (optionResult as any)?.data ?? [];
  const meta = Array.isArray(optionResult)
    ? { total: optionResult.length }
    : (optionResult as any)?.meta ?? {};

  const [createOption, { isLoading: creating }] =
    useCreatePropertyOptionMutation();
  const [updateOption, { isLoading: updating }] =
    useUpdatePropertyOptionMutation();
  const [deleteOption] = useDeletePropertyOptionMutation();

  const handleUpdateOrder = async (id: string, nextOrder: number) => {
    return updateOption({
      kind: "types",
      id,
      data: { order: nextOrder },
    }).unwrap();
  };

  useEffect(() => {
    if (!open) return form.resetFields();
    if (editing) form.setFieldsValue(editing);
  }, [open, editing, form]);

  const onFinish = async (values: any) => {
    try {
      if (editing) {
        await updateOption({
          kind: "types",
          id: editing._id,
          data: values,
        }).unwrap();
        toast.success("Property Type updated");
      } else {
        await createOption({ kind: "types", data: values }).unwrap();
        toast.success("Property Type added");
      }
      setOpen(false);
      setEditing(null);
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not save the Property Type");
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteOption({ kind: "types", id }).unwrap();
      toast.success("Property Type deleted");
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not delete the Property Type");
    }
  };

  const columns = [
    {
      title: "Property Type",
      dataIndex: "name",
      key: "name",
      render: (name: string, r: any) => (
        <div>
          <p className="font-medium text-secondary-800">{name}</p>
          {r.nameBn && (
            <p className="text-xs text-secondary-400">{r.nameBn}</p>
          )}
        </div>
      ),
    },
    {
      title: "Icon",
      dataIndex: "icon",
      key: "icon",
      width: 200,
      render: (icon: string) => <PropertyTypeIconBadge iconName={icon} />,
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
                kind: "types",
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
              title="Delete this Property Type?"
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
        title="Property Types · Zoom Property Admin"
        description="The Property Type list every listing form picks from."
        noindex
      />
      <PageHeader
        title="Property Types"
        subtitle="What kind of properties you list"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Settings" },
          { title: "Property Types" },
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
              Add Property Type
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
        data={rows}
        columns={columns as any}
        currentPage={page}
        setCurrentPage={setPage}
        limit={limit}
        setLimit={setLimit}
        total={meta.total || 0}
        isPaginate={(meta.total || 0) > limit}
        loading={isFetching}
        rowKey="_id"
      />

      <Modal
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing ? "Edit Property Type" : "Add an Property Type"}
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
            label="Label (English)"
            name="name"
            rules={[{ required: true, message: "Provide an English label" }]}
            tooltip="The English label shown on the frontend."
          >
            <Input placeholder="Apartments" />
          </Form.Item>
          <LangInput
            label="Label (Bangla)"
            name="nameBn"
            lang="bn"
            placeholder="অ্যাপার্টমেন্ট"
            sourceFieldName="name"
            form={form}
          />
          <Form.Item
            label="Icon"
            name="icon"
            tooltip="A lucide icon name (e.g., arrow-up-down, zap, car, shield-check, wifi). See lucide.dev/icons"
          >
            <div className="flex items-center gap-2">
              <Input
                placeholder="e.g. building-2"
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
              {editing ? "Save changes" : "Add Property Type"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default PropertyTypes;
