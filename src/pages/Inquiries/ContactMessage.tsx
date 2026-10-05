import { Button, Descriptions, Divider, Input, Space, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { format } from "date-fns";
import React, { useState } from "react";
import { FiCalendar, FiEye, FiMail, FiMail as FiMailIcon, FiMessageSquare, FiPhone, FiSearch, FiUser } from "react-icons/fi";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import DataTable from "../../components/Table/DataTable";
import AntModal from "../../components/shared/AntModal";
import DateTimeStacked from "../../components/shared/DateTimeStacked";
import SendContactEmailModal from "../../components/modal/inquiries/SendContactEmailModal";
import {
  useAllContactMessagesQuery,
  useLazyAllContactMessagesQuery,
} from "../../redux/features/inquiries/inquiriesApi";
import ExportMenu from "../../components/Common/ExportMenu";
import { makeSheet } from "../../utils/tableExport";

const { Text, Title } = Typography;

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone: string;
  location?: string;
  subject: string;
  message: string;
  type?: string;
  enquiry?: string;
  area?: string;
  budget?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

const ContactMessages: React.FC = () => {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const { data, isLoading, isFetching } = useAllContactMessagesQuery([
    { name: "limit", value: limit },
    { name: "page", value: page },
  ]);
  const [fetchAllMessages] = useLazyAllContactMessagesQuery();

  const buildSheet = async () => {
    const all = await fetchAllMessages([
      { name: "limit", value: 10000 },
      { name: "page", value: 1 },
    ]).unwrap();

    return makeSheet({
      title: "Contact Messages",
      unit: "message",
      headers: ["Date", "Name", "Email", "Phone", "Type", "Subject", "Message"],
      rows: all?.data?.data || [],
      cells: (m: ContactMessage) => [
        m.createdAt ? format(new Date(m.createdAt), "dd MMM yyyy, h:mm a") : "—",
        m.name || "—",
        m.email || "—",
        m.phone || "—",
        m.type || "General",
        m.subject || "—",
        // The whole point of exporting these is reading what people wrote, so
        // the message travels with the row rather than being left on screen.
        m.message || "—",
      ],
    });
  };

  const handlePreview = (record: ContactMessage) => {
    setSelectedMessage(record);
    setIsPreviewModalOpen(true);
  };

  const handleSendEmail = (record: ContactMessage) => {
    setSelectedMessage(record);
    setIsEmailModalOpen(true);
  };

  const columns: ColumnsType<ContactMessage> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: true,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (_, r: ContactMessage) => {
        const val = r.enquiry || r.type || "General";
        if (val === "General") return <Text type="secondary">General</Text>;
        return <Text className="text-primary-500 font-semibold capitalize">{val}</Text>;
      },
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      render: (val: string) => val ? <Text>{val}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      ellipsis: true,
      render: (val: string) => val || <Text type="secondary">—</Text>
    },

    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      sorter: true,
      render: (val: string) => <DateTimeStacked value={val} />,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<FiEye />} onClick={() => handlePreview(record)} />
          <Button
            icon={<FiMail />}
            type="primary"
            onClick={() => handleSendEmail(record)}
            title="Send email"
          />
          {/* <Button icon={<FiTrash2 />} danger /> */}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageMeta
        title="Contact Messages - Zoom Property Admin"
        description="Manage and respond to customer contact messages and inquiries."
        keywords="contact messages, inquiries, customer support, Zoom Property"
        canonicalUrl={`${window.location.origin}/inquiries/contact-message`}
        noindex={true}
        nofollow={true}
      />
      <PageHeader
        title="Contact Messages"
        subtitle="Manage and respond to customer inquiries."
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Inquiries" },
          { title: "Contact Messages" },
        ]}
        // Was a primary button that did nothing at all when clicked.
        extra={
          <ExportMenu
            label="Export Messages"
            sheet={buildSheet}
            disabled={(data?.data?.meta?.total || 0) === 0}
          />
        }
      />
      {/* Filters */}

      <div className="flex flex-col sm:flex-row gap-4 flex-1 mb-3">
        <Input
          placeholder="Search messages..."
          prefix={<FiSearch />}
          className="max-w-xs"
        />
      </div>

      <DataTable
        loading={isFetching || isLoading}
        columns={columns}
        data={data?.data?.data || []}
        rowKey="_id"
        limit={limit}
        setLimit={setLimit}
        setCurrentPage={setPage}
        isPaginate={true}
        total={data?.data?.meta?.total || 0}
      />

      {/* Preview Modal */}
      <AntModal
        open={isPreviewModalOpen}
        setOpen={setIsPreviewModalOpen}
        title="Contact Message Details"
        width={700}
      >
        {selectedMessage && (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <Title level={4} className="mb-0">
                {selectedMessage.subject}
              </Title>
              <Text type="secondary" className="text-sm">
                <FiCalendar className="inline mr-1" />
                {format(new Date(selectedMessage.createdAt), "MMMM dd, yyyy 'at' HH:mm")}
              </Text>
              {selectedMessage.type && selectedMessage.type !== "General" && (
                <div className="mt-2 text-xs font-semibold bg-primary-500/10 text-primary-700 inline-block px-2 py-1 rounded">
                  {selectedMessage.type}
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div>
              <Title level={5} className="mb-4 flex items-center gap-2">
                <FiUser className="text-primary" />
                Contact Information
              </Title>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item
                  label={
                    <span className="flex items-center gap-2">
                      <FiUser className="text-gray-500" />
                      Name
                    </span>
                  }
                >
                  {selectedMessage.name}
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <span className="flex items-center gap-2">
                      <FiMailIcon className="text-gray-500" />
                      Email
                    </span>
                  }
                >
                  <a href={`mailto:${selectedMessage.email}`} className="text-primary hover:underline">
                    {selectedMessage.email}
                  </a>
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <span className="flex items-center gap-2">
                      <FiPhone className="text-gray-500" />
                      Phone
                    </span>
                  }
                >
                  <a href={`tel:${selectedMessage.phone}`} className="text-primary hover:underline">
                    {selectedMessage.phone}
                  </a>
                </Descriptions.Item>
                {selectedMessage.enquiry && (
                  <Descriptions.Item label={<span className="text-gray-500">Enquiry</span>}>
                    <span className="capitalize">{selectedMessage.enquiry}</span>
                  </Descriptions.Item>
                )}
                {selectedMessage.area && (
                  <Descriptions.Item label={<span className="text-gray-500">Area</span>}>
                    {selectedMessage.area === "any" ? "Any Area" : selectedMessage.area}
                  </Descriptions.Item>
                )}
                {selectedMessage.location && (
                  <Descriptions.Item label={<span className="text-gray-500">Preferred location</span>}>
                    {selectedMessage.location}
                  </Descriptions.Item>
                )}
                {selectedMessage.budget && (
                  <Descriptions.Item label={<span className="text-gray-500">Budget</span>}>
                    {selectedMessage.budget}
                  </Descriptions.Item>
                )}
                {selectedMessage.source && (
                  <Descriptions.Item label={<span className="text-gray-500">Source</span>}>
                    {selectedMessage.source}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>

            <Divider />

            {/* Message Content */}
            <div>
              <Title level={5} className="mb-4 flex items-center gap-2">
                <FiMessageSquare className="text-primary" />
                Message
              </Title>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-[150px]">
                <Text className="whitespace-pre-wrap text-gray-700">
                  {selectedMessage.message}
                </Text>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button onClick={() => setIsPreviewModalOpen(false)}>Close</Button>
              <Button
                type="primary"
                icon={<FiMail />}
                onClick={() => {
                  setIsPreviewModalOpen(false);
                  setIsEmailModalOpen(true);
                }}
              >
                Reply via Email
              </Button>
            </div>
          </div>
        )}
      </AntModal>

      <SendContactEmailModal
        open={isEmailModalOpen}
        setOpen={setIsEmailModalOpen}
        recipient={selectedMessage}
      />
    </div>
  );
};

export default ContactMessages;
