import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
  Tooltip,
} from "antd";
import dayjs from "dayjs";
import { ArrowLeft, Languages, Loader2 } from "lucide-react";
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
import { useGetProjectsQuery } from "../../redux/features/project/projectApi";
import { useGetPropertyOptionsQuery } from "../../redux/features/property/propertyApi";
import {
  BADGES,
  FURNISHINGS,
  STATUSES,
} from "./propertyMeta";
import { normalizeUrl, urlRule } from "../../utils/normalizeUrl";
import { mediaSrc } from "../../utils/mediaSrc";
import {
  isEmptyRichText,
  normalizeDescriptionForEditor,
  toDescriptionArray,
  translateRichTextToBangla,
} from "../../utils/richText";

interface Props {
  /** Undefined when creating. */
  initial?: any;
  saving: boolean;
  onSubmit: (values: any) => Promise<void>;
  heading: string;
  submitLabel: string;
}

/**
 * One form for creating and editing a listing.
 */
const PropertyForm = ({
  initial,
  saving,
  onSubmit,
  heading,
  submitLabel,
}: Props) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [translatingDescBn, setTranslatingDescBn] = useState(false);

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
      toast.success("বিবরণ বাংলায় রূপান্তর করা হয়েছে!");
    } catch {
      toast.error("অনুবাদ করতে সমস্যা হয়েছে");
    } finally {
      setTranslatingDescBn(false);
    }
  };

  const { data: areaData } = useGetAreasQuery({ limit: 300, activeOnly: true });
  const { data: agentData } = useGetAgentsQuery({ limit: 300 });
  const { data: projectData } = useGetProjectsQuery({ limit: 300, activeOnly: true });
  const { data: amenities = [] } = useGetPropertyOptionsQuery({
    kind: "amenities",
    activeOnly: true,
  });
  const { data: propertyTypes = [] } = useGetPropertyOptionsQuery({
    kind: "types",
    activeOnly: true,
  });

  useEffect(() => {
    if (!initial) return;
    form.setFieldsValue({
      ...initial,
      area: initial.area?._id ?? initial.area,
      agent: initial.agent?._id ?? initial.agent,
      project: initial.project?._id ?? initial.project,
      amenities: (initial.amenities || []).map((a: any) => a?._id ?? a),
      coverImage: initial.coverImage?._id ?? initial.coverImage,
      coverImageUrl: mediaSrc(initial.coverImage),
      images: (initial.images || []).map((i: any) => i?._id ?? i),
      imageUrls: (initial.images || []).map((i: any) => mediaSrc(i)).filter(Boolean),
      expiresAt: initial.expiresAt ? dayjs(initial.expiresAt) : undefined,
      description: normalizeDescriptionForEditor(initial.description),
      descriptionBn: normalizeDescriptionForEditor(initial.descriptionBn),
    });
  }, [initial, form]);

  const [submitting, setSubmitting] = useState(false);
  const isSaving = saving || submitting;

  const handleFinish = async (values: any) => {
    setSubmitting(true);
    try {
      const { coverImageUrl, imageUrls, ...rest } = values;
      void coverImageUrl;
      void imageUrls;
      await onSubmit({
        purpose: "sale",
        ...rest,
        virtualTourUrl: normalizeUrl(values.virtualTourUrl),
        videoUrl: normalizeUrl(values.videoUrl),
        mapUrl: normalizeUrl(values.mapUrl),
        description: toDescriptionArray(values.description),
        descriptionBn: toDescriptionArray(values.descriptionBn),
        expiresAt: values.expiresAt ? values.expiresAt.toISOString() : null,
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
        subtitle="Everything the website shows about this property"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Listings", path: "/properties" },
          { title: heading },
        ]}
        extra={
          <Button
            icon={<ArrowLeft className="size-4" />}
            onClick={() => navigate("/properties")}
          >
            Back to listings
          </Button>
        }
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          purpose: "sale",
          type: "apartment",
          status: "draft",
          city: "Dhaka",
          furnishing: "Unfurnished",
          rajukApproved: false,
          hasVirtualTour: false,
          featured: false,
          beds: 0,
          baths: 0,
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
                  Title, pricing, property category and listing status
                </p>
              </div>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <LangInput
                    label="Title"
                    name="title"
                    lang="en"
                    required
                    placeholder="e.g. Harbour View Loft"
                  />
                </Col>
                <Col xs={24} md={12}>
                  <LangInput
                    label="Title (Bangla)"
                    name="titleBn"
                    lang="bn"
                    sourceFieldName="title"
                    form={form}
                    placeholder="বাংলা শিরোনাম"
                  />
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item label="Type" name="type" rules={[{ required: true }]}>
                    <Select
                      placeholder="Select property type"
                      options={(Array.isArray(propertyTypes) ? propertyTypes : (propertyTypes as any)?.rows || []).map((t: any) => ({
                        value: t.name,
                        label: t.nameBn
                          ? `${t.description || t.name} (${t.nameBn})`
                          : t.description || t.name,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Status"
                    name="status"
                    tooltip="A draft is not on the website. Nothing goes live by being saved."
                  >
                    <Select options={STATUSES} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Badge" name="badge">
                    <Select allowClear options={BADGES} placeholder="Select badge" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label="Price (৳)"
                    name="price"
                    rules={[{ required: true, message: "Enter the asking price" }]}
                  >
                    <InputNumber className="!w-full" min={0} placeholder="e.g. 15,000,000" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Service charge (৳ / month)" name="serviceCharge">
                    <InputNumber className="!w-full" min={0} placeholder="e.g. 5,000" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Mandate ends"
                    name="expiresAt"
                    tooltip="Past this date the nightly sweep archives the listing."
                  >
                    <DatePicker className="w-full" format="DD-MM-YYYY" placeholder="Select end date" />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 2. Where It Is */}
            <div className="space-y-4 pt-8">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Where It Is (অবস্থান ও ঠিকানা)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Area assignment and published address information
                </p>
              </div>

              <Row gutter={16}>
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
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="City" name="city">
                    <Input placeholder="e.g. Dhaka" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Address"
                    name="addressLine"
                    tooltip="Only what the owner is happy to publish."
                  >
                    <Input placeholder="House 12, Road 7" />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 3. The Property */}
            <div className="space-y-4 pt-8">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  The Property (স্পেসিফিকেশন ও সুযোগ-সুবিধা)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Rooms, measurements, furnishing, permits and amenities
                </p>
              </div>

              <Row gutter={16}>
                <Col xs={12} md={4}>
                  <Form.Item label="Beds" name="beds">
                    <InputNumber className="!w-full" min={0} placeholder="e.g. 3" />
                  </Form.Item>
                </Col>
                <Col xs={12} md={4}>
                  <Form.Item label="Baths" name="baths">
                    <InputNumber className="!w-full" min={0} placeholder="e.g. 3" />
                  </Form.Item>
                </Col>
                <Col xs={12} md={4}>
                  <Form.Item
                    label="Size (sq ft)"
                    name="size"
                    rules={[{ required: true, message: "Enter the covered area" }]}
                  >
                    <InputNumber className="!w-full" min={0} placeholder="e.g. 1600" />
                  </Form.Item>
                </Col>
                <Col xs={12} md={4}>
                  <Form.Item label="Land (katha)" name="katha">
                    <InputNumber className="!w-full" min={0} placeholder="e.g. 5" />
                  </Form.Item>
                </Col>
                <Col xs={12} md={4}>
                  <Form.Item label="Floor" name="floor">
                    <Input placeholder="e.g. 7th" />
                  </Form.Item>
                </Col>
                <Col xs={12} md={4}>
                  <Form.Item label="Parking" name="parking">
                    <InputNumber className="!w-full" min={0} placeholder="e.g. 1" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item label="Furnishing" name="furnishing">
                    <Select options={FURNISHINGS} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Handover"
                    name="handover"
                    tooltip="Free text — most of them are a quarter, not a date."
                  >
                    <Input placeholder="Ready · Q4 2027" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Amenities" name="amenities">
                    <Select
                      mode="multiple"
                      allowClear
                      optionFilterProp="label"
                      placeholder="Lift, generator, gym…"
                      options={(Array.isArray(amenities) ? amenities : (amenities as any)?.rows || []).map((a: any) => ({
                        value: a._id,
                        label: a.name,
                      }))}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider className="!my-2" />

              <Row gutter={16}>
                <Col xs={12} md={6}>
                  <Form.Item
                    label="RAJUK approved"
                    name="rajukApproved"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item
                    label="Virtual tour"
                    name="hasVirtualTour"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Virtual tour URL"
                    name="virtualTourUrl"
                    rules={[urlRule]}
                  >
                    <Input placeholder="https://…" />
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

            {/* 4. Media & Videos */}
            <div className="space-y-4 pt-8">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Media & Visuals (ছবি ও ভিডিও)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Upload high resolution cover photo, image gallery, and video walkthrough
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
                <Col xs={24}>
                  <Form.Item
                    label="Walkthrough video"
                    name="videoUrl"
                    tooltip="A YouTube or Vimeo link. The player only loads when somebody presses play."
                    rules={[urlRule]}
                  >
                    <Input placeholder="https://youtube.com/watch?v=…" />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 5. Project Association & Publishing */}
            <div className="space-y-4 pt-8">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Project Association & Features (প্রজেক্ট ও প্রচার সেটিংস)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Link to a development project and set visibility preferences
                </p>
              </div>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Project"
                    name="project"
                    tooltip="Set when the unit belongs to a development on the books."
                  >
                    <Select
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      placeholder="Not part of a project"
                      options={(projectData?.result || []).map((p: any) => ({
                        value: p._id,
                        label: p.name,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Agent / Consultant"
                    name="agent"
                    tooltip="The consultant associated with this property."
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
                </Col>
                <Col xs={24} md={24}>
                  <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground text-sm">Featured Listing</p>
                        <p className="text-xs text-muted-foreground">Display prominently on the website home page</p>
                      </div>
                      <Form.Item name="featured" valuePropName="checked" noStyle>
                        <Switch />
                      </Form.Item>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* 6. Description */}
            <div className="space-y-4 pt-8">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Detailed Description (বিস্তারিত বিবরণ)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Comprehensive property details in English and Bangla
                </p>
              </div>

              <Form.Item
                label="Description (English)"
                name="description"
                tooltip="Detailed property description with rich formatting."
              >
                <RichTextEditor placeholder="Enter description in English..." height={400} />
              </Form.Item>
              <Form.Item
                label={
                  <div className="flex items-center justify-between w-full gap-2">
                    <span>Description (Bangla)</span>
                    <Tooltip title="ইংরেজিতে লেখা বিবরণ থেকে বাংলায় রূপান্তর করুন">
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
          </div>
        </Card>

        {/* Actions Bottom Bar */}
        <div className="flex items-center justify-end gap-3 sticky bottom-4 z-10 bg-white/95 backdrop-blur-md p-4 rounded-lg border border-gray-300 shadow-md">
          <Button onClick={() => navigate("/properties")} disabled={isSaving}>
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

export default PropertyForm;
