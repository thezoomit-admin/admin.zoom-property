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
  Tooltip,
} from "antd";
import dayjs from "dayjs";
import { ArrowLeft, Languages, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import LangInput from "../../components/Common/LangInput";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import RichTextEditor from "../../components/Common/RichEditor/RichTextEditor";
import UploadMedia from "../../components/shared/UploadMedia";
import { useGetAgentsQuery } from "../../redux/features/agent/agentApi";
import { useGetAreasQuery } from "../../redux/features/area/areaApi";
import { useGetSubAreasQuery } from "../../redux/features/subArea/subAreaApi";
import { normalizeUrl, urlRule } from "../../utils/normalizeUrl";
import { mediaSrc } from "../../utils/mediaSrc";
import {
  isEmptyRichText,
  normalizeDescriptionForEditor,
  toDescriptionArray,
  translateRichTextToBangla,
} from "../../utils/richText";
import { STAGES } from "./projectMeta";

interface Props {
  /** Undefined when creating. */
  initial?: any;
  saving: boolean;
  onSubmit: (values: any) => Promise<void>;
  heading: string;
  submitLabel: string;
}

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
  const [translatingDescBn, setTranslatingDescBn] = useState(false);

  const { data: areaData } = useGetAreasQuery({ limit: 300, activeOnly: true });
  const { data: agentData } = useGetAgentsQuery({ limit: 300 });
  const selectedAreaId = Form.useWatch("area", form);
  const { data: subAreaData } = useGetSubAreasQuery(
    { area: selectedAreaId, limit: 200, activeOnly: true, sort: "order" },
    { skip: !selectedAreaId },
  );

  const handleTranslateDescription = async () => {
    const enText = form.getFieldValue("description");
    if (isEmptyRichText(enText)) {
      toast.info("অনুবাদের জন্য আগে ইংরেজিতে বিবরণ (English description) লিখুন");
      return;
    }
    setTranslatingDescBn(true);
    try {
      const bnText = await translateRichTextToBangla(enText);
      form.setFieldsValue({ descriptionBn: bnText });
      toast.success("বিবরণ বাংলায় রূপান্তর করা হয়েছে!");
    } catch {
      toast.error("অনুবাদ করতে সমস্যা হয়েছে");
    } finally {
      setTranslatingDescBn(false);
    }
  };

  useEffect(() => {
    if (!initial) return;
    form.setFieldsValue({
      ...initial,
      area: initial.area?._id ?? initial.area,
      subArea: initial.subArea?._id ?? initial.subArea,
      agent: initial.agent?._id ?? initial.agent,
      coverImage: initial.coverImage?._id ?? initial.coverImage,
      coverImageUrl: mediaSrc(initial.coverImage),
      images: (initial.images || []).map((i: any) => i?._id ?? i),
      imageUrls: (initial.images || []).map((i: any) => mediaSrc(i)).filter(Boolean),
      lastInspected: initial.lastInspected
        ? dayjs(initial.lastInspected)
        : undefined,
      description: normalizeDescriptionForEditor(initial.description),
      descriptionBn: normalizeDescriptionForEditor(initial.descriptionBn),
    });
  }, [initial, form]);

  const handleFinish = async (values: any) => {
    const { coverImageUrl, imageUrls, ...rest } = values;
    void coverImageUrl;
    void imageUrls;
    await onSubmit({
      ...rest,
      video: rest.video
        ? { ...rest.video, youtubeUrl: normalizeUrl(rest.video.youtubeUrl) }
        : undefined,
      mapUrl: normalizeUrl(values.mapUrl),
      description: toDescriptionArray(values.description),
      descriptionBn: toDescriptionArray(values.descriptionBn),
      lastInspected: values.lastInspected
        ? values.lastInspected.toISOString()
        : null,
    });
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
          stage: "Planning",
          isActive: true,
          featured: false,
          isHome: false,
          isFooter: false,
          cctvStreamActive: false,
          units: 0,
          unitsLeft: 0,
        }}
      >
        <Card className="border border-gray-300 rounded-lg bg-white shadow-xs mb-6">
          <div className="space-y-8 divide-y divide-gray-200">
            {/* 1. The Basics */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  The Basics (মৌলিক তথ্য)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Project name, developer profile, area and city location
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
                  <LangInput
                    label="Name (Bangla)"
                    name="nameBn"
                    lang="bn"
                    sourceFieldName="name"
                    form={form}
                    placeholder="প্রজেক্টের নাম"
                  />
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item label="Developer" name="developer">
                    <Input placeholder="Developer company name" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
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
                      onChange={() => form.setFieldValue("subArea", undefined)}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Sub-area"
                    name="subArea"
                    tooltip="Optional pocket inside the area (shown after the lead form on the website)."
                  >
                    <Select
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      placeholder={
                        selectedAreaId
                          ? "Select a sub-area"
                          : "Pick an area first"
                      }
                      disabled={!selectedAreaId}
                      options={(subAreaData?.result || []).map((s: any) => ({
                        value: s._id,
                        label: s.name,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
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
              </Row>
            </div>

            {/* 2. The Build & Milestones */}
            <div className="space-y-4 pt-8">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  The Build & Specifications (নির্মাণ অগ্রগতি ও স্পেসিফিকেশন)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Construction stage, timeline, units, pricing and milestone progress
                </p>
              </div>

              <Row gutter={16}>
                <Col xs={12} md={6}>
                  <Form.Item label="Stage" name="stage">
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

              {/* The build programme. Each line carries its share of the whole, and
                  the ticked ones add up to what the site reports. */}
              <div className="pt-2">
                <Form.List name="milestones">
                  {(fields, { add, remove }) => (
                    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Build Programme & Milestones
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Progress % is automatically calculated from completed milestones
                          </p>
                        </div>
                        <Button
                          size="small"
                          type="dashed"
                          icon={<Plus className="h-3.5 w-3.5" />}
                          onClick={() => add({ percent: 10, completed: false })}
                        >
                          Add milestone
                        </Button>
                      </div>

                      {fields.length === 0 && (
                        <p className="py-2 text-xs text-muted-foreground">
                          No milestones yet — progress stays at 0%.
                        </p>
                      )}

                      {fields.map((field) => (
                        <Row
                          key={field.key}
                          gutter={8}
                          align="middle"
                          className="mb-2"
                        >
                          <Col xs={24} md={11}>
                            <Form.Item
                              {...field}
                              key={`${field.key}-label`}
                              name={[field.name, "label"]}
                              rules={[{ required: true, message: "Name it" }]}
                              className="!mb-1"
                            >
                              <Input placeholder="Foundation complete" />
                            </Form.Item>
                          </Col>
                          <Col xs={12} md={7}>
                            <Form.Item
                              key={`${field.key}-labelBn`}
                              name={[field.name, "labelBn"]}
                              className="!mb-1"
                            >
                              <Input placeholder="বাংলা" />
                            </Form.Item>
                          </Col>
                          <Col xs={6} md={3}>
                            <Form.Item
                              key={`${field.key}-percent`}
                              name={[field.name, "percent"]}
                              className="!mb-1"
                            >
                              <InputNumber
                                className="!w-full"
                                min={0}
                                max={100}
                                addonAfter="%"
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={4} md={2}>
                            <Form.Item
                              key={`${field.key}-completed`}
                              name={[field.name, "completed"]}
                              valuePropName="checked"
                              className="!mb-1"
                            >
                              <Switch size="small" />
                            </Form.Item>
                          </Col>
                          <Col xs={2} md={1}>
                            <Button
                              type="text"
                              danger
                              icon={<Trash2 className="h-4 w-4" />}
                              onClick={() => remove(field.name)}
                            />
                          </Col>
                        </Row>
                      ))}
                    </div>
                  )}
                </Form.List>
              </div>
            </div>

            {/* 3. Media & Attachments */}
            <div className="space-y-4 pt-8">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Media & Visuals (ছবি ও গ্যালারি)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Upload project hero cover image and architectural gallery photos
                </p>
              </div>

              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item label="Cover image">
                    <UploadMedia
                      form={form}
                      fieldPath="coverImageUrl"
                      idFieldPath="coverImage"
                      type="image"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={16}>
                  <Form.Item label="Gallery">
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

            {/* 4. Description */}
            <div className="space-y-4 pt-8">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Detailed Description (বিস্তারিত বিবরণ)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Comprehensive development overview in English and Bangla
                </p>
              </div>

              <Form.Item
                label="Description (English)"
                name="description"
                tooltip="Detailed project description with rich formatting."
              >
                <RichTextEditor
                  placeholder="Enter description in English..."
                  height={400}
                />
              </Form.Item>
              <Form.Item
                label={
                  <div className="flex items-center justify-between w-full gap-2">
                    <span>Description (Bangla)</span>
                    <Tooltip title="ইংরেজিতে লেখা বিবরণ থেকে বাংলায় রূপান্তর করুন">
                      <Button
                        type="link"
                        size="small"
                        className="!px-1 !h-auto !text-xs flex items-center gap-1 text-primary-600 hover:text-primary-700 shrink-0 whitespace-nowrap"
                        onClick={handleTranslateDescription}
                        loading={translatingDescBn}
                        icon={
                          translatingDescBn ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Languages className="w-3.5 h-3.5" />
                          )
                        }
                      >
                        {translatingDescBn ? "রূপান্তর হচ্ছে..." : "বাংলা করুন"}
                      </Button>
                    </Tooltip>
                  </div>
                }
                name="descriptionBn"
                tooltip="বাংলায় বিস্তারিত বিবরণ"
              >
                <RichTextEditor placeholder="বাংলায় বিবরণ লিখুন..." height={400} />
              </Form.Item>
            </div>

            {/* 5. Publishing & Settings */}
            <div className="space-y-4 pt-8">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Publishing & Visibility Settings (প্রচার ও সেটিংস)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Configure featured badges, homepage exposure, live CCTV and active status
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <Form.Item
                  label="Agent / Consultant"
                  name="agent"
                  tooltip="The consultant associated with this project."
                  className="!mb-0"
                >
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    placeholder="Select an agent"
                    options={(agentData?.result || []).map((a: any) => ({
                      value: a._id,
                      label: `${a.name} (${a.role})`,
                    }))}
                  />
                </Form.Item>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground text-sm">Active</p>
                    <p className="text-xs text-muted-foreground">Show in portal</p>
                  </div>
                  <Form.Item name="isActive" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground text-sm">Featured</p>
                    <p className="text-xs text-muted-foreground">Highlight badge</p>
                  </div>
                  <Form.Item name="featured" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground text-sm">On Home Page</p>
                    <p className="text-xs text-muted-foreground">Home showcase</p>
                  </div>
                  <Form.Item name="isHome" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground text-sm">In Footer</p>
                    <p className="text-xs text-muted-foreground">Show in footer list</p>
                  </div>
                  <Form.Item name="isFooter" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground text-sm">CCTV Live</p>
                    <p className="text-xs text-muted-foreground">Stream active</p>
                  </div>
                  <Form.Item name="cctvStreamActive" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions Bottom Bar */}
        <div className="flex items-center justify-end gap-3 sticky bottom-4 z-10 bg-white/95 backdrop-blur-md p-4 rounded-lg border border-gray-300 shadow-md">
          <Button onClick={() => navigate("/projects")}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={saving} size="large">
            {submitLabel}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ProjectForm;
