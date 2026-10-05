import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
} from "antd";
import dayjs from "dayjs";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import LangInput from "../../components/Common/LangInput";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import RichTextEditor from "../../components/Common/RichEditor/RichTextEditor";
import UploadMedia from "../../components/shared/UploadMedia";
import { useGetAreasQuery } from "../../redux/features/area/areaApi";
import { normalizeUrl, urlRule } from "../../utils/normalizeUrl";
import { mediaSrc } from "../../utils/mediaSrc";
import {
  isEmptyRichText,
  normalizeDescriptionForEditor,
  toDescriptionArray,
} from "../../utils/richText";
import {
  BANNER_SIZE_HINT,
  featureSizeHint,
  PROJECT_THUMBNAIL_SIZE_HINT,
  STAGES,
} from "./projectMeta";

interface Props {
  /** Undefined when creating. */
  initial?: any;
  saving: boolean;
  onSubmit: (values: any) => Promise<void>;
  heading: string;
  submitLabel: string;
}

const createDefaultSpecifications = () =>
  Array.from({ length: 5 }, () => ({
    title: "",
    titleBn: "",
    description: "",
    descriptionBn: "",
  }));

const hasSpecificationContent = (item: Record<string, string>) =>
  Boolean(
    item.title?.trim() ||
      item.titleBn?.trim() ||
      !isEmptyRichText(item.description) ||
      !isEmptyRichText(item.descriptionBn),
  );

/**
 * One form for creating and editing a project development.
 */
const ProjectForm = ({
  initial,
  saving,
  onSubmit,
  heading,
  submitLabel,
}: Props) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const { data: areaData } = useGetAreasQuery({ limit: 300, activeOnly: true });

  useEffect(() => {
    if (!initial) return;
      const features = (initial.features || []).map((f: any) => {
        const previewUrl = mediaSrc(f.image);
        return {
          ...f,
          image: f.image?._id ?? f.image,
          imageUrl: previewUrl || undefined,
        };
      });

      form.setFieldsValue({
        ...initial,
        description: normalizeDescriptionForEditor(initial.description),
        descriptionBn: normalizeDescriptionForEditor(initial.descriptionBn),
        features,
        thumbnailImage: initial.thumbnailImage?._id ?? initial.thumbnailImage,
        thumbnailImageUrl: mediaSrc(initial.thumbnailImage),
        area: initial.area?._id ?? initial.area,
        coverImage: initial.coverImage?._id ?? initial.coverImage,
        coverImageUrl: mediaSrc(initial.coverImage),
        images: (initial.images || []).map((i: any) => i?._id ?? i),
        imageUrls: (initial.images || []).map((i: any) => mediaSrc(i)).filter(Boolean),
        lastInspected: initial.lastInspected
          ? dayjs(initial.lastInspected)
          : undefined,
        specs: {
          descriptions: initial.specs?.descriptions?.length
            ? initial.specs.descriptions
            : initial.specs?.description
              ? [{ title: "Specifications", description: initial.specs.description }]
              : createDefaultSpecifications(),
        },
        video: {
          ...initial.video,
          poster: initial.video?.poster?._id ?? initial.video?.poster,
        },
        videoPosterUrl: mediaSrc(initial.video?.poster),
      });
  }, [initial, form]);

  const [submitting, setSubmitting] = useState(false);
  const isSaving = saving || submitting;

  const handleFinish = async (values: any) => {
    setSubmitting(true);
    try {
      const rest = { ...values };
      delete rest.coverImageUrl;
      delete rest.thumbnailImageUrl;
      delete rest.imageUrls;
      delete rest.videoPosterUrl;
      delete rest.milestones;
      delete rest.agent;
      delete rest.featured;
      delete rest.isHome;
      delete rest.isFooter;
      delete rest.cctvStreamActive;

      const featuresToSubmit = (rest.features || []).map((f: any) => {
        const restFeature = { ...f };
        delete restFeature.imageUrl;
        return restFeature;
      });

      await onSubmit({
        ...rest,
        description: toDescriptionArray(values.description),
        descriptionBn: toDescriptionArray(values.descriptionBn),
        features: featuresToSubmit,
        video: rest.video
          ? { ...rest.video, youtubeUrl: normalizeUrl(rest.video.youtubeUrl) }
          : undefined,
        mapUrl: normalizeUrl(values.mapUrl),
        specs: {
          heroImage:
            initial?.specs?.heroImage?._id ??
            initial?.specs?.heroImage ??
            null,
          descriptions: (rest.specs?.descriptions || [])
            .filter((item: Record<string, string>) => hasSpecificationContent(item))
            .map((item: any) => ({
              ...item,
              description: isEmptyRichText(item.description) ? "" : item.description,
              descriptionBn: isEmptyRichText(item.descriptionBn) ? "" : item.descriptionBn,
            })),
          description: "",
        },
        lastInspected: values.lastInspected
          ? values.lastInspected.toISOString()
          : null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageMeta title={`${heading} · Zoom Property Admin`} noindex />
      <PageHeader
        title={heading}
        subtitle="Everything the website shows about this development"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Projects", path: "/projects" },
          { title: heading },
        ]}
        extra={
          <Button
            icon={<ArrowLeft className="size-4" />}
            onClick={() => navigate("/projects")}
          >
            Back to projects
          </Button>
        }
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          city: "Dhaka",
          stage: "Upcoming",
          isActive: true,
          units: 0,
          unitsLeft: 0,
          specs: { descriptions: createDefaultSpecifications() },
        }}
      >
        <Card className="border border-gray-300 rounded-lg bg-white shadow-xs mb-6">
          <div className="space-y-8 divide-y divide-gray-200">
            {/* 1. The Basics */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  The Basics
                </h3>
                <p className="text-xs text-muted-foreground">
                  Project name, area and city location
                </p>
              </div>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <LangInput
                    label="Name"
                    name="name"
                    lang="en"
                    required
                    placeholder="e.g. Navana Platinum"
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Area"
                    name="area"
                    rules={[{ required: true, message: "Pick the area" }]}
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Select an area"
                      options={(areaData?.result || []).map((a: any) => ({
                        value: a._id,
                        label: a.name,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="City" name="city">
                    <Input placeholder="Dhaka" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item
                    label="Google Maps Embed URL"
                    name="mapUrl"
                    tooltip="Provide the src URL from Google Maps embed code, or any map link."
                    rules={[urlRule]}
                  >
                    <Input placeholder="https://www.google.com/maps/embed?pb=..." />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item
                    label="Neighbourhood description (English)"
                    name="description"
                    tooltip="Shown beside the map in the Neighbourhood section."
                  >
                    <RichTextEditor
                      placeholder="Describe the neighbourhood and nearby conveniences..."
                      height={560}
                    />
                  </Form.Item>
                </Col>
              
              </Row>
            </div>
  <div className="space-y-4 pt-8">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Media & Visuals
                </h3>
                <p className="text-xs text-muted-foreground">
                  Upload project hero cover image and architectural gallery photos
                </p>
              </div>

              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Project card thumbnail"
                    tooltip={`Square image used on project cards. ${PROJECT_THUMBNAIL_SIZE_HINT}`}
                    extra={PROJECT_THUMBNAIL_SIZE_HINT}
                  >
                    <UploadMedia
                      form={form}
                      fieldPath="thumbnailImageUrl"
                      idFieldPath="thumbnailImage"
                      type="image"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Cover image"
                    tooltip={`First slide of the Overview banner. ${BANNER_SIZE_HINT}`}
                    extra={BANNER_SIZE_HINT}
                  >
                    <UploadMedia
                      form={form}
                      fieldPath="coverImageUrl"
                      idFieldPath="coverImage"
                      type="image"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={16}>
                  <Form.Item
                    label="Gallery"
                    tooltip={`The rest of the Overview banner slides. ${BANNER_SIZE_HINT}`}
                    extra={BANNER_SIZE_HINT}
                  >
                    <UploadMedia
                      form={form}
                      fieldPath="imageUrls"
                      idFieldPath="images"
                      mode="multiple"
                      type="image"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
            {/* 2. The Build & Milestones */}
            <div className="space-y-4 pt-8">
              <Row gutter={16}>
                <Col xs={12} md={6}>
                  <Form.Item label="Status" name="stage">
                    <Select options={STAGES} />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item label="Handover" name="handover">
                    <Input placeholder="Q4 2027" />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item label="Units" name="units">
                    <InputNumber className="!w-full" min={0} />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item label="Units left" name="unitsLeft">
                    <InputNumber className="!w-full" min={0} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item label="Size range" name="sizeRange">
                    <Input placeholder="1,450 – 2,300 sq ft" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Starting price (৳)" name="startingPrice">
                    <InputNumber className="!w-full" min={0} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="RAJUK permit no." name="rajukPermitNo">
                    <Input placeholder="RAJUK permit or clearance number" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label="Last inspected"
                    name="lastInspected"
                    tooltip="The day somebody from the agency last walked the site."
                  >
                    <DatePicker className="w-full" format="DD-MM-YYYY" />
                  </Form.Item>
                </Col>
              </Row>

            </div>

            {/* 2.5 Features (Dynamic Sections) */}
            <div className="space-y-4 pt-8">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Project Features
                </h3>
                <p className="text-xs text-muted-foreground">
                  Dynamic feature sections (e.g. Building, Smart Home, Security) shown on the details page.
                </p>
              </div>

              <div className="pt-2">
                <Form.List name="features">
                  {(fields, { add, remove }) => (
                    <div className="space-y-4">
                      {fields.map((field) => (
                        <div key={field.key} className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 relative">
                          <Button
                            type="primary"
                            danger
                            icon={<Trash2 className="h-4 w-4" />}
                            className="absolute top-4 right-4 z-10"
                            onClick={() => remove(field.name)}
                          />
                          
                          <Row gutter={16}>
                            <Col xs={24}>
                              <Form.Item
                                {...field}
                                name={[field.name, "title"]}
                                label="Title"
                                rules={[{ required: true, message: "Required" }]}
                                className="!mb-4"
                              >
                                <Input placeholder="e.g. Modern Architecture" />
                              </Form.Item>
                            </Col>
                            <Col xs={24}>
                              <Form.Item
                                {...field}
                                name={[field.name, "description"]}
                                label="Description (English)"
                                className="!mb-4"
                              >
                                <RichTextEditor placeholder="Feature description in English..." height={400} />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                              <Form.Item
                                label="Feature Image"
                                tooltip={`Feature ${field.name + 1} on the website: ${featureSizeHint(field.name)}`}
                                extra={featureSizeHint(field.name)}
                              >
                                <UploadMedia
                                  form={form}
                                  fieldPath={["features", field.name, "imageUrl"]}
                                  idFieldPath={["features", field.name, "image"]}
                                  type="image"
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        </div>
                      ))}
                      
                      <Button
                        type="dashed"
                        onClick={() => add({})}
                        block
                        icon={<Plus className="h-4 w-4" />}
                        className="h-12 border-dashed border-gray-300"
                      >
                        Add Feature Section
                      </Button>
                    </div>
                  )}
                </Form.List>
              </div>
            </div>
            {/* 3. Media & Attachments */}
          

            {/* 4. Specs tab */}
            <div className="space-y-4 pt-8">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Specifications
                </h3>
                <p className="text-xs text-muted-foreground">
                  Add titled specification sections shown under the "Specs" tab on the project page.
                </p>
              </div>

              <Form.List name={["specs", "descriptions"]}>
                {(fields, { add, remove }) => (
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <Card
                        key={field.key}
                        size="small"
                        className="!overflow-hidden !rounded-xl !border-gray-300 !bg-gray-50 !transition-colors !duration-200 hover:!border-gray-400"
                        title={
                          <span className="flex items-center gap-2.5 py-1">
                            <span
                              className="grid size-7 place-items-center rounded-full bg-gray-200 text-xs font-bold text-gray-700"
                            >
                              {index + 1}
                            </span>
                            <span className="font-semibold text-gray-800">
                              Specification section
                            </span>
                          </span>
                        }
                        extra={
                          <Button
                            type="text"
                            danger
                            icon={<Trash2 className="h-4 w-4" />}
                            onClick={() => remove(field.name)}
                          >
                            Remove
                          </Button>
                        }
                      >
                        <Row gutter={16}>
                          <Col xs={24} md={12}>
                            <Form.Item
                              name={[field.name, "title"]}
                              label="Title (English)"
                              rules={[
                                {
                                  validator: (_, value) => {
                                    const item =
                                      form.getFieldValue([
                                        "specs",
                                        "descriptions",
                                        field.name,
                                      ]) || {};
                                    if (
                                      !hasSpecificationContent(item) ||
                                      value?.trim()
                                    ) {
                                      return Promise.resolve();
                                    }
                                    return Promise.reject(
                                      new Error("Enter a section title"),
                                    );
                                  },
                                },
                              ]}
                            >
                              <Input placeholder="e.g. Dimensions" />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Form.Item
                          name={[field.name, "description"]}
                          label="Description (English)"
                          rules={[
                            {
                              validator: (_, value) => {
                                const item =
                                  form.getFieldValue([
                                    "specs",
                                    "descriptions",
                                    field.name,
                                  ]) || {};
                                if (
                                  !hasSpecificationContent(item) ||
                                  !isEmptyRichText(value)
                                ) {
                                  return Promise.resolve();
                                }
                                return Promise.reject(
                                  new Error("Enter a description"),
                                );
                              },
                            },
                          ]}
                        >
                          <RichTextEditor
                            placeholder="Add the specification details..."
                            height={440}
                          />
                        </Form.Item>
                      </Card>
                    ))}
                    <Button
                      type="dashed"
                      icon={<Plus className="h-4 w-4" />}
                      className="!h-12 !rounded-xl !border-primary/40 !bg-primary-50/40 !font-semibold !text-primary-700 transition-all duration-200 hover:!border-primary hover:!bg-primary-50 hover:!shadow-sm"
                      onClick={() =>
                        add({
                          title: "",
                          description: "",
                        })
                      }
                      block
                    >
                      Add another specification section
                    </Button>
                  </div>
                )}
              </Form.List>
            </div>

            {/* 6. Video */}
            <div className="space-y-4 pt-8">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Site Walkthrough Video
                </h3>
                <p className="text-xs text-muted-foreground">
                  YouTube video shown in the dark band below the project features
                </p>
              </div>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Video Title (English)"
                    name={["video", "title"]}
                    tooltip="Heading shown above the video player"
                  >
                    <Input placeholder="e.g. Site Walkthrough — Al Zahra" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={16}>
                  <Form.Item
                    label="YouTube URL"
                    name={["video", "youtubeUrl"]}
                    tooltip="Full YouTube video URL or bare video ID"
                    rules={[urlRule]}
                  >
                    <Input placeholder="https://www.youtube.com/watch?v=..." />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Duration"
                    name={["video", "duration"]}
                    tooltip='Optional display duration, e.g. "3:42"'
                  >
                    <Input placeholder="3:42" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Video Poster / Thumbnail"
                tooltip="Custom thumbnail shown before the video plays. Recommended: 1344×527 px"
                extra="Recommended size: 1344 × 527 px (wide banner)"
              >
                <UploadMedia
                  form={form}
                  fieldPath="videoPosterUrl"
                  idFieldPath={["video", "poster"]}
                  type="image"
                />
              </Form.Item>
            </div>

            {/* 7. Activity */}
            <div className="space-y-4 pt-8">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Activity
                </h3>
              </div>

              <div className="max-w-[280px] rounded-lg border border-gray-200 bg-gray-50/50 p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground text-sm">Active</p>
                  <p className="text-xs text-muted-foreground">Show in portal</p>
                </div>
                <Form.Item name="isActive" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions Bottom Bar */}
        <div className="flex items-center justify-end gap-3 sticky bottom-4 z-10 bg-white/95 backdrop-blur-md p-4 rounded-lg border border-gray-300 shadow-md">
          <Button onClick={() => navigate("/projects")} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isSaving}
            disabled={isSaving}
            size="large"
          >
            {isSaving ? "Saving..." : submitLabel}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ProjectForm;
