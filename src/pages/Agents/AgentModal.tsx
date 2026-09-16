import { Form, Input, InputNumber, Modal, Select } from "antd";
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
        toast.success("Agent updated");
      } else {
        await createAgent(values).unwrap();
        toast.success("Agent created");
      }
      setOpen(false);
      setEditing(null);
      form.resetFields();
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not save agent");
    }
  };

  return (
    <Modal
      open={open}
      title={editing ? "Edit Agent" : "New Agent"}
      onCancel={() => {
        setOpen(false);
        setEditing(null);
        form.resetFields();
      }}
      onOk={() => form.submit()}
      confirmLoading={isCreating || isUpdating}
      width={700}
      okText="Save Agent"
    >
      <Form form={form} onFinish={onFinish} layout="vertical" className="mt-4">
        <div className="grid grid-cols-2 gap-4">
          <LangInput
            name="name"
            label="Name (English)"
            lang="en"
            required
            placeholder="John Doe"
          />
          <LangInput
            name="nameBn"
            label="Name (Bengali) - Auto translated"
            lang="bn"
            sourceFieldName="name"
            form={form}
            placeholder="জন ডো"
          />

          <LangInput
            name="role"
            label="Role (English)"
            lang="en"
            required
            placeholder="Senior Advisor"
          />
          <LangInput
            name="roleBn"
            label="Role (Bengali) - Auto translated"
            lang="bn"
            sourceFieldName="role"
            form={form}
            placeholder="সিনিয়র পরামর্শদাতা"
          />

          <Form.Item name="patch" label="Patch (Areas covered)">
            <Select mode="tags" placeholder="Gulshan, Banani..." />
          </Form.Item>
          <Form.Item name="languages" label="Languages">
            <Select mode="tags" placeholder="English, Bengali..." />
          </Form.Item>

          <Form.Item name="deals" label="Deals Closed">
            <InputNumber className="w-full" min={0} placeholder="e.g. 50" />
          </Form.Item>
          <Form.Item name="rating" label="Rating (Out of 5)">
            <InputNumber className="w-full" min={0} max={5} step={0.1} placeholder="e.g. 4.9" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[{ required: true, message: "Phone number is required" }]}
          >
            <Input placeholder="+8801XXXXXXXXX" />
          </Form.Item>
          <Form.Item name="respondsIn" label="Reply Time (Minutes)">
            <InputNumber className="w-full" min={0} placeholder="e.g. 15" />
          </Form.Item>
          <div className="col-span-2">
            <UploadMedia
              form={form}
              fieldPath="imageUrl"
              idFieldPath="image"
              type="image"
            />
          </div>
        </div>
      </Form>
    </Modal>
  );
};

export default AgentModal;
