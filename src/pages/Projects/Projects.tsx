import { Button, Input, Modal, Progress, Select, Space, Switch, Tag, Tooltip } from "antd";
import { Edit, LayoutTemplate, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import PermissionGate from "../../components/Common/PermissionGate";
import DataTable from "../../components/Table/DataTable";
import OrderInputCell from "../../components/shared/OrderInputCell";
import AntImage from "../../components/shared/AntImage";
import { mediaSrc } from "../../utils/mediaSrc";
import { useGetAreasQuery } from "../../redux/features/area/areaApi";
import {
  useDeleteProjectMutation,
  useGetProjectsQuery,
  useUpdateProjectMutation,
} from "../../redux/features/project/projectApi";
import { STAGE_COLOUR, STAGES } from "./projectMeta";
import brand from "../../theme/brand";

const { confirm } = Modal;

const Projects = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<string | undefined>();
  const [area, setArea] = useState<string | undefined>();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data, isLoading } = useGetProjectsQuery({
    page,
    limit,
    searchTerm: search || undefined,
    stage,
    area,
    sort: "order",
  });
  const { data: areaData } = useGetAreasQuery({ limit: 200, activeOnly: true });
  const [deleteProject] = useDeleteProjectMutation();
  const [updateProject] = useUpdateProjectMutation();

  const onToggleProject = async (
    id: string,
    field: "isActive" | "isHome" | "featured",
    value: boolean
  ) => {
    setBusyKey(`${id}-${field}`);
    try {
      await updateProject({ id, data: { [field]: value } }).unwrap();
      const label =
        field === "isHome"
          ? "Home visibility"
          : field === "isActive"
          ? "Status"
          : "Featured";
      toast.success(`${label} updated`);
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not update project");
    } finally {
      setBusyKey(null);
    }
  };

  const onStageChange = async (id: string, nextStage: string) => {
    setBusyKey(`${id}-stage`);
    try {
      await updateProject({ id, data: { stage: nextStage } }).unwrap();
      toast.success("Stage updated");
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not update stage");
    } finally {
      setBusyKey(null);
    }
  };

  const rows = data?.result ?? [];
  const total = data?.meta?.total ?? 0;

  const onDelete = (id: string, name: string) =>
    confirm({
      title: "Delete this project?",
      content: `"${name}" will be removed from the book. Listings attached to it will keep their details, but will no longer point to a project.`,
      okText: "Yes, delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteProject(id).unwrap();
          toast.success("Project deleted");
        } catch (e: any) {
          toast.error(e?.data?.message || "Could not delete the project");
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
          onUpdateOrder={(id, order) =>
            updateProject({ id, data: { order } }).unwrap()
          }
        />
      ),
    },
    {
      title: "Project",
      dataIndex: "name",
      key: "name",
      render: (name: string, r: any) => {
        const imgUrl = mediaSrc(r.coverImage);
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
                {r.area?.name ? `${r.area.name} · ` : ""}
                {r.developer}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      title: "Stage",
      dataIndex: "stage",
      key: "stage",
      width: 140,
      render: (stage: string, r: any) => (
        <PermissionGate
          module="Projects"
          action="Update"
          fallback={
            <Tag color={STAGE_COLOUR[stage] || "default"}>{stage}</Tag>
          }
        >
          <Select
            size="small"
            value={stage || "Planning"}
            className="w-full"
            loading={busyKey === `${r._id}-stage`}
            options={STAGES}
            onChange={(next) => onStageChange(r._id, next)}
          />
        </PermissionGate>
      ),
    },
    {
      title: "Progress",
      dataIndex: "progress",
      key: "progress",
      width: 150,
      render: (p: number) => (
        <Progress percent={p ?? 0} size="small" strokeColor={brand.primary} />
      ),
    },
    {
      title: "Units",
      dataIndex: "units",
      key: "units",
      width: 110,
      align: "center" as const,
      render: (units: number, r: any) => (
        <span className="text-xs">
          {r.unitsLeft ?? 0} / {units ?? 0} left
        </span>
      ),
    },
    {
      title: "Home",
      dataIndex: "isHome",
      key: "isHome",
      width: 85,
      align: "center" as const,
      render: (isHome: boolean, r: any) => (
        <PermissionGate
          module="Projects"
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
            onChange={(checked) => onToggleProject(r._id, "isHome", checked)}
          />
        </PermissionGate>
      ),
    },
    {
      title: "Active",
      dataIndex: "isActive",
      key: "isActive",
      width: 85,
      align: "center" as const,
      render: (isActive: boolean, r: any) => (
        <PermissionGate
          module="Projects"
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
            onChange={(checked) => onToggleProject(r._id, "isActive", checked)}
          />
        </PermissionGate>
      ),
    },
    {
      title: "Featured",
      dataIndex: "featured",
      key: "featured",
      width: 85,
      align: "center" as const,
      render: (featured: boolean, r: any) => (
        <PermissionGate
          module="Projects"
          action="Update"
          fallback={
            <Tag color={featured ? "gold" : "default"}>
              {featured ? "Yes" : "No"}
            </Tag>
          }
        >
          <Switch
            size="small"
            checked={!!featured}
            loading={busyKey === `${r._id}-featured`}
            onChange={(checked) => onToggleProject(r._id, "featured", checked)}
          />
        </PermissionGate>
      ),
    },
    {
      title: "Handover",
      dataIndex: "handover",
      key: "handover",
      width: 110,
      render: (v: string) => v || "—",
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right" as const,
      width: 168,
      render: (_: unknown, r: any) => (
        <Space>
          <PermissionGate module="Projects" action="Update">
            <Tooltip title="Landing page">
              <Button
                icon={<LayoutTemplate className="h-4 w-4" />}
                onClick={() => navigate(`/projects/${r._id}/landing`)}
              />
            </Tooltip>
            <Tooltip title="Edit">
              <Button
                icon={<Edit className="h-4 w-4" />}
                onClick={() => navigate(`/projects/edit/${r._id}`)}
              />
            </Tooltip>
          </PermissionGate>
          <PermissionGate module="Projects" action="Delete">
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
        title="Projects · Zoom Property Admin"
        description="Developments under construction and how far along they are."
        noindex
      />
      <PageHeader
        title="Projects"
        subtitle="Developments under construction"
        breadcrumbs={[{ title: "Dashboard", path: "/" }, { title: "Projects" }]}
        extra={
          <PermissionGate module="Projects" action="Create">
            <Button
              type="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => navigate("/projects/create")}
            >
              Add project
            </Button>
          </PermissionGate>
        }
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        {/* Left side: Search Input */}
        <div className="w-full sm:w-auto">
          <Input
            allowClear
            placeholder="Search by name, developer or permit no."
            prefix={<Search className="h-4 w-4 text-gray-400" />}
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="w-full sm:w-80 md:w-96"
          />
        </div>

        {/* Right side: Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <Select
            allowClear
            placeholder="Stage"
            className="w-36"
            value={stage}
            options={STAGES}
            onChange={(v) => {
              setPage(1);
              setStage(v);
            }}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Area"
            className="w-40"
            value={area}
            options={(areaData?.result || []).map((a: any) => ({
              value: a._id,
              label: a.name,
            }))}
            onChange={(v) => {
              setPage(1);
              setArea(v);
            }}
          />
        </div>
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

export default Projects;
