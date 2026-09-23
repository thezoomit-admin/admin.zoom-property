import { Button, Form, Input, InputNumber, Modal, Switch } from "antd";
import { Save } from "lucide-react";
import React, { useEffect } from "react";
import { toast } from "react-toastify";
import LangInput from "../../../Common/LangInput";
import {
  IBudgetRange,
  useUpdateBudgetRangeMutation,
} from "../../../../redux/features/settings/budgetRangeApi";

interface Props {
  open: boolean;
  setOpen: (value: boolean) => void;
  data: IBudgetRange;
}

const UpdateBudgetRangeModal: React.FC<Props> = ({ open, setOpen, data }) => {
  const [form] = Form.useForm();
  const [updateBudgetRange, { isLoading }] = useUpdateBudgetRangeMutation();

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        name: data.name,
        nameBn: data.nameBn,
        value: data.value,
        order: data.order ?? 0,
        isActive: data.isActive ?? true,
      });
    }
  }, [data, form]);

  const handleSubmit = async (values: {
    name?: string;
    nameBn?: string;
    value?: string;
    order?: number;
    isActive?: boolean;
  }) => {
    if (!data?._id) return;
    try {
      const payload: Partial<IBudgetRange> = {
        name: values.name?.trim(),
        nameBn: values.nameBn?.trim() ?? "",
        value: values.value?.trim(),
        order: values.order,
        isActive: values.isActive,
      };
      const res = await updateBudgetRange({
        id: data._id,
        data: payload,
      }).unwrap();
      if (res.success) {
        toast.success(res.message || "Budget range updated");
        setOpen(false);
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update budget range");
    }
  };

  return (
    <Modal
      title="Update Budget Range"
      open={open}
      onCancel={() => setOpen(false)}
      width={520}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
          tooltip="Stable code sent with the enquiry. Changing it affects new submissions only."
          rules={[
            { required: true, message: "Value is required" },
            { max: 80 },
          ]}
        >
          <Input placeholder="e.g. 2to5" className="!font-mono" />
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
              Update
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateBudgetRangeModal;
