import { Button, Form, Input, InputNumber, Modal, Switch } from "antd";
import { Save } from "lucide-react";
import React from "react";
import { toast } from "react-toastify";
import LangInput from "../../../Common/LangInput";
import { useCreateBudgetRangeMutation } from "../../../../redux/features/settings/budgetRangeApi";

interface Props {
  open: boolean;
  setOpen: (value: boolean) => void;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const CreateBudgetRangeModal: React.FC<Props> = ({ open, setOpen }) => {
  const [form] = Form.useForm();
  const [createBudgetRange, { isLoading }] = useCreateBudgetRangeMutation();

  const handleSubmit = async (values: {
    name: string;
    nameBn?: string;
    value?: string;
    order?: number;
    isActive?: boolean;
  }) => {
    try {
      const payload = {
        name: values.name.trim(),
        nameBn: values.nameBn?.trim() || "",
        value: values.value?.trim() || slugify(values.name),
        order: values.order ?? 0,
        isActive: values.isActive ?? true,
      };
      const res = await createBudgetRange(payload).unwrap();
      if (res.success) {
        toast.success(res.message || "Budget range created");
        form.resetFields();
        setOpen(false);
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create budget range");
    }
  };

  return (
    <Modal
      title="Add Budget Range"
      open={open}
      onCancel={() => setOpen(false)}
      width={520}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ isActive: true, order: 0 }}
      >
        <LangInput
          label="Name (English)"
          name="name"
          lang="en"
          required
          form={form}
          placeholder="e.g. ৳2 – 5 Cr"
        />

        <LangInput
          label="Name (Bangla)"
          name="nameBn"
          lang="bn"
          sourceFieldName="name"
          form={form}
          placeholder="যেমন: ২ – ৫ কোটি"
        />

        <Form.Item
          label="Value"
          name="value"
          tooltip="Stable code sent with the enquiry (e.g. 2to5). Auto-filled from English name if empty."
          rules={[{ max: 80 }]}
        >
          <Input
            placeholder="e.g. 2to5"
            className="!font-mono"
            onFocus={() => {
              const current = form.getFieldValue("value");
              const name = form.getFieldValue("name");
              if (!current && name) {
                form.setFieldValue("value", slugify(name));
              }
            }}
          />
        </Form.Item>

        <div className="grid grid-cols-2 gap-3">
          <Form.Item label="Order" name="order">
            <InputNumber min={0} max={9999} className="!w-full" />
          </Form.Item>
          <Form.Item label="Active" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>
        </div>

        <Form.Item className="!mb-0">
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              icon={<Save className="w-4 h-4" />}
              onClick={() => form.submit()}
              loading={isLoading}
            >
              Create
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateBudgetRangeModal;
