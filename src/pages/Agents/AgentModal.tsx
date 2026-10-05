import { Form, Input, Modal, Switch } from "antd";
import { useEffect } from "react";
import { toast } from "react-toastify";
import LangInput from "../../components/Common/LangInput";
import UploadMedia from "../../components/shared/UploadMedia";
import {
  useCreateAgentMutation,
  useUpdateAgentMutation,
} from "../../redux/features/agent/agentApi";

const AgentModal = ({ open, setOpen, editing, setEditing }: any) => {
  const [form] = Form.useForm();
  const [createAgent, { isLoading: isCreating }] = useCreateAgentMutation();
  const [updateAgent, { isLoading: isUpdating }] = useUpdateAgentMutation();

  useEffect(() => {
    if (editing) {
      form.setFieldsValue({
        ...editing,
        imageUrl: editing.image?.url || editing.image?.key,
        image: editing.image?._id,
      });
    } else {
      form.resetFields();
    }
  }, [editing, form]);

  const onFinish = async (values: any) => {
    // Strip the UI preview URL so only the ObjectId goes to the server
    delete values.imageUrl;

    try {
      if (editing) {
        await updateAgent({ id: editing._id, data: values }).unwrap();
        toast.success("Team member updated");
      } else {
        await createAgent(values).unwrap();
        toast.success("Team member created");
      }
      setOpen(false);
      setEditing(null);
      form.resetFields();
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not save team member");
    }
  };

  return (
    <Modal
      open={open}
      title={editing ? "Edit Team Member" : "New Team Member"}
      onCancel={() => {
        setOpen(false);
        setEditing(null);
        form.resetFields();
      }}
      onOk={() => form.submit()}
      confirmLoading={isCreating || isUpdating}
      width={520}
      okText="Save Team Member"
    >
      <Form form={form} onFinish={onFinish} layout="vertical" className="mt-4">
        <div className="flex flex-col gap-4">
          <LangInput
            name="name"
            label="Name (English)"
            lang="en"
            required
            placeholder="Enter Your Name"
          />
          <Form.Item name="phone" label="Designation">
            <Input placeholder="Enter Your Designation" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Status"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <UploadMedia
            form={form}
            fieldPath="imageUrl"
            idFieldPath="image"
            type="image"
          />
        </div>
      </Form>
    </Modal>
  );
};

export default AgentModal;
