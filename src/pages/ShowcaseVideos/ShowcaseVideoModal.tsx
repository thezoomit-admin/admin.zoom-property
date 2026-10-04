import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Switch,
} from "antd";
import { useEffect } from "react";
import { toast } from "react-toastify";

import LangInput from "../../components/Common/LangInput";
import UploadMedia from "../../components/shared/UploadMedia";
import { useGetAreasQuery } from "../../redux/features/area/areaApi";
import {
  useCreateShowcaseVideoMutation,
  useUpdateShowcaseVideoMutation,
} from "../../redux/features/showcaseVideo/showcaseVideoApi";
import { normalizeUrl, urlRule } from "../../utils/normalizeUrl";

interface Props {
  open: boolean;
  onClose: () => void;
  video?: any;
}

/**
 * One film on the home page carousel.
 *
 * The poster is uploaded rather than taken from YouTube: the frame the card
 * opens on is an editorial choice - the still that sells the film - and
 * YouTube's automatic pick is rarely it.
 */
const ShowcaseVideoModal = ({ open, onClose, video }: Props) => {
  const [form] = Form.useForm();
  const [createVideo, { isLoading: creating }] =
    useCreateShowcaseVideoMutation();
  const [updateVideo, { isLoading: updating }] =
    useUpdateShowcaseVideoMutation();
  const { data: areaData } = useGetAreasQuery({ limit: 300, activeOnly: true });

  useEffect(() => {
    if (!open) return form.resetFields();
    if (video) {
      form.setFieldsValue({
        ...video,
        poster: video.poster?._id ?? video.poster,
        posterUrl: video.poster?.key,
      });
    }
  }, [open, video, form]);

  const onFinish = async (values: any) => {
    const { posterUrl, ...rest } = values;
    void posterUrl;
    const body = { ...rest, youtubeUrl: normalizeUrl(rest.youtubeUrl) };
    try {
      const res: any = video
        ? await updateVideo({ id: video._id, data: body }).unwrap()
        : await createVideo(body).unwrap();
      toast.success(res?.message || "Saved");
      onClose();
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not save the video");
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={video ? "Edit video" : "Add a video"}
      footer={null}
      width={760}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          isPublished: false,
          isHome: true,
          order: 0,
          channelName: "Zoom IT & Zoom Property",
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <LangInput
              label="Title"
              name="title"
              lang="en"
              required
              placeholder="The Luminary Duplex - Grand Living Walkthrough"
            />
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Description" name="description">
              <Input.TextArea autoSize={{ minRows: 2 }} />
            </Form.Item>
          </Col>

          <Col xs={24} md={16}>
            <Form.Item
              label="Video link"
              name="youtubeUrl"
              rules={[
                { required: true, message: "A video link is required" },
                urlRule,
              ]}
              tooltip="YouTube or Vimeo. Paste the embed code and the address is pulled out of it."
            >
              <Input placeholder="https://youtube.com/watch?v=…" />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item
              label="Duration"
              name="duration"
              tooltip="As it should read on the card."
            >
              <Input placeholder="03:45" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Category"
              name="category"
              tooltip="The pill on the still: Penthouse Tour, Construction Update."
            >
              <Input placeholder="Penthouse Tour" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Location" name="location">
              <Select
                showSearch
                allowClear
                optionFilterProp="label"
                placeholder="Select an area"
                options={(areaData?.result || []).map((area: any) => ({
                  value: [area.name, area.city].filter(Boolean).join(", "),
                  label: [area.name, area.city].filter(Boolean).join(", "),
                }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Views"
              name="views"
              tooltip="As written, e.g. 24.5K views. The site does not count these."
            >
              <Input placeholder="24.5K views" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Channel" name="channelName">
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <div className="mb-4 rounded-md bg-blue-50 p-4 border border-blue-200">
              <h4 className="text-blue-800 font-semibold mb-1">Design Guidelines for Poster</h4>
              <ul className="text-sm text-blue-700 list-disc list-inside">
                <li>For the best card design, upload an image with a <strong>3:2 aspect ratio</strong> (e.g., 900x600 or 1200x800).</li>
                <li>The image will be displayed on the video card and should represent the video clearly.</li>
              </ul>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Poster" name="posterUrl">
              <UploadMedia
                form={form}
                fieldPath="posterUrl"
                idFieldPath="poster"
                type="image"
              />
            </Form.Item>
            <Form.Item name="poster" hidden>
              <Input />
            </Form.Item>
          </Col>

          <Col xs={12} md={4}>
            <Form.Item label="Order" name="order">
              <InputNumber className="!w-full" min={0} />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item
              label="On home page"
              name="isHome"
              valuePropName="checked"
            >
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
        </Row>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={creating || updating}>
            {video ? "Save changes" : "Add video"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ShowcaseVideoModal;
