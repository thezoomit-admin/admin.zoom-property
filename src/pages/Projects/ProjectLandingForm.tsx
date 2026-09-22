import { Button, Card, Col, Form, Input, Row, Select, Space, Switch } from "antd";
import { ArrowLeft, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import UploadMedia from "../../components/shared/UploadMedia";
import { mediaSrc } from "../../utils/mediaSrc";
import { publicLandingUrl } from "../../utils/landing";

const SECTIONS = [
  { key: "hero", title: "Hero (হিরো)" },
  { key: "about", title: "About (প্রকল্প)" },
  { key: "residences", title: "Residences (ফ্ল্যাট)" },
  { key: "elevation", title: "Elevation (এলিভেশন)" },
  { key: "films", title: "Films (ফিল্ম)" },
  { key: "amenities", title: "Amenities (সুবিধা)" },
  { key: "gallery", title: "Gallery (গ্যালারি)" },
  { key: "location", title: "Location (লোকেশন)" },
  { key: "process", title: "Process (প্রক্রিয়া)" },
  { key: "cta", title: "CTA band (কল ব্যান্ড)" },
  { key: "reviews", title: "Reviews (রিভিউ)" },
  { key: "faq", title: "FAQ" },
  { key: "enquire", title: "Enquire (বুকিং ফর্ম)" },
] as const;

const mediaId = (m: any) => m?._id ?? m ?? undefined;
const mediaPreview = (m: any) => mediaSrc(m) || undefined;

const stripPreview = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stripPreview);
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (key === "imageUrl" || key === "imageUrls" || key === "avatarUrl" || key === "posterUrl") {
      continue;
    }
    out[key] = stripPreview(entry);
  }
  return out;
};

function Pair({
  en,
  bn,
  label,
  rows,
}: {
  en: (string | number)[];
  bn: (string | number)[];
  label: string;
  rows?: number;
}) {
  const Field = rows ? Input.TextArea : Input;
  return (
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <Form.Item name={en} label={`${label} (EN)`}>
          <Field rows={rows} placeholder={`${label} in English`} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name={bn} label={`${label} (BN)`}>
          <Field rows={rows} placeholder={`${label} বাংলায়`} />
        </Form.Item>
      </Col>
    </Row>
  );
}

function ListEditor({
  name,
  addLabel,
  children,
}: {
  name: (string | number)[];
  addLabel: string;
  children: (fieldName: number) => ReactNode;
}) {
  return (
    <Form.List name={name}>
      {(fields, { add, remove }) => (
        <div className="flex flex-col gap-3">
          {fields.map((field) => (
            <div
              key={field.key}
              className="rounded-lg border border-gray-200 bg-gray-50/40 p-4"
            >
              <div className="mb-3 flex justify-end">
                <Button
                  danger
                  size="small"
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={() => remove(field.name)}
                />
              </div>
              {children(field.name)}
            </div>
          ))}
          <Button type="dashed" onClick={() => add({})} icon={<Plus className="h-4 w-4" />}>
            {addLabel}
          </Button>
        </div>
      )}
    </Form.List>
  );
}

function Block({
  title,
  hint,
  sectionKey,
  children,
}: {
  title: string;
  hint: string;
  sectionKey?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={sectionKey ? `landing-${sectionKey}` : undefined}
      className="mt-2 scroll-mt-6 border-t border-gray-200 pt-6"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading text-base font-semibold text-secondary-900">
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-secondary-500">{hint}</p>
        </div>
        {sectionKey ? (
          <Form.Item
            name={["sections", sectionKey, "visible"]}
            valuePropName="checked"
            className="mb-0"
          >
            <Switch checkedChildren="Show" unCheckedChildren="Hide" />
          </Form.Item>
        ) : null}
      </div>
      {children}
    </section>
  );
}

interface Props {
  project?: { _id: string; name?: string; nameBn?: string; slug?: string };
  initial?: any;
  saving: boolean;
  onSubmit: (values: any) => Promise<void>;
}

const ProjectLandingForm = ({ project, initial, saving, onSubmit }: Props) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    const landing = initial || {};
    const views = (landing.elevation?.views || []).map((view: any) => ({
      ...view,
      image: mediaId(view.image),
      imageUrl: mediaPreview(view.image),
    }));
    const films = (landing.films?.items || []).map((item: any) => ({
      ...item,
      poster: mediaId(item.poster),
      posterUrl: mediaPreview(item.poster),
    }));
    const shots = (landing.gallery?.shots || []).map((shot: any) => ({
      ...shot,
      image: mediaId(shot.image),
      imageUrl: mediaPreview(shot.image),
    }));
    const reviews = (landing.reviews?.items || []).map((item: any) => ({
      ...item,
      avatar: mediaId(item.avatar),
      avatarUrl: mediaPreview(item.avatar),
      poster: mediaId(item.poster),
      posterUrl: mediaPreview(item.poster),
    }));

    form.setFieldsValue({
      path: landing.path || project?.slug || "",
      isActive: landing.isActive ?? true,
      facebookUrl: landing.facebookUrl,
      phonePrimary: landing.phonePrimary,
      phoneSecondary: landing.phoneSecondary,
      whatsapp: landing.whatsapp,
      metaTitle: landing.metaTitle,
      metaTitleBn: landing.metaTitleBn,
      metaDescription: landing.metaDescription,
      metaDescriptionBn: landing.metaDescriptionBn,
      navEnquire: landing.navEnquire,
      navEnquireBn: landing.navEnquireBn,
      sections: {
        ...Object.fromEntries(SECTIONS.map((section) => [section.key, { visible: true }])),
        ...(landing.sections || {}),
      },
      hero: {
        ...landing.hero,
        image: mediaId(landing.hero?.image),
        imageUrl: mediaPreview(landing.hero?.image),
        stats: landing.hero?.stats || [],
      },
      about: {
        ...landing.about,
        image: mediaId(landing.about?.image),
        imageUrl: mediaPreview(landing.about?.image),
        points: landing.about?.points || [],
      },
      residences: {
        ...landing.residences,
        images: (landing.residences?.images || []).map(mediaId),
        imageUrls: (landing.residences?.images || []).map(mediaPreview).filter(Boolean),
        highlights: landing.residences?.highlights || [],
        unit: landing.residences?.unit || {},
      },
      elevation: { ...landing.elevation, views },
      films: { ...landing.films, items: films },
      amenities: { ...landing.amenities, items: landing.amenities?.items || [] },
      gallery: { ...landing.gallery, shots },
      location: { ...landing.location, facts: landing.location?.facts || [] },
      process: { ...landing.process, steps: landing.process?.steps || [] },
      cta: landing.cta || {},
      reviews: { ...landing.reviews, items: reviews },
      faq: { ...landing.faq, items: landing.faq?.items || [] },
      enquire: { ...landing.enquire, form: landing.enquire?.form || {} },
    });
  }, [initial, project, form]);

  const handleFinish = async (values: any) => {
    await onSubmit(stripPreview(values));
  };

  const path = Form.useWatch("path", form);
  const liveUrl = publicLandingUrl(path);

  return (
    <div>
      <PageMeta
        title="Project landing · Zoom Property Admin"
        description="Campaign landing page for this project."
        noindex
      />
      <PageHeader
        title={`Landing page — ${project?.name || "Project"}`}
        extra={
          <Space>
            {liveUrl ? (
              <Button
                icon={<ExternalLink className="h-4 w-4" />}
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View live
              </Button>
            ) : null}
            <Button icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate("/projects")}>
              Back
            </Button>
          </Space>
        }
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="mb-6"
      >
        <Card className="border border-gray-300 rounded-lg bg-white shadow-xs mb-6">
          <div className="mb-4">
            <h3 className="font-heading text-base font-semibold text-secondary-900">
              Publishing (প্রকাশ)
            </h3>
            <p className="mt-0.5 text-xs text-secondary-500">
              This path is the public landing URL. Hide a section to take it off the page.
              Empty sections stay hidden on the site.
              {liveUrl ? (
                <>
                  {" "}
                  Live:{" "}
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-800 underline"
                  >
                    {liveUrl}
                  </a>
                </>
              ) : null}
            </p>
          </div>
          <nav className="mb-5 flex flex-wrap gap-2">
            {SECTIONS.map((section) => (
              <a
                key={section.key}
                href={`#landing-${section.key}`}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-secondary-700 hover:border-primary-300 hover:text-primary-800"
                onClick={(event) => {
                  event.preventDefault();
                  document
                    .getElementById(`landing-${section.key}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {section.title}
              </a>
            ))}
          </nav>
          <Row gutter={16}>
            <Col xs={24} md={10}>
              <Form.Item
                name="path"
                label="Landing path"
                rules={[{ required: true, message: "Path is required" }]}
              >
                <Input placeholder="zoom-al-zahra" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="isActive" label="Published" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="facebookUrl" label="Facebook URL">
                <Input placeholder="https://facebook.com/..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="phonePrimary" label="Primary phone">
                <Input placeholder="01711-250406" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="phoneSecondary" label="Secondary phone">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="whatsapp" label="WhatsApp">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Pair en={["metaTitle"]} bn={["metaTitleBn"]} label="Meta title" />
          <Pair en={["metaDescription"]} bn={["metaDescriptionBn"]} label="Meta description" rows={2} />
          <Pair en={["navEnquire"]} bn={["navEnquireBn"]} label="Header Book label" />

          <Block
            sectionKey="hero"
            title="Hero (হিরো)"
            hint="The first screen: photo, title, location and the two buttons."
          >
                  <Form.Item label="Hero image">
                    <UploadMedia form={form} fieldPath={["hero", "imageUrl"] as any} idFieldPath={["hero", "image"]} type="image" />
                  </Form.Item>
                  <Pair en={["hero", "badge"]} bn={["hero", "badgeBn"]} label="Badge" />
                  <Pair en={["hero", "handover"]} bn={["hero", "handoverBn"]} label="Handover badge" />
                  <Pair en={["hero", "eyebrow"]} bn={["hero", "eyebrowBn"]} label="Eyebrow" />
                  <Pair en={["hero", "title"]} bn={["hero", "titleBn"]} label="Title" />
                  <Pair en={["hero", "lead"]} bn={["hero", "leadBn"]} label="Lead" rows={3} />
                  <Pair en={["hero", "location"]} bn={["hero", "locationBn"]} label="Location" />
                  <Pair en={["hero", "ctaPrimary"]} bn={["hero", "ctaPrimaryBn"]} label="Primary CTA" />
                  <Pair en={["hero", "ctaSecondary"]} bn={["hero", "ctaSecondaryBn"]} label="Secondary CTA" />
                  <p className="mb-2 text-sm font-medium">Stats</p>
                  <ListEditor name={["hero", "stats"]} addLabel="Add stat">
                    {(n) => (
                      <>
                        <Pair en={[n, "value"]} bn={[n, "valueBn"]} label="Value" />
                        <Pair en={[n, "label"]} bn={[n, "labelBn"]} label="Label" />
                        <Form.Item name={[n, "icon"]} label="Icon">
                          <Input placeholder='fa-solid fa-building' />
                        </Form.Item>
                      </>
                    )}
                  </ListEditor>
          </Block>

          <Block
            sectionKey="about"
            title="About (প্রকল্প)"
            hint="The project story, the side photo and the points beside it."
          >
                  <Form.Item label="Side image">
                    <UploadMedia form={form} fieldPath={["about", "imageUrl"] as any} idFieldPath={["about", "image"]} type="image" />
                  </Form.Item>
                  <Pair en={["about", "eyebrow"]} bn={["about", "eyebrowBn"]} label="Eyebrow" />
                  <Pair en={["about", "title"]} bn={["about", "titleBn"]} label="Title" />
                  <Pair en={["about", "body"]} bn={["about", "bodyBn"]} label="Body" rows={4} />
                  <ListEditor name={["about", "points"]} addLabel="Add point">
                    {(n) => (
                      <>
                        <Pair en={[n, "title"]} bn={[n, "titleBn"]} label="Title" />
                        <Pair en={[n, "body"]} bn={[n, "bodyBn"]} label="Body" rows={2} />
                        <Form.Item name={[n, "icon"]} label="Icon">
                          <Input placeholder="fa-solid fa-handshake" />
                        </Form.Item>
                      </>
                    )}
                  </ListEditor>
          </Block>

          <Block
            sectionKey="residences"
            title="Residences (ফ্ল্যাট)"
            hint="Flat photos, the featured unit and its highlights."
          >
                  <Form.Item label="Residence images">
                    <UploadMedia form={form} fieldPath={["residences", "imageUrls"] as any} idFieldPath={["residences", "images"]} mode="multiple" type="image" />
                  </Form.Item>
                  <Pair en={["residences", "eyebrow"]} bn={["residences", "eyebrowBn"]} label="Eyebrow" />
                  <Pair en={["residences", "title"]} bn={["residences", "titleBn"]} label="Title" />
                  <Pair en={["residences", "description"]} bn={["residences", "descriptionBn"]} label="Description" rows={3} />
                  <Pair en={["residences", "featured"]} bn={["residences", "featuredBn"]} label="Featured badge" />
                  <Pair en={["residences", "cta"]} bn={["residences", "ctaBn"]} label="CTA" />
                  <Pair en={["residences", "preview"]} bn={["residences", "previewBn"]} label="Preview label" />
                  <Pair en={["residences", "close"]} bn={["residences", "closeBn"]} label="Close label" />
                  <Pair en={["residences", "unit", "name"]} bn={["residences", "unit", "nameBn"]} label="Unit name" />
                  <Pair en={["residences", "unit", "beds"]} bn={["residences", "unit", "bedsBn"]} label="Beds" />
                  <Pair en={["residences", "unit", "baths"]} bn={["residences", "unit", "bathsBn"]} label="Baths" />
                  <Pair en={["residences", "unit", "size"]} bn={["residences", "unit", "sizeBn"]} label="Size" />
                  <Pair en={["residences", "unit", "price"]} bn={["residences", "unit", "priceBn"]} label="Price note" />
                  <Pair en={["residences", "unit", "note"]} bn={["residences", "unit", "noteBn"]} label="Note" rows={2} />
                  <ListEditor name={["residences", "highlights"]} addLabel="Add highlight">
                    {(n) => (
                      <>
                        <Pair en={[n, "label"]} bn={[n, "labelBn"]} label="Label" />
                        <Pair en={[n, "value"]} bn={[n, "valueBn"]} label="Value" />
                        <Form.Item name={[n, "icon"]} label="Icon">
                          <Input />
                        </Form.Item>
                      </>
                    )}
                  </ListEditor>
          </Block>

          <Block
            sectionKey="elevation"
            title="Elevation (এলিভেশন)"
            hint="Building views visitors can open full screen."
          >
                  <Pair en={["elevation", "eyebrow"]} bn={["elevation", "eyebrowBn"]} label="Eyebrow" />
                  <Pair en={["elevation", "title"]} bn={["elevation", "titleBn"]} label="Title" />
                  <Pair en={["elevation", "description"]} bn={["elevation", "descriptionBn"]} label="Description" rows={3} />
                  <Pair en={["elevation", "preview"]} bn={["elevation", "previewBn"]} label="Preview label" />
                  <Pair en={["elevation", "close"]} bn={["elevation", "closeBn"]} label="Close label" />
                  <ListEditor name={["elevation", "views"]} addLabel="Add view">
                    {(n) => (
                      <>
                        <Pair en={[n, "label"]} bn={[n, "labelBn"]} label="Label" />
                        <Pair en={[n, "hint"]} bn={[n, "hintBn"]} label="Hint" />
                        <Form.Item label="Image">
                          <UploadMedia
                            form={form}
                            fieldPath={["elevation", "views", n, "imageUrl"] as any}
                            idFieldPath={["elevation", "views", n, "image"]}
                            type="image"
                          />
                        </Form.Item>
                      </>
                    )}
                  </ListEditor>
          </Block>

          <Block
            sectionKey="films"
            title="Films (ফিল্ম)"
            hint="Project films from Facebook or YouTube."
          >
                  <Pair en={["films", "eyebrow"]} bn={["films", "eyebrowBn"]} label="Eyebrow" />
                  <Pair en={["films", "title"]} bn={["films", "titleBn"]} label="Title" />
                  <Pair en={["films", "description"]} bn={["films", "descriptionBn"]} label="Description" rows={3} />
                  <Pair en={["films", "play"]} bn={["films", "playBn"]} label="Play label" />
                  <ListEditor name={["films", "items"]} addLabel="Add film">
                    {(n) => (
                      <>
                        <Pair en={[n, "title"]} bn={[n, "titleBn"]} label="Title" />
                        <Pair en={[n, "caption"]} bn={[n, "captionBn"]} label="Caption" />
                        <Form.Item name={[n, "url"]} label="Video URL">
                          <Input placeholder="Facebook or YouTube URL" />
                        </Form.Item>
                        <Form.Item name={[n, "provider"]} label="Provider">
                          <Select
                            allowClear
                            options={[
                              { value: "facebook", label: "Facebook" },
                              { value: "youtube", label: "YouTube" },
                            ]}
                          />
                        </Form.Item>
                        <Form.Item label="Poster">
                          <UploadMedia
                            form={form}
                            fieldPath={["films", "items", n, "posterUrl"] as any}
                            idFieldPath={["films", "items", n, "poster"]}
                            type="image"
                          />
                        </Form.Item>
                      </>
                    )}
                  </ListEditor>
          </Block>

          <Block
            sectionKey="amenities"
            title="Amenities (সুবিধা)"
            hint="The amenity cards under the films."
          >
                  <Pair en={["amenities", "eyebrow"]} bn={["amenities", "eyebrowBn"]} label="Eyebrow" />
                  <Pair en={["amenities", "title"]} bn={["amenities", "titleBn"]} label="Title" />
                  <Pair en={["amenities", "description"]} bn={["amenities", "descriptionBn"]} label="Description" rows={3} />
                  <ListEditor name={["amenities", "items"]} addLabel="Add amenity">
                    {(n) => (
                      <>
                        <Pair en={[n, "title"]} bn={[n, "titleBn"]} label="Title" />
                        <Pair en={[n, "body"]} bn={[n, "bodyBn"]} label="Body" rows={2} />
                        <Form.Item name={[n, "icon"]} label="Icon">
                          <Input />
                        </Form.Item>
                      </>
                    )}
                  </ListEditor>
          </Block>

          <Block
            sectionKey="gallery"
            title="Gallery (গ্যালারি)"
            hint="Photos visitors can open larger."
          >
                  <Pair en={["gallery", "eyebrow"]} bn={["gallery", "eyebrowBn"]} label="Eyebrow" />
                  <Pair en={["gallery", "title"]} bn={["gallery", "titleBn"]} label="Title" />
                  <Pair en={["gallery", "open"]} bn={["gallery", "openBn"]} label="Open label" />
                  <Pair en={["gallery", "close"]} bn={["gallery", "closeBn"]} label="Close label" />
                  <ListEditor name={["gallery", "shots"]} addLabel="Add photo">
                    {(n) => (
                      <>
                        <Pair en={[n, "label"]} bn={[n, "labelBn"]} label="Label" />
                        <Form.Item label="Image">
                          <UploadMedia
                            form={form}
                            fieldPath={["gallery", "shots", n, "imageUrl"] as any}
                            idFieldPath={["gallery", "shots", n, "image"]}
                            type="image"
                          />
                        </Form.Item>
                      </>
                    )}
                  </ListEditor>
          </Block>

          <Block
            sectionKey="location"
            title="Location (লোকেশন)"
            hint="The map and the facts beside it."
          >
                  <Pair en={["location", "eyebrow"]} bn={["location", "eyebrowBn"]} label="Eyebrow" />
                  <Pair en={["location", "title"]} bn={["location", "titleBn"]} label="Title" />
                  <Pair en={["location", "description"]} bn={["location", "descriptionBn"]} label="Description" rows={3} />
                  <Form.Item name={["location", "mapEmbedUrl"]} label="Map embed URL">
                    <Input placeholder="https://maps.google.com/maps?q=...&output=embed" />
                  </Form.Item>
                  <Form.Item name={["location", "mapLinkUrl"]} label="Open in Maps URL">
                    <Input />
                  </Form.Item>
                  <Pair en={["location", "mapOpen"]} bn={["location", "mapOpenBn"]} label="Open label" />
                  <Pair en={["location", "mapHint"]} bn={["location", "mapHintBn"]} label="Map hint" />
                  <ListEditor name={["location", "facts"]} addLabel="Add fact">
                    {(n) => (
                      <>
                        <Pair en={[n, "label"]} bn={[n, "labelBn"]} label="Label" />
                        <Pair en={[n, "value"]} bn={[n, "valueBn"]} label="Value" />
                      </>
                    )}
                  </ListEditor>
          </Block>

          <Block
            sectionKey="process"
            title="Process (প্রক্রিয়া)"
            hint="The booking steps."
          >
                  <Pair en={["process", "eyebrow"]} bn={["process", "eyebrowBn"]} label="Eyebrow" />
                  <Pair en={["process", "title"]} bn={["process", "titleBn"]} label="Title" />
                  <ListEditor name={["process", "steps"]} addLabel="Add step">
                    {(n) => (
                      <>
                        <Pair en={[n, "title"]} bn={[n, "titleBn"]} label="Title" />
                        <Pair en={[n, "body"]} bn={[n, "bodyBn"]} label="Body" rows={2} />
                      </>
                    )}
                  </ListEditor>
          </Block>

          <Block
            sectionKey="cta"
            title="CTA band (কল ব্যান্ড)"
            hint="The band that asks the visitor to call or book."
          >
                  <Pair en={["cta", "eyebrow"]} bn={["cta", "eyebrowBn"]} label="Eyebrow" />
                  <Pair en={["cta", "title"]} bn={["cta", "titleBn"]} label="Title" />
                  <Pair en={["cta", "description"]} bn={["cta", "descriptionBn"]} label="Description" rows={3} />
                  <Pair en={["cta", "primary"]} bn={["cta", "primaryBn"]} label="Primary button" />
                  <Pair en={["cta", "call"]} bn={["cta", "callBn"]} label="Call button" />
                  <Pair en={["cta", "whatsapp"]} bn={["cta", "whatsappBn"]} label="WhatsApp button" />
          </Block>

          <Block
            sectionKey="reviews"
            title="Reviews (রিভিউ)"
            hint="Client quotes and review videos."
          >
                  <Pair en={["reviews", "eyebrow"]} bn={["reviews", "eyebrowBn"]} label="Eyebrow" />
                  <Pair en={["reviews", "title"]} bn={["reviews", "titleBn"]} label="Title" />
                  <Pair en={["reviews", "description"]} bn={["reviews", "descriptionBn"]} label="Description" rows={3} />
                  <Pair en={["reviews", "play"]} bn={["reviews", "playBn"]} label="Play label" />
                  <Pair en={["reviews", "close"]} bn={["reviews", "closeBn"]} label="Close label" />
                  <ListEditor name={["reviews", "items"]} addLabel="Add review">
                    {(n) => (
                      <>
                        <Pair en={[n, "name"]} bn={[n, "nameBn"]} label="Name" />
                        <Pair en={[n, "role"]} bn={[n, "roleBn"]} label="Role" />
                        <Pair en={[n, "quote"]} bn={[n, "quoteBn"]} label="Quote" rows={3} />
                        <Form.Item name={[n, "videoUrl"]} label="Video URL">
                          <Input />
                        </Form.Item>
                        <Form.Item label="Avatar">
                          <UploadMedia
                            form={form}
                            fieldPath={["reviews", "items", n, "avatarUrl"] as any}
                            idFieldPath={["reviews", "items", n, "avatar"]}
                            type="image"
                          />
                        </Form.Item>
                        <Form.Item label="Video poster">
                          <UploadMedia
                            form={form}
                            fieldPath={["reviews", "items", n, "posterUrl"] as any}
                            idFieldPath={["reviews", "items", n, "poster"]}
                            type="image"
                          />
                        </Form.Item>
                      </>
                    )}
                  </ListEditor>
          </Block>

          <Block
            sectionKey="faq"
            title="FAQ"
            hint="The questions under the reviews."
          >
                  <Pair en={["faq", "eyebrow"]} bn={["faq", "eyebrowBn"]} label="Eyebrow" />
                  <Pair en={["faq", "title"]} bn={["faq", "titleBn"]} label="Title" />
                  <Pair en={["faq", "description"]} bn={["faq", "descriptionBn"]} label="Description" rows={3} />
                  <ListEditor name={["faq", "items"]} addLabel="Add question">
                    {(n) => (
                      <>
                        <Pair en={[n, "question"]} bn={[n, "questionBn"]} label="Question" rows={2} />
                        <Pair en={[n, "answer"]} bn={[n, "answerBn"]} label="Answer" rows={3} />
                      </>
                    )}
                  </ListEditor>
          </Block>

          <Block
            sectionKey="enquire"
            title="Enquire (বুকিং ফর্ম)"
            hint="The booking form and its field labels."
          >
                  <Pair en={["enquire", "eyebrow"]} bn={["enquire", "eyebrowBn"]} label="Eyebrow" />
                  <Pair en={["enquire", "title"]} bn={["enquire", "titleBn"]} label="Title" />
                  <Pair en={["enquire", "description"]} bn={["enquire", "descriptionBn"]} label="Description" rows={3} />
                  <Pair en={["enquire", "phoneLabel"]} bn={["enquire", "phoneLabelBn"]} label="Phone label" />
                  <Pair en={["enquire", "whatsappLabel"]} bn={["enquire", "whatsappLabelBn"]} label="WhatsApp label" />
                  <Form.Item name={["enquire", "source"]} label="Lead source">
                    <Input placeholder="Zoom Al Zahara" />
                  </Form.Item>
                  <Pair en={["enquire", "form", "name"]} bn={["enquire", "form", "nameBn"]} label="Name field" />
                  <Pair en={["enquire", "form", "namePlaceholder"]} bn={["enquire", "form", "namePlaceholderBn"]} label="Name placeholder" />
                  <Pair en={["enquire", "form", "phone"]} bn={["enquire", "form", "phoneBn"]} label="Phone field" />
                  <Pair en={["enquire", "form", "email"]} bn={["enquire", "form", "emailBn"]} label="Email field" />
                  <Pair en={["enquire", "form", "plan"]} bn={["enquire", "form", "planBn"]} label="Plan field" />
                  <Pair en={["enquire", "form", "message"]} bn={["enquire", "form", "messageBn"]} label="Message field" />
                  <Pair en={["enquire", "form", "messagePlaceholder"]} bn={["enquire", "form", "messagePlaceholderBn"]} label="Message placeholder" />
                  <Pair en={["enquire", "form", "submit"]} bn={["enquire", "form", "submitBn"]} label="Submit" />
                  <Pair en={["enquire", "form", "submitting"]} bn={["enquire", "form", "submittingBn"]} label="Submitting" />
                  <Pair en={["enquire", "form", "privacy"]} bn={["enquire", "form", "privacyBn"]} label="Privacy note" rows={2} />
                  <Pair en={["enquire", "form", "successTitle"]} bn={["enquire", "form", "successTitleBn"]} label="Success title" />
                  <Pair en={["enquire", "form", "successBody"]} bn={["enquire", "form", "successBodyBn"]} label="Success body" rows={2} />
          </Block>
        </Card>

        <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-lg border border-gray-300 bg-white/95 p-4 shadow-md backdrop-blur-md">
          <Button onClick={() => navigate("/projects")}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={saving} size="large">
            Save landing page
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ProjectLandingForm;
