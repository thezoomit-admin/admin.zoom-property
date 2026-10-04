import { Button, Card, Col, Form, Input, InputNumber, Row, Switch } from "antd";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import LangInput from "../../components/Common/LangInput";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import UploadMedia from "../../components/shared/UploadMedia";
import { mediaSrc } from "../../utils/mediaSrc";

interface Props {
  /** Undefined when creating. */
  initial?: any;
  saving: boolean;
  onSubmit: (values: any) => Promise<void>;
  heading: string;
  submitLabel: string;
}

/**
 * Full page form for creating and editing an area / neighbourhood.
 */
const AreaForm = ({
  initial,
  saving,
  onSubmit,
  heading,
  submitLabel,
}: Props) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [monthlyRent, setMonthlyRent] = useState<number | null>(null);

  useEffect(() => {
    if (!initial) return;
    const img = initial.image;
    let imgId = undefined;
    let imgUrl = undefined;

    if (img && typeof img === "object") {
      imgId = img._id;
      imgUrl = mediaSrc(img);
    } else if (typeof img === "string") {
      if (img.startsWith("http") || img.includes("/") || img.includes(".")) {
        imgUrl = mediaSrc(img);
      } else if (/^[0-9a-fA-F]{24}$/.test(img)) {
        imgId = img;
      }
    }

    form.setFieldsValue({
      ...initial,
      image: imgId,
      imageUrl: imgUrl,
    });
    // Try to estimate monthly rent if medianPrice and yield are present
    if (initial.medianPrice && initial.rentalYield) {
      const pct = parseFloat(String(initial.rentalYield).replace(/[^0-9.]/g, ""));
      if (!isNaN(pct) && pct > 0) {
        const estimatedYearly = (initial.medianPrice * pct) / 100;
        setMonthlyRent(Math.round(estimatedYearly / 12));
      }
    }
  }, [initial, form]);

  const handleMonthlyRentChange = (rent: number | null) => {
    setMonthlyRent(rent);
    const median = form.getFieldValue("medianPrice");
    if (rent && median && median > 0) {
      const yearly = rent * 12;
      const calculatedYield = ((yearly / median) * 100).toFixed(1) + "%";
      form.setFieldsValue({ rentalYield: calculatedYield });
    }
  };

  const handleMedianPriceChange = (price: number | null) => {
    if (monthlyRent && price && price > 0) {
      const yearly = monthlyRent * 12;
      const calculatedYield = ((yearly / price) * 100).toFixed(1) + "%";
      form.setFieldsValue({ rentalYield: calculatedYield });
    }
  };

  const [submitting, setSubmitting] = useState(false);
  const isSaving = saving || submitting;

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      const { imageUrl, ...rest } = values;
      void imageUrl;
      if (rest.medianPrice !== undefined && rest.medianPrice !== null) {
        rest.medianPrice = Number(rest.medianPrice) || 0;
      }
      if (rest.pricePerSqft !== undefined && rest.pricePerSqft !== null) {
        rest.pricePerSqft = Number(rest.pricePerSqft) || 0;
      }
      await onSubmit(rest);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageMeta
        title={`${heading} | Zoom Property`}
        description="Manage neighbourhood and service area records."
      />

      <PageHeader
        title={heading}
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Areas", path: "/areas" },
          { title: heading },
        ]}
        extra={
          <Button
            icon={<ArrowLeft className="size-4" />}
            onClick={() => navigate("/areas")}
          >
            Back to areas
          </Button>
        }
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          city: "Dhaka",
          isActive: true,
          featured: false,
          isHome: false,
        }}
      >
        <Card className="border border-gray-300 rounded-lg bg-white shadow-xs mb-6">
          <div className="space-y-8 divide-y divide-gray-200">
            {/* 1. Basic Details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Basic Details
                </h3>
                <p className="text-xs text-muted-foreground">
                  Name, tagline and general location information
                </p>
              </div>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <LangInput
                    label="Name (English)"
                    name="name"
                    lang="en"
                    required
                    placeholder="Gulshan (1 & 2)"
                  />
                </Col>
                <Col xs={24} md={12}>
                  <LangInput
                    label="Tagline (English)"
                    name="tagline"
                    lang="en"
                    placeholder="Diplomatic Zone & Luxury Living"
                  />
                </Col>
                <Col xs={24} md={12}>
                  <LangInput
                    label="City"
                    name="city"
                    lang="en"
                    placeholder="Dhaka"
                  />
                </Col>
              </Row>
            </div>

            {/* 2. Note / Why People Choose This Area */}
            <div className="space-y-4 pt-8">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Area Highlights & Overview
                </h3>
                <p className="text-xs text-muted-foreground">
                  Detailed summary explaining what makes this neighborhood desirable
                </p>
              </div>

              <Row gutter={16}>
                <Col xs={24}>
                  <LangInput
                    label="Note (English)"
                    name="note"
                    lang="en"
                    isTextArea
                    placeholder="Why people choose it — short overview of neighbourhood..."
                  />
                </Col>
              </Row>
            </div>

            {/* 3. Market & Comparison Metrics */}
            <div className="space-y-4 pt-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Market & Comparison Metrics
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Price benchmarks and connectivity data shown in comparison tables
                  </p>
                </div>
                <span className="text-xs bg-primary/10 text-primary font-medium px-2.5 py-1 rounded-full border border-primary/20">
                  💡 Rental yield is calculated automatically from the monthly rent.
                </span>
              </div>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Median Asking Price (BDT)"
                    name="medianPrice"
                    tooltip="The area's typical apartment price. Enter 5000000 for BDT 5,000,000."
                  >
                    <InputNumber
                      className="w-full"
                      placeholder="e.g. 5000000"
                      min={0}
                      onChange={handleMedianPriceChange}
                      formatter={(value) =>
                        value ? `৳ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""
                      }
                      parser={(value) =>
                        value ? Number(value.replace(/৳\s?|(,*)/g, "")) : (undefined as any)
                      }
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Price Per Sq Ft (BDT)"
                    name="pricePerSqft"
                    tooltip="The average price per square foot. For example: 23000."
                  >
                    <InputNumber
                      className="w-full"
                      placeholder="e.g. 23000"
                      min={0}
                      formatter={(value) =>
                        value ? `৳ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""
                      }
                      parser={(value) =>
                        value ? Number(value.replace(/৳\s?|(,*)/g, "")) : (undefined as any)
                      }
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Estimated Monthly Rent (BDT)"
                    tooltip="Annual rent and rental yield are calculated automatically from the monthly rent."
                    extra={
                      monthlyRent
                        ? `Annual rent: ৳ ${(monthlyRent * 12).toLocaleString()} (${monthlyRent.toLocaleString()} × 12 months)`
                        : undefined
                    }
                  >
                    <InputNumber
                      className="w-full"
                      placeholder="e.g. 25000"
                      min={0}
                      value={monthlyRent}
                      onChange={handleMonthlyRentChange}
                      formatter={(value) =>
                        value ? `৳ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""
                      }
                      parser={(value) =>
                        value ? Number(value.replace(/৳\s?|(,*)/g, "")) : (undefined as any)
                      }
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Rental Yield"
                    name="rentalYield"
                    tooltip="Calculated automatically from monthly rent, or enter a value directly. For example: 6.0%."
                    extra="Displayed in the public comparison table."
                  >
                    <Input placeholder="e.g. 6.0%" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Security Tier"
                    name="securityTier"
                    tooltip="Describe local security, such as 24/7 diplomatic police or CCTV."
                  >
                    <Input placeholder="e.g. 24/7 Diplomatic Police" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Metro Connectivity"
                    name="metroConnectivity"
                    tooltip="Describe access to nearby metro stations."
                  >
                    <Input placeholder="e.g. 10 mins to MRT Line 6" />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 4. Media & Settings */}
            <div className="space-y-4 pt-8">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Media & Publishing
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Upload area thumbnail and configure visibility options
                </p>
                <div className="rounded-md bg-secondary-50 p-3 text-xs leading-relaxed text-secondary-600">
                  <strong>Design Guidelines:</strong> For the <strong>Featured Area Image</strong>, please use a photo with a <strong>4:3 aspect ratio (e.g. 800x600)</strong>. This image is displayed on the area cards across the website. Using appropriately sized images ensures the grid design does not break.
                </div>
              </div>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Featured Area Image">
                    <UploadMedia
                      form={form}
                      fieldPath="imageUrl"
                      idFieldPath="image"
                      type="image"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground text-sm">Featured Area</p>
                        <p className="text-xs text-muted-foreground">Mark this area as a featured location</p>
                      </div>
                      <Form.Item name="featured" valuePropName="checked" noStyle>
                        <Switch />
                      </Form.Item>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                      <div>
                        <p className="font-semibold text-foreground text-sm">Show on Home Page</p>
                        <p className="text-xs text-muted-foreground">Display this area card on the website home page</p>
                      </div>
                      <Form.Item name="isHome" valuePropName="checked" noStyle>
                        <Switch />
                      </Form.Item>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                      <div>
                        <p className="font-semibold text-foreground text-sm">Active Status</p>
                        <p className="text-xs text-muted-foreground">Toggle visibility across the whole portal</p>
                      </div>
                      <Form.Item name="isActive" valuePropName="checked" noStyle>
                        <Switch />
                      </Form.Item>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        </Card>

        {/* Actions Bottom Bar */}
        <div className="flex items-center justify-end gap-3 sticky bottom-4 z-10 bg-white/95 backdrop-blur-md p-4 rounded-lg border border-gray-300 shadow-md">
          <Button onClick={() => navigate("/areas")} disabled={isSaving}>
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

export default AreaForm;
