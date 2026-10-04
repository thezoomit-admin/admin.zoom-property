import { Button, Col, Form, Input, InputNumber, Modal, Row, Switch } from "antd";
import { useEffect } from "react";
import { toast } from "react-toastify";

import LangInput from "../../components/Common/LangInput";
import RichTextEditor from "../../components/Common/RichEditor/RichTextEditor";
import UploadMedia from "../../components/shared/UploadMedia";
import {
  useCreateLandownerProjectMutation,
  useUpdateLandownerProjectMutation,
} from "../../redux/features/landowner/landownerApi";

interface Props {
  open: boolean;
  onClose: () => void;
  project?: any;
}

/**
 * One block on the landowners page: a photograph, a heading, and a passage.
 *
 * Three fields and no more. The description is the panel's rich-text editor
 * rather than a plain box because the desk writes lists and bold terms in
 * here - the owner share, the escrow, the handover date - and a textarea would
 * flatten all of that on save.
 */
const LandownerProjectModal = ({ open, onClose, project }: Props) => {
  const [form] = Form.useForm();
  const [createProject, { isLoading: creating }] =
    useCreateLandownerProjectMutation();
  const [updateProject, { isLoading: updating }] =
    useUpdateLandownerProjectMutation();

  useEffect(() => {
    if (!open) return form.resetFields();
    if (project) {
      form.setFieldsValue({
        ...project,
        image: project.image?._id ?? project.image,
        imageUrl: project.image?.key,
      });
    }
  }, [open, project, form]);

  const onFinish = async (values: any) => {
    const { imageUrl, ...rest } = values;
    void imageUrl;
    try {
      const res: any = project
        ? await updateProject({ id: project._id, data: rest }).unwrap()
        : await createProject(rest).unwrap();
      toast.success(res?.message || "Saved");
      onClose();
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not save the block");
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={project ? "Edit block" : "Add a block"}
      footer={null}
      width={880}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ isPublished: false, isHome: true, order: 0 }}
      >
        <p className="mb-6 rounded-md bg-secondary-50 p-3 text-xs leading-relaxed text-secondary-600">
          <strong>Design Guidelines:</strong> To keep the website layout balanced, please keep the <strong>Title</strong> concise and the <strong>Description</strong> short (around 2-3 paragraphs). For the <strong>Image</strong>, upload a landscape photo with a roughly 4:3 aspect ratio (e.g. 800x600). Images that are too tall may break the card design.
        </p>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <LangInput
              label="Title"
              name="title"
              lang="en"
              required
              placeholder="Why choose us as a partner for your land?"
            />
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Image"
              name="imageUrl"
              tooltip="Sits beside the text. Landscape reads best — roughly 4:3."
            >
              <UploadMedia
                form={form}
                fieldPath="imageUrl"
                idFieldPath="image"
                type="image"
              />
            </Form.Item>
            <Form.Item name="image" hidden>
              <Input />
            </Form.Item>
          </Col>

          <Col xs={12} md={4}>
            <Form.Item
              label="Order"
              name="order"
              tooltip="Lowest first. Blocks alternate side automatically."
            >
              <InputNumber className="!w-full" min={0} />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item label="On page" name="isHome" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item
              label="Published"
              name="isPublished"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item label="Description" name="description">
              <RichTextEditor
                placeholder="Write the passage in English..."
                height={500}
              />
            </Form.Item>
          </Col>

        </Row>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={creating || updating}>
            {project ? "Save changes" : "Add block"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default LandownerProjectModal;
