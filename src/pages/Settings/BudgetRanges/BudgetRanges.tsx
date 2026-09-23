import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Button, Input, Modal, Space, Switch, Tag, Tooltip } from "antd";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "react-toastify";
import PageHeader from "../../../components/Common/PageHeader";
import PageMeta from "../../../components/Common/PageMeta";
import PermissionGate from "../../../components/Common/PermissionGate";
import CreateBudgetRangeModal from "../../../components/modal/settings/budget-range/CreateBudgetRangeModal";
import UpdateBudgetRangeModal from "../../../components/modal/settings/budget-range/UpdateBudgetRangeModal";
import DataTable from "../../../components/Table/DataTable";
import {
  IBudgetRange,
  useDeleteBudgetRangeMutation,
  useGetBudgetRangesQuery,
  useUpdateBudgetRangeMutation,
} from "../../../redux/features/settings/budgetRangeApi";
import ExportMenu from "../../../components/Common/ExportMenu";
import { makeSheet } from "../../../utils/tableExport";

const { confirm } = Modal;

const BudgetRanges: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [isOpenCreateModal, setIsOpenCreateModal] = useState(false);
  const [isOpenUpdateModal, setIsOpenUpdateModal] = useState(false);
  const [selected, setSelected] = useState<IBudgetRange | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: response, isFetching } = useGetBudgetRangesQuery(
    searchText ? { keyword: searchText } : {},
  );
  const items: IBudgetRange[] = response?.data ?? [];

  const [deleteBudgetRange] = useDeleteBudgetRangeMutation();
  const [updateBudgetRange] = useUpdateBudgetRangeMutation();

  const handleDelete = (record: IBudgetRange) => {
    confirm({
      title: `Delete "${record.name}"?`,
      icon: <ExclamationCircleOutlined />,
      content:
        "This removes the option from the contact form. Past enquiries keep the value they already saved.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        if (!record._id) return;
        try {
          const res = await deleteBudgetRange(record._id).unwrap();
          if (res.success) {
            toast.success(res.message || "Budget range deleted");
          }
        } catch (error: any) {
          toast.error(error?.data?.message || "Failed to delete");
        }
      },
    });
  };

  const handleEdit = (record: IBudgetRange) => {
    setSelected(record);
    setIsOpenUpdateModal(true);
  };

  const handleToggleActive = async (record: IBudgetRange) => {
    if (!record._id) return;
    setTogglingId(record._id);
    try {
      const res = await updateBudgetRange({
        id: record._id,
        data: { isActive: !record.isActive },
      }).unwrap();
      if (res.success) {
        toast.success(
          `Marked as ${!record.isActive ? "active" : "inactive"}`,
        );
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const columns = [
    {
      title: "#",
      dataIndex: "order",
      key: "order",
      width: 70,
      render: (n: number) => (
        <span className="tabular-nums text-secondary-500">{n ?? 0}</span>
      ),
    },
    {
      title: "English",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <span className="font-medium text-secondary-900">{text}</span>
      ),
    },
    {
      title: "Bangla",
      dataIndex: "nameBn",
      key: "nameBn",
      render: (text: string) =>
        text ? (
          <span className="text-secondary-800">{text}</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      render: (text: string) =>
        text ? (
          <Tag color="blue" className="!font-mono">
            {text}
          </Tag>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 130,
      align: "center" as const,
      render: (isActive: boolean, record: IBudgetRange) => (
        <Switch
          checked={!!isActive}
          loading={togglingId === record._id}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          onChange={() => handleToggleActive(record)}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      align: "right" as const,
      render: (_: unknown, record: IBudgetRange) => (
        <Space>
          <PermissionGate module="Budget Ranges" action="Update">
            <Tooltip title="Edit">
              <Button
                icon={<Edit className="w-4 h-4" />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          </PermissionGate>
          <PermissionGate module="Budget Ranges" action="Delete">
            <Tooltip title="Delete">
              <Button
                danger
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => handleDelete(record)}
              />
            </Tooltip>
          </PermissionGate>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageMeta
        title="Budget Ranges - Zoom Property Admin"
        description="Manage contact form budget options."
        keywords="budget ranges, Zoom Property"
        canonicalUrl={`${window.location.origin}/settings/budget-ranges`}
        noindex={true}
      />
      <PageHeader
        title="Budget Ranges"
        subtitle="Contact form বাজেট অপশন — English ও বাংলা লেবেল এডিট করুন"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Settings" },
          { title: "Budget Ranges" },
        ]}
        extra={
          <div className="flex flex-wrap items-center gap-2">
            <ExportMenu
              sheet={() =>
                makeSheet({
                  title: "Budget Ranges",
                  unit: "range",
                  filters: [searchText && `Search: "${searchText}"`],
                  headers: ["Order", "English", "Bangla", "Value", "Status"],
                  rows: items,
                  isLow: (r: IBudgetRange) => !r.isActive,
                  cells: (r: IBudgetRange) => [
                    String(r.order ?? 0),
                    r.name || "—",
                    r.nameBn || "—",
                    r.value || "—",
                    r.isActive ? "Active" : "Inactive",
                  ],
                })
              }
              disabled={items.length === 0}
            />
            <PermissionGate module="Budget Ranges" action="Create">
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                size="middle"
                onClick={() => setIsOpenCreateModal(true)}
              >
                Add New
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Search by name or value..."
          prefix={<Search className="w-4 h-4 text-gray-400" />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="max-w-md"
        />
      </div>

      <DataTable
        data={items}
        columns={columns}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        limit={limit}
        setLimit={setLimit}
        total={items.length}
        isPaginate={items.length > limit}
        loading={isFetching}
        rowKey="_id"
      />

      {isOpenCreateModal && (
        <CreateBudgetRangeModal
          open={isOpenCreateModal}
          setOpen={setIsOpenCreateModal}
        />
      )}

      {isOpenUpdateModal && selected && (
        <UpdateBudgetRangeModal
          open={isOpenUpdateModal}
          setOpen={setIsOpenUpdateModal}
          data={selected}
        />
      )}
    </div>
  );
};

export default BudgetRanges;
