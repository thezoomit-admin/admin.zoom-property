import { Button, Modal, Space, Tooltip } from "antd";
import { Edit, Plus, Search, Trash2, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import PermissionGate from "../../components/Common/PermissionGate";
import DataTable from "../../components/Table/DataTable";
import {
  useDeleteAgentMutation,
  useGetAgentsQuery,
} from "../../redux/features/agent/agentApi";
import { mediaSrc } from "../../utils/mediaSrc";
import AgentModal from "./AgentModal";

const { confirm } = Modal;

const Agents = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const { data, isFetching } = useGetAgentsQuery({
    page,
    limit,
    searchTerm: search || undefined,
  });
  const [deleteAgent] = useDeleteAgentMutation();

  const rows = (data as any)?.result ?? (data as any)?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const onDelete = (id: string, name: string) =>
    confirm({
      title: "Delete this agent?",
      content: `"${name}" will be removed.`,
      okText: "Yes, delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteAgent(id).unwrap();
          toast.success("Agent deleted");
        } catch (e: any) {
          toast.error(e?.data?.message || "Could not delete the agent");
        }
      },
    });

  const columns = [
    {
      title: "Agent",
      dataIndex: "name",
      key: "name",
      width: 300,
      render: (name: string, r: any) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-secondary-100">
            {mediaSrc(r.image) ? (
              <img
                src={mediaSrc(r.image)}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound className="absolute inset-0 m-auto h-4 w-4 text-secondary-300" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-secondary-800">{name}</p>
            <p className="truncate text-xs text-secondary-500">{r.role}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Deals",
      dataIndex: "deals",
      key: "deals",
      width: 100,
      align: "center" as const,
    },
    {
      title: "Rating",
      dataIndex: "rating",
      key: "rating",
      width: 100,
      align: "center" as const,
    },
    {
      title: "Reply Time",
      dataIndex: "respondsIn",
      key: "respondsIn",
      width: 120,
      align: "center" as const,
      render: (min: number) => (min ? `~${min} min` : "—"),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right" as const,
      width: 120,
      render: (_: unknown, r: any) => (
        <Space>
          <PermissionGate module="Agents" action="Update">
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                className="text-secondary-500 hover:text-blue-600"
                onClick={() => {
                  setEditing(r);
                  setOpen(true);
                }}
                icon={<Edit className="h-4 w-4" />}
              />
            </Tooltip>
          </PermissionGate>
          <PermissionGate module="Agents" action="Delete">
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                danger
                onClick={() => onDelete(r._id, r.name)}
                icon={<Trash2 className="h-4 w-4" />}
              />
            </Tooltip>
          </PermissionGate>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageMeta title="Agents | Zoom Property" />
      <PageHeader title="Agents" breadcrumbs={[{ title: "HR", path: "/employees" }, { title: "Agents" }]} />

      <PermissionGate module="Agents" action="Read">
        <div className="mt-6 rounded-lg border border-secondary-200 bg-white">
          <div className="flex items-center justify-between border-b border-secondary-200 p-4">
            <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-secondary-200 bg-secondary-50 px-3 py-2 text-secondary-500 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
              <Search className="h-4 w-4" />
              <input
                type="text"
                placeholder="Search agents..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-secondary-400"
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <PermissionGate module="Agents" action="Create">
              <Button
                type="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setOpen(true)}
              >
                Add Agent
              </Button>
            </PermissionGate>
          </div>

          <DataTable
            columns={columns}
            data={rows}
            loading={isFetching}
            pagination={{
              total,
              current: page,
              pageSize: limit,
              onChange: (p: number, s: number) => {
                setPage(p);
                setLimit(s);
              },
            }}
          />
        </div>
      </PermissionGate>

      <AgentModal
        open={open}
        setOpen={setOpen}
        editing={editing}
        setEditing={setEditing}
      />
    </div>
  );
};

export default Agents;
