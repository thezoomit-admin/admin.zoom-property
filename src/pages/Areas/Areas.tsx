import { Button, Input, Modal, Space, Switch, Tag, Tooltip } from "antd";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import PermissionGate from "../../components/Common/PermissionGate";
import DataTable from "../../components/Table/DataTable";
import {
  useDeleteAreaMutation,
  useGetAreasQuery,
  useUpdateAreaMutation,
} from "../../redux/features/area/areaApi";
import DateTimeStacked from "../../components/shared/DateTimeStacked";
import OrderInputCell from "../../components/shared/OrderInputCell";
import AntImage from "../../components/shared/AntImage";
import { TakaIcon } from "../../components/shared/Icon";
import { mediaSrc } from "../../utils/mediaSrc";

const { confirm } = Modal;

/** Neighbourhoods, and how many listings each one is carrying. */
const Areas = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const { data, isLoading } = useGetAreasQuery({
    page,
    limit,
    searchTerm: search || undefined,
    sort: "order",
  });
  const [deleteArea] = useDeleteAreaMutation();
  const [updateArea] = useUpdateAreaMutation();

  const onToggle = async (
    id: string,
    field: "isActive" | "isHome" | "featured",
    value: boolean
  ) => {
    setBusyKey(`${id}-${field}`);
    try {
      await updateArea({ id, data: { [field]: value } }).unwrap();
      const label =
        field === "isHome"
          ? "Home display"
          : field === "isActive"
          ? "Status"
          : "Featured";
      toast.success(`${label} updated`);
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not update area");
    } finally {
      setBusyKey(null);
    }
  };

  const rows = data?.result ?? [];
  const total = data?.meta?.total ?? 0;

  const onDelete = (id: string, name: string) =>
    confirm({
      title: "Delete this area?",
      content: `"${name}" will be removed. Areas with listings in them cannot be deleted — deactivate instead.`,
      okText: "Yes, delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteArea(id).unwrap();
          toast.success("Area deleted");
        } catch (e: any) {
          toast.error(e?.data?.message || "Could not delete the area");
        }
      },
    });

  const columns = [
    {
      title: "Order",
      dataIndex: "order",
      key: "order",
      width: 120,
      align: "center" as const,
      render: (_: number, r: any, index: number) => (
        <OrderInputCell
          record={r}
          index={index}
          onUpdateOrder={(id, order) => updateArea({ id, data: { order } }).unwrap()}
        />
      ),
    },
    {
      title: "Area",
      dataIndex: "name",
      key: "name",
      render: (name: string, r: any) => {
        const imgUrl = mediaSrc(r.image);
        return (
          <div className="flex items-center gap-3">
            {imgUrl ? (
              <div className="w-11 h-11 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
                <AntImage
                  src={imgUrl}
                  alt={name}
                  width="100%"
                  height="100%"
                  className="!w-full !h-full !object-cover"
                  preview={true}
                />
              </div>
            ) : null}
            <div>
              <p className="font-medium text-secondary-800">{name}</p>
              <p className="text-xs text-secondary-500">
                {r.city}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      title: "Note",
      dataIndex: "note",
      key: "note",
      width: 240,
      render: (note: string) => {
        const text = note || "";
        if (!text) return <span className="text-secondary-400">—</span>;
        return (
          <Tooltip title={<div className="max-w-sm whitespace-pre-wrap text-xs">{text}</div>}>
            <div className="line-clamp-2 text-xs text-secondary-700 leading-relaxed cursor-pointer">
              {text}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Listings",
      dataIndex: "listings",
      key: "listings",
      width: 90,
      align: "center" as const,
      render: (n: number) => <Tag color={n ? "green" : "default"}>{n ?? 0}</Tag>,
    },
    {
      title: "Market Rate",
      key: "marketRate",
      width: 150,
      render: (_: any, r: any) => (
        <div className="text-xs">
          <p className="font-semibold text-secondary-800 flex items-center gap-0.5">
            {r.medianPrice ? <><TakaIcon />{(r.medianPrice / 10000000).toFixed(2)} Cr</> : "—"}
          </p>
          <p className="text-secondary-500 flex items-center gap-0.5">
            {r.pricePerSqft ? <><TakaIcon />{r.pricePerSqft.toLocaleString()}/sqft</> : "—"}
            {r.rentalYield ? ` · ${r.rentalYield}` : ""}
          </p>
        </div>
      ),
    },
    {
      title: "Created at",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (v: string) => <DateTimeStacked value={v} />,
    },
    {
      title: "Updated at",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 140,
      render: (v: string) => <DateTimeStacked value={v} />,
    },
    {
      title: "Home",
      dataIndex: "isHome",
      key: "isHome",
      width: 90,
      align: "center" as const,
      render: (isHome: boolean, r: any) => (
        <PermissionGate
          module="Areas"
          action="Update"
          fallback={
            <Tag color={isHome ? "blue" : "default"}>
              {isHome ? "Home" : "Off"}
            </Tag>
          }
        >
          <Switch
            size="small"
            checked={!!isHome}
            loading={busyKey === `${r._id}-isHome`}
            onChange={(checked) => onToggle(r._id, "isHome", checked)}
          />
        </PermissionGate>
      ),
    },
    {
      title: "Featured",
      dataIndex: "featured",
      key: "featured",
      width: 90,
      align: "center" as const,
      render: (featured: boolean, r: any) => (
        <PermissionGate
          module="Areas"
          action="Update"
          fallback={
            <Tag color={featured ? "gold" : "default"}>
              {featured ? "Featured" : "Off"}
            </Tag>
          }
        >
          <Switch
            size="small"
            checked={!!featured}
            loading={busyKey === `${r._id}-featured`}
            onChange={(checked) => onToggle(r._id, "featured", checked)}
          />
        </PermissionGate>
      ),
    },
    {
      title: "Active",
      dataIndex: "isActive",
      key: "isActive",
      width: 90,
      align: "center" as const,
      render: (isActive: boolean, r: any) => (
        <PermissionGate
          module="Areas"
          action="Update"
          fallback={
            <Tag color={isActive !== false ? "green" : "default"}>
              {isActive !== false ? "Active" : "Off"}
            </Tag>
          }
        >
          <Switch
            size="small"
            checked={isActive !== false}
            loading={busyKey === `${r._id}-isActive`}
            onChange={(checked) => onToggle(r._id, "isActive", checked)}
          />
        </PermissionGate>
      ),
    },

    {
      title: "Actions",
      key: "actions",
      fixed: "right" as const,
      width: 120,
      render: (_: unknown, r: any) => (
        <Space>
          <PermissionGate module="Areas" action="Update">
            <Tooltip title="Edit">
              <Button
                icon={<Edit className="h-4 w-4" />}
                onClick={() => navigate(`/areas/edit/${r._id}`)}
              />
            </Tooltip>
          </PermissionGate>
          <PermissionGate module="Areas" action="Delete">
            <Tooltip title="Delete">
              <Button
                danger
                icon={<Trash2 className="h-4 w-4" />}
                onClick={() => onDelete(r._id, r.name)}
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
        title="Areas · Zoom Property Admin"
        description="Neighbourhoods, their market figures and how many listings each carries."
        noindex
      />
      <PageHeader
        title="Areas"
        subtitle="Neighbourhoods and the numbers behind them"
        breadcrumbs={[{ title: "Dashboard", path: "/" }, { title: "Areas" }]}
        extra={
          <PermissionGate module="Areas" action="Create">
            <Link to="/areas/create">
              <Button type="primary" icon={<Plus className="h-4 w-4" />}>
                Add area
              </Button>
            </Link>
          </PermissionGate>
        }
      />

      <div className="mb-6">
        <Input
          allowClear
          placeholder="Search areas"
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
        total={total}
        isPaginate={total > limit}
        loading={isLoading}
        rowKey="_id"
      />
    </div>
  );
};

export default Areas;
