import { Button, Card, Col, Form, Input, Row, Select, Space, Switch, Tabs } from "antd";
import { ArrowLeft, ExternalLink, Play, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import LangInput, { fieldTooltip } from "../../components/Common/LangInput";
import RichTextEditor from "../../components/Common/RichEditor/RichTextEditor";
import UploadMedia from "../../components/shared/UploadMedia";
import PhoneInputField from "../../components/shared/PhoneInputField";
import { mediaSrc } from "../../utils/mediaSrc";
import { publicLandingUrl } from "../../utils/landing";

const SECTIONS = [
  { key: "hero", title: "Hero" },
  { key: "about", title: "About" },
  { key: "residences", title: "Residences" },
  { key: "elevation", title: "Elevation" },
  { key: "films", title: "Films" },
  { key: "amenities", title: "Amenities" },
  { key: "gallery", title: "Gallery" },
  { key: "location", title: "Location" },
  { key: "process", title: "Process" },
  { key: "cta", title: "CTA band" },
  { key: "reviews", title: "Reviews" },
  { key: "faq", title: "FAQ" },
  { key: "enquire", title: "Enquire" },
  { key: "custom", title: "Custom" },
] as const;

const TABS = [
  { key: "publishing", title: "Publishing" },
  ...SECTIONS,
] as const;

type TabKey = (typeof TABS)[number]["key"];
const englishOnlyText = (value: string) =>
  value
    .replace(/\s*\([^)]*[\u0980-\u09FF][^)]*\)/g, "")
    .replace(/[\u0980-\u09FF]+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

const SECTION_KEYS = new Set(SECTIONS.map((s) => s.key));

const isFieldInTab = (
  name: string | number | (string | number)[],
  tab: TabKey,
): boolean => {
  const parts = Array.isArray(name) ? name : [name];
  const root = String(parts[0] ?? "");
  if (tab === "publishing") {
    return root !== "sections" && !SECTION_KEYS.has(root as (typeof SECTIONS)[number]["key"]);
  }
  if (root === "sections") return String(parts[1] ?? "") === tab;
  return root === tab;
};

const mediaId = (m: any): string | undefined => {
  const raw = m?._id ?? m?.id ?? m;
  if (raw == null || raw === "") return undefined;
  if (typeof raw === "string") {
    const s = raw.trim();
    return /^[a-f0-9]{24}$/i.test(s) ? s : undefined;
  }
  if (typeof raw?.toHexString === "function") {
    try {
      return raw.toHexString();
    } catch {
      /* fall through */
    }
  }
  if (typeof raw?.toString === "function") {
    const s = String(raw.toString());
    if (/^[a-f0-9]{24}$/i.test(s)) return s;
  }
  // Recover mangled ObjectId `{ buffer: {0:n,…} }` from a bad API round-trip.
  const buf = raw?.buffer;
  if (buf && typeof buf === "object") {
    try {
      const keys = Object.keys(buf).sort((a, b) => Number(a) - Number(b));
      if (keys.length === 12) {
        const hex = keys
          .map((k) => Number(buf[k]).toString(16).padStart(2, "0"))
          .join("");
        if (/^[a-f0-9]{24}$/i.test(hex)) return hex;
      }
    } catch {
      /* ignore */
    }
  }
  return undefined;
};
const mediaPreview = (m: any) => mediaSrc(m) || undefined;

/** Soft-normalize path: lowercase only — spaces stay so validation can warn. */
const normalizeLandingPathCase = (raw: string) =>
  String(raw || "").toLowerCase();

/** Recommended upload sizes so frontend crops look clean. */
const IMG_SIZE = {
  hero: "Recommended: 2400×1600 (3:2) or 2560×1440 (16:9). Full-screen background; keep the subject centered or to the right.",
  about: "Recommended: 1800×1200 (3:2). The image uses object-contain on mobile.",
  residences: "Recommended: 1600×1200 (4:3) or 2000×1200. The full image remains visible without cropping.",
  elevation: "Recommended: portrait 1200×1800 (2:3) or landscape 2000×1400. Use an image distinct from the gallery.",
  films: "Recommended: 1920×1080 (16:9). Optional cover/poster image; YouTube thumbnail is used when omitted.",
  gallery: "Recommended: 1920×1080 (16:9). The main viewer crops to 16:9.",
  avatar: "Recommended: 400×400 (1:1). Displayed in a circular crop; keep the face centered.",
} as const;

/** Soft length guides so live landing typography stays tidy. */
type FieldKind =
  | "eyebrow"
  | "title"
  | "heroTitle"
  | "lead"
  | "body"
  | "description"
  | "badge"
  | "cta"
  | "uiLabel"
  | "price"
  | "metaTitle"
  | "metaDesc"
  | "short"
  | "statValue"
  | "statLabel"
  | "caption"
  | "note"
  | "unitSpec"
  | "nav"
  | "icon"
  | "url"
  | "phone";

const FIELD_GUIDE: Record<
  FieldKind,
  { tip: string; softMax?: number; optional?: boolean }
> = {
  eyebrow: {
    tip: "Short label above the title, such as Apartment or Project.",
    softMax: 22,
  },
  title: {
    tip: "Main section heading, displayed prominently on the public page.",
    softMax: 48,
  },
  heroTitle: {
    tip: "The largest hero heading and primary text in the first viewport.",
    softMax: 42,
  },
  lead: {
    tip: "One-line supporting text below the hero title.",
    softMax: 140,
  },
  body: {
    tip: "Paragraph or detailed copy. Keep it concise for mobile readability.",
    softMax: 280,
  },
  description: {
    tip: "Short description displayed below the title.",
    softMax: 160,
  },
  badge: {
    tip: "Short badge or pill text; keep it to one line.",
    softMax: 18,
  },
  cta: {
    tip: "Button label, such as Book or Call. Keep it short.",
    softMax: 22,
  },
  uiLabel: {
    tip: "Short UI label, such as Preview, Close, or Play.",
    softMax: 16,
  },
  price: {
    tip: "Optional price note displayed beside the unit name. Leave empty to hide it.",
    softMax: 36,
    optional: true,
  },
  metaTitle: {
    tip: "Title shown in the browser tab and Google search results.",
    softMax: 60,
  },
  metaDesc: {
    tip: "Description displayed below the title in search results.",
    softMax: 155,
  },
  short: {
    tip: "Short, one-line text.",
    softMax: 40,
  },
  statValue: {
    tip: "Large statistic value, such as 4.29 or G+9.",
    softMax: 10,
  },
  statLabel: {
    tip: "Short label below the statistic, such as Katha or Floors.",
    softMax: 16,
  },
  caption: {
    tip: "Caption displayed below an image or video.",
    softMax: 48,
  },
  note: {
    tip: "Optional supporting note.",
    softMax: 100,
    optional: true,
  },
  unitSpec: {
    tip: "Short bed, bath, or size chip, such as 4 beds or 1,544 sq ft.",
    softMax: 18,
  },
  nav: {
    tip: "Label for the header's booking button.",
    softMax: 18,
  },
  icon: {
    tip: "Enter a FontAwesome class, such as fa-solid fa-building.",
  },
  url: {
    tip: "Enter the full URL beginning with https://.",
  },
  phone: {
    tip: "Enter a phone number. The default country code is Bangladesh (+880); use the flag to select another country.",
  },
};

const imageTooltip = (hint: string) =>
  fieldTooltip(englishOnlyText(`Image size guide: ${hint}`));

/** Plain Form.Item label + Ant Design tooltip (same as text fields). */
const plainField = (label: string, kind: FieldKind) => {
  const g = FIELD_GUIDE[kind];
  return {
    label: g.optional ? (
      <span>
        {label}{" "}
        <span className="text-[11px] font-normal text-secondary-400">
          (optional)
        </span>
      </span>
    ) : (
      label
    ),
    tooltip: fieldTooltip(g.tip, g.softMax),
  };
};

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

const PUBLISHING_FIELDS = [
  "path",
  "isActive",
  "facebookUrl",
  "phonePrimary",
  "phoneSecondary",
  "whatsapp",
  "metaTitle",
  "metaTitleBn",
  "metaDescription",
  "metaDescriptionBn",
  "navEnquire",
  "navEnquireBn",
] as const;

/** Slice form values down to the active tab payload for PATCH. */
const buildSectionPayload = (
  tab: TabKey,
  all: Record<string, unknown>,
): Record<string, unknown> => {
  if (tab === "publishing") {
    const out: Record<string, unknown> = {};
    for (const key of PUBLISHING_FIELDS) {
      if (key in all) out[key] = all[key];
    }
    return stripPreview(out) as Record<string, unknown>;
  }

  const section = all[tab];
  const sections = all.sections as Record<string, { visible?: boolean }> | undefined;
  const visible = sections?.[tab]?.visible;
  const body =
    section && typeof section === "object"
      ? { ...(section as Record<string, unknown>) }
      : {};
  if (typeof visible === "boolean") body.visible = visible;

  // Keep legacy hero.image in sync with the first slideshow frame.
  if (tab === "hero" && Array.isArray(body.images) && body.images.length) {
    body.image = body.images[0];
  }

  return stripPreview(body) as Record<string, unknown>;
};

const tabSaveLabel = (tab: TabKey) => {
  const row = TABS.find((t) => t.key === tab);
  const short = (row?.title || tab).split(" (")[0];
  return `Save ${short}`;
};

function Pair({
  en,
  label,
  rows,
  pathPrefix,
  kind,
}: {
  en: (string | number)[];
  bn: (string | number)[];
  label: string;
  rows?: number;
  pathPrefix?: (string | number)[];
  kind?: FieldKind;
}) {
  const form = Form.useFormInstance();
  const guide = kind ? FIELD_GUIDE[kind] : undefined;
  return (
    <Row gutter={16}>
      <Col xs={24}>
        <LangInput
          form={form}
          lang="en"
          name={en}
          pathPrefix={pathPrefix}
          label={label}
          placeholder={`${label} in English`}
          isTextArea={!!rows}
          rows={rows}
          hint={englishOnlyText(guide?.tip || "")}
          softMax={guide?.softMax}
          optional={guide?.optional}
        />
      </Col>
    </Row>
  );
}

/** English rich-text editor for the bottom custom section. */
function CustomBodyEditors() {
  return (
    <div className="mt-2 flex flex-col gap-4">
      <Form.Item
        name={["custom", "body"]}
        label="Body"
        tooltip="This content appears at the bottom of the landing page. Use headings, lists, links, and images as needed."
      >
        <RichTextEditor
          placeholder="Write free-form content in English..."
          height={420}
        />
      </Form.Item>
    </div>
  );
}

function ListEditor({
  name,
  addLabel,
  children,
}: {
  name: (string | number)[];
  addLabel: string;
  children: (
    fieldName: number,
    pathPrefix: (string | number)[],
  ) => ReactNode;
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
              {children(field.name, name)}
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

const extractYoutubeId = (url?: string) => {
  if (!url) return null;
  const match = String(url).match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|v=)([A-Za-z0-9_-]{6,})/,
  );
  return match?.[1] || null;
};

const FilmItemRow = ({
  n,
  listPath,
  form,
}: {
  n: number;
  listPath: (string | number)[];
  form: any;
}) => {
  const url = Form.useWatch([...listPath, n, "url"], form);
  const ytId = extractYoutubeId(url);
  const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : "";

  return (
    <div className="space-y-3">
      <Pair
        pathPrefix={listPath}
        en={[n, "title"]}
        bn={[n, "titleBn"]}
        label="Film Title"
        kind="title"
      />
      <Pair
        pathPrefix={listPath}
        en={[n, "caption"]}
        bn={[n, "captionBn"]}
        label="Caption / Subtitle"
        kind="caption"
      />
      <Row gutter={16}>
        <Col xs={24} md={16}>
          <Form.Item name={[n, "url"]} {...plainField("Video URL (YouTube or Facebook)", "url")}>
            <Input
              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              onChange={(e) => {
                const val = e.target.value;
                if (/facebook\.com|fb\.watch|fb\.com/i.test(val)) {
                  form.setFieldValue([...listPath, n, "provider"], "facebook");
                } else if (/youtu\.be|youtube\.com/i.test(val)) {
                  form.setFieldValue([...listPath, n, "provider"], "youtube");
                }
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name={[n, "provider"]} {...plainField("Platform", "short")}>
            <Select
              allowClear
              placeholder="Auto / Select"
              options={[
                { value: "youtube", label: "YouTube Video / Reel" },
                { value: "facebook", label: "Facebook Video / Reel" },
              ]}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Live YouTube Preview Card */}
      {ytId ? (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50/70 p-2.5">
          <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md bg-black shadow-xs">
            <img
              src={ytThumb}
              alt="YouTube Preview"
              className="size-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="flex size-6 items-center justify-center rounded-full bg-red-600 text-white shadow">
                <Play className="size-3 fill-white translate-x-0.2" />
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white tracking-wider">
                YouTube Video Connected
              </span>
              <span className="text-xs font-mono text-secondary-600 font-medium">
                ID: {ytId}
              </span>
            </div>
            <p className="mt-1 text-xs text-secondary-600">
              The thumbnail and video are loaded and played directly from YouTube.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

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
    <section>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading text-base font-semibold text-secondary-900">
            {englishOnlyText(title)}
          </h3>
          <p className="mt-0.5 text-xs text-secondary-500">{englishOnlyText(hint)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
      </div>
      {children}
    </section>
  );
}

interface Props {
  project?: { _id: string; name?: string; nameBn?: string; slug?: string };
  initial?: any;
  saving: boolean;
  onSubmitSection: (section: string, values: Record<string, unknown>) => Promise<void>;
}

const ProjectLandingForm = ({ project, initial, saving, onSubmitSection }: Props) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("publishing");
  const [submitting, setSubmitting] = useState(false);
  const hydratedFor = useRef<string | null>(null);
  const panelClass = (key: TabKey) =>
    activeTab === key ? "block" : "hidden";
  const busy = saving || submitting;

  useEffect(() => {
    const projectId = project?._id ? String(project._id) : "";
    // Hydrate once per project so a save/refetch does not wipe in-progress
    // uploads (and break newly added image previews).
    if (!projectId || hydratedFor.current === projectId) return;
    hydratedFor.current = projectId;

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
    }));

    const residencePairs = (landing.residences?.images || [])
      .map((img: any) => ({ id: mediaId(img), url: mediaPreview(img) }))
      .filter((p: { id: any; url: string | undefined }) => Boolean(p.id));

    const heroImageList = (landing.hero?.images?.length
      ? landing.hero.images
      : landing.hero?.image
        ? [landing.hero.image]
        : []) as any[];
    const heroPairs = heroImageList
      .map((img: any) => ({ id: mediaId(img), url: mediaPreview(img) }))
      .filter((p: { id: any; url: string | undefined }) => Boolean(p.id));

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
        image: heroPairs[0]?.id,
        imageUrl: heroPairs[0]?.url || "",
        images: heroPairs.map((p: { id: any }) => p.id),
        imageUrls: heroPairs.map((p: { url?: string }) => p.url || ""),
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
        images: residencePairs.map((p: { id: any }) => p.id),
        imageUrls: residencePairs.map((p: { url?: string }) => p.url || ""),
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
      custom: landing.custom || {},
    });
  }, [initial, project, form]);

  const handleSave = (e?: MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (submitting || saving) return;

    // Force the spinner to paint on this click before any form work.
    flushSync(() => {
      setSubmitting(true);
    });

    void (async () => {
      try {
        // Yield one frame so the loading spinner can paint.
        await new Promise<void>((r) => requestAnimationFrame(() => r()));

        const allFields = form.getFieldsError();

        const foreign = allFields.filter((f) => !isFieldInTab(f.name, activeTab));
        if (foreign.length) {
          form.setFields(foreign.map((f) => ({ name: f.name, errors: [] })));
        }

        const toValidate = allFields
          .map((f) => f.name)
          .filter((name) => isFieldInTab(name, activeTab));

        if (activeTab === "publishing") {
          const hasPath = toValidate.some(
            (n) => (Array.isArray(n) ? n[0] : n) === "path",
          );
          if (!hasPath) toValidate.push(["path"]);
        }

        if (toValidate.length) {
          await form.validateFields(toValidate);
        }

        const values = form.getFieldsValue(true) as Record<string, unknown>;
        const payload = buildSectionPayload(activeTab, values);
        await onSubmitSection(activeTab, payload);
        const short = tabSaveLabel(activeTab).replace(/^Save\s+/, "");
        toast.success(`${short} saved`, { position: "top-center" });
      } catch (err: any) {
        const errorFields = err?.errorFields as
          | { name: (string | number)[]; errors: string[] }[]
          | undefined;
        const msg =
          errorFields?.find((f) => isFieldInTab(f.name, activeTab))?.errors?.[0] ||
          errorFields?.[0]?.errors?.[0] ||
          err?.data?.message ||
          err?.message ||
          "Could not save this section";
        toast.error(msg, { position: "top-center" });
      } finally {
        setSubmitting(false);
      }
    })();
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
        preserve
        className="mb-6"
      >
        <div className="sticky top-0 z-20 mb-4 rounded-lg border border-gray-300 bg-white/95 px-3 pt-2 shadow-sm backdrop-blur-md">
          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key as TabKey);
              window.scrollTo({ top: 0, behavior: "auto" });
            }}
            size="small"
            tabBarGutter={8}
            items={TABS.map((tab) => ({
              key: tab.key,
              label: (
                <span className="text-sm font-medium whitespace-nowrap">
                  {englishOnlyText(tab.title)}
                </span>
              ),
            }))}
          />
        </div>

        <Card className="border border-gray-300 rounded-lg bg-white shadow-xs mb-6">
          <div className={panelClass("publishing")}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-heading text-base font-semibold text-secondary-900">
                  Publishing
                </h3>
                <p className="mt-0.5 text-xs text-secondary-500">
                  This path is the public landing URL. Hide a section on its tab to take it off the page.
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
            </div>
            <Row gutter={16}>
              <Col xs={24} md={10}>
                <Form.Item
                  name="path"
                  label="Landing path"
                  tooltip={fieldTooltip(
                    "This is part of the live URL. Use lowercase letters, numbers, and hyphens only (for example: zoom-green-city).",
                  )}
                  validateFirst
                  rules={[
                    { required: true, message: "Landing path is required" },
                    {
                      validator: async (_, value) => {
                        const v = String(value || "");
                        if (!v) return;
                        if (/\s/.test(v)) {
                          throw new Error(
                            "Spaces are not allowed. Remove spaces or replace them with hyphens (for example: zoom-green-city).",
                          );
                        }
                        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)) {
                          throw new Error(
                            "Use lowercase letters (a–z), numbers (0–9), and hyphens (-) only.",
                          );
                        }
                      },
                    },
                  ]}
                  normalize={normalizeLandingPathCase}
                  getValueFromEvent={(e) =>
                    normalizeLandingPathCase(
                      typeof e === "string" ? e : e?.target?.value,
                    )
                  }
                >
                  <Input placeholder="zoom-alzahara or zoom-green-city" />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item
                  name="isActive"
                  label="Published"
                  valuePropName="checked"
                  tooltip="When enabled, the landing page is visible on the public website."
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="facebookUrl" {...plainField("Facebook URL", "url")}>
                  <Input placeholder="https://facebook.com/..." />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="phonePrimary" {...plainField("Primary phone", "phone")}>
                  <PhoneInputField placeholder="01711-250406" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="phoneSecondary" {...plainField("Secondary phone", "phone")}>
                  <PhoneInputField />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="whatsapp" {...plainField("WhatsApp", "phone")}>
                  <PhoneInputField />
                </Form.Item>
              </Col>
            </Row>
            <Pair en={["metaTitle"]} bn={["metaTitleBn"]} label="Meta title" kind="metaTitle" />
            <Pair en={["metaDescription"]} bn={["metaDescriptionBn"]} label="Meta description" rows={2} kind="metaDesc" />
            <Pair en={["navEnquire"]} bn={["navEnquireBn"]} label="Header Book label" kind="nav" />
          </div>

          <div className={panelClass("hero")}>
          <Block
            sectionKey="hero"
            title="Hero"
            hint="First screen. Set badges, title, lead story, buttons, stats, and background slider images."
          >
                  <Pair en={["hero", "title"]} bn={["hero", "titleBn"]} label="Title" kind="heroTitle" />
                  <Pair en={["hero", "lead"]} bn={["hero", "leadBn"]} label="Lead" rows={3} kind="lead" />
                  <Pair en={["hero", "location"]} bn={["hero", "locationBn"]} label="Location" kind="short" />
                  <Pair en={["hero", "ctaPrimary"]} bn={["hero", "ctaPrimaryBn"]} label="Primary CTA" kind="cta" />
                  <p className="mb-2 text-sm font-medium">Stats & Metrics</p>
                  <ListEditor name={["hero", "stats"]} addLabel="Add stat">
                    {(n, listPath) => (
                      <>
                        <Pair pathPrefix={listPath} en={[n, "value"]} bn={[n, "valueBn"]} label="Value" kind="statValue" />
                        <Pair pathPrefix={listPath} en={[n, "label"]} bn={[n, "labelBn"]} label="Label" kind="statLabel" />
                        <Form.Item name={[n, "icon"]} {...plainField("Icon", "icon")}>
                          <Input placeholder='fa-solid fa-building' />
                        </Form.Item>
                      </>
                    )}
                  </ListEditor>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Form.Item
                      label="Hero background images (slider)"
                      tooltip={imageTooltip(IMG_SIZE.hero)}
                    >
                      <UploadMedia
                        form={form}
                        fieldPath={["hero", "imageUrls"] as any}
                        idFieldPath={["hero", "images"]}
                        mode="multiple"
                        type="image"
                      />
                    </Form.Item>
                  </div>
          </Block>
          </div>

          <div className={panelClass("about")}>
          <Block
            sectionKey="about"
            title="About"
            hint="The project story, the side photo and the points beside it."
          >
                  <Pair en={["about", "eyebrow"]} bn={["about", "eyebrowBn"]} label="Eyebrow" kind="eyebrow" />
                  <Pair en={["about", "title"]} bn={["about", "titleBn"]} label="Title" kind="title" />
                  <Pair en={["about", "body"]} bn={["about", "bodyBn"]} label="Body" rows={4} kind="body" />
                  <div className="my-3">
                    <Form.Item label="Side / Feature image" tooltip={imageTooltip(IMG_SIZE.about)}>
                      <UploadMedia form={form} fieldPath={["about", "imageUrl"] as any} idFieldPath={["about", "image"]} type="image" />
                    </Form.Item>
                  </div>
                  <ListEditor name={["about", "points"]} addLabel="Add point">
                    {(n, listPath) => (
                      <>
                        <Pair pathPrefix={listPath} en={[n, "title"]} bn={[n, "titleBn"]} label="Title" kind="title" />
                        <Pair pathPrefix={listPath} en={[n, "body"]} bn={[n, "bodyBn"]} label="Body" rows={2} kind="body" />
                        <Form.Item name={[n, "icon"]} {...plainField("Icon", "icon")}>
                          <Input placeholder="fa-solid fa-handshake" />
                        </Form.Item>
                      </>
                    )}
                  </ListEditor>
          </Block>
          </div>

          <div className={panelClass("residences")}>
          <Block
            sectionKey="residences"
            title="Residences"
            hint="Flat section title, featured unit info, specifications, highlights, and interior gallery photos."
          >
                  <Pair en={["residences", "eyebrow"]} bn={["residences", "eyebrowBn"]} label="Eyebrow" kind="eyebrow" />
                  <Pair en={["residences", "title"]} bn={["residences", "titleBn"]} label="Title" kind="title" />
                  <Pair en={["residences", "description"]} bn={["residences", "descriptionBn"]} label="Description" rows={3} kind="description" />
                  
                  <div className="my-4 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                    <h4 className="font-heading text-sm font-semibold text-secondary-800 mb-3">Featured Unit Specifications</h4>
                    <Pair en={["residences", "unit", "name"]} bn={["residences", "unit", "nameBn"]} label="Unit name" kind="short" />
                    <Pair en={["residences", "featured"]} bn={["residences", "featuredBn"]} label="Featured badge" kind="badge" />
                    <Pair en={["residences", "unit", "note"]} bn={["residences", "unit", "noteBn"]} label="Layout / features note" rows={2} kind="note" />
                    <Pair en={["residences", "unit", "price"]} bn={["residences", "unit", "priceBn"]} label="Price note" kind="price" />
                    <Pair en={["residences", "cta"]} bn={["residences", "ctaBn"]} label="CTA button" kind="cta" />
                    <Pair en={["residences", "unit", "beds"]} bn={["residences", "unit", "bedsBn"]} label="Beds" kind="unitSpec" />
                    <Pair en={["residences", "unit", "baths"]} bn={["residences", "unit", "bathsBn"]} label="Baths" kind="unitSpec" />
                    <Pair en={["residences", "unit", "size"]} bn={["residences", "unit", "sizeBn"]} label="Size" kind="unitSpec" />
                  </div>

                  <p className="mb-2 text-sm font-medium">Unit Highlights & Amenities</p>
                  <ListEditor name={["residences", "highlights"]} addLabel="Add highlight">
                    {(n, listPath) => (
                      <>
                        <Pair pathPrefix={listPath} en={[n, "label"]} bn={[n, "labelBn"]} label="Label" kind="short" />
                        <Pair pathPrefix={listPath} en={[n, "value"]} bn={[n, "valueBn"]} label="Value" kind="short" />
                        <Form.Item name={[n, "icon"]} {...plainField("Icon", "icon")}>
                          <Input placeholder="fa-solid fa-gem" />
                        </Form.Item>
                      </>
                    )}
                  </ListEditor>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Form.Item label="Residence / Interior images" tooltip={imageTooltip(IMG_SIZE.residences)}>
                      <UploadMedia form={form} fieldPath={["residences", "imageUrls"] as any} idFieldPath={["residences", "images"]} mode="multiple" type="image" />
                    </Form.Item>
                  </div>

                  <Pair en={["residences", "preview"]} bn={["residences", "previewBn"]} label="Preview label" kind="uiLabel" />
                  <Pair en={["residences", "close"]} bn={["residences", "closeBn"]} label="Close label" kind="uiLabel" />
          </Block>
          </div>

          <div className={panelClass("elevation")}>
          <Block
            sectionKey="elevation"
            title="Elevation"
            hint="Building views visitors can open full screen."
          >
                  <Pair en={["elevation", "eyebrow"]} bn={["elevation", "eyebrowBn"]} label="Eyebrow" kind="eyebrow" />
                  <Pair en={["elevation", "title"]} bn={["elevation", "titleBn"]} label="Title" kind="title" />
                  <Pair en={["elevation", "description"]} bn={["elevation", "descriptionBn"]} label="Description" rows={3} kind="description" />
                  <Pair en={["elevation", "preview"]} bn={["elevation", "previewBn"]} label="Preview label" kind="uiLabel" />
                  <Pair en={["elevation", "close"]} bn={["elevation", "closeBn"]} label="Close label" kind="uiLabel" />
                  <ListEditor name={["elevation", "views"]} addLabel="Add view">
                    {(n, listPath) => (
                      <>
                        <Pair pathPrefix={listPath} en={[n, "label"]} bn={[n, "labelBn"]} label="Label" kind="caption" />
                        <Pair pathPrefix={listPath} en={[n, "hint"]} bn={[n, "hintBn"]} label="Hint" kind="caption" />
                        <Form.Item label="Image" tooltip={imageTooltip(IMG_SIZE.elevation)}>
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
          </div>

          <div className={panelClass("films")}>
          <Block
            sectionKey="films"
            title="Films"
            hint="Project films from Facebook or YouTube."
          >
                  <Pair en={["films", "eyebrow"]} bn={["films", "eyebrowBn"]} label="Eyebrow" kind="eyebrow" />
                  <Pair en={["films", "title"]} bn={["films", "titleBn"]} label="Title" kind="title" />
                  <Pair en={["films", "description"]} bn={["films", "descriptionBn"]} label="Description" rows={3} kind="description" />
                  <Pair en={["films", "play"]} bn={["films", "playBn"]} label="Play label" kind="uiLabel" />
                  <ListEditor name={["films", "items"]} addLabel="Add film">
                    {(n, listPath) => (
                      <FilmItemRow n={n} listPath={listPath} form={form} />
                    )}
                  </ListEditor>
          </Block>
          </div>

          <div className={panelClass("amenities")}>
          <Block
            sectionKey="amenities"
            title="Amenities"
            hint="Add a map link to display a location pin. Clicking the pin opens directions from the project."
          >
                  <Pair en={["amenities", "eyebrow"]} bn={["amenities", "eyebrowBn"]} label="Eyebrow" kind="eyebrow" />
                  <Pair en={["amenities", "title"]} bn={["amenities", "titleBn"]} label="Title" kind="title" />
                  <Pair en={["amenities", "description"]} bn={["amenities", "descriptionBn"]} label="Description" rows={3} kind="description" />
                  <ListEditor name={["amenities", "items"]} addLabel="Add amenity">
                    {(n, listPath) => (
                      <>
                        <Pair pathPrefix={listPath} en={[n, "title"]} bn={[n, "titleBn"]} label="Title (place name)" kind="title" />
                        <Pair pathPrefix={listPath} en={[n, "body"]} bn={[n, "bodyBn"]} label="Body" rows={2} kind="body" />
                        <Form.Item name={[n, "icon"]} {...plainField("Icon", "icon")}>
                          <Input />
                        </Form.Item>
                        <Form.Item
                          name={[n, "mapUrl"]}
                          {...plainField("Maps link (optional)", "url")}
                        >
                          <Input placeholder="Optional — paste Google Maps link" />
                        </Form.Item>
                        <Pair
                          pathPrefix={listPath}
                          en={[n, "distance"]}
                          bn={[n, "distanceBn"]}
                          label="Distance (optional)"
                          kind="short"
                        />
                      </>
                    )}
                  </ListEditor>
          </Block>
          </div>

          <div className={panelClass("gallery")}>
          <Block
            sectionKey="gallery"
            title="Gallery"
            hint="Photos visitors can open larger."
          >
                  <Pair en={["gallery", "eyebrow"]} bn={["gallery", "eyebrowBn"]} label="Eyebrow" kind="eyebrow" />
                  <Pair en={["gallery", "title"]} bn={["gallery", "titleBn"]} label="Title" kind="title" />
                  <Pair en={["gallery", "open"]} bn={["gallery", "openBn"]} label="Open label" kind="uiLabel" />
                  <Pair en={["gallery", "close"]} bn={["gallery", "closeBn"]} label="Close label" kind="uiLabel" />
                  <ListEditor name={["gallery", "shots"]} addLabel="Add photo">
                    {(n, listPath) => (
                      <>
                        <Pair pathPrefix={listPath} en={[n, "label"]} bn={[n, "labelBn"]} label="Label" kind="caption" />
                        <Form.Item label="Image" tooltip={imageTooltip(IMG_SIZE.gallery)}>
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
          </div>

          <div className={panelClass("location")}>
          <Block
            sectionKey="location"
            title="Location"
            hint="The map and the facts beside it."
          >
                  <Pair en={["location", "eyebrow"]} bn={["location", "eyebrowBn"]} label="Eyebrow" kind="eyebrow" />
                  <Pair en={["location", "title"]} bn={["location", "titleBn"]} label="Title" kind="title" />
                  <Pair en={["location", "description"]} bn={["location", "descriptionBn"]} label="Description" rows={3} kind="description" />
                  <Pair en={["location", "mapHint"]} bn={["location", "mapHintBn"]} label="Map hint / Directions" kind="short" />
                  <Form.Item name={["location", "mapEmbedUrl"]} {...plainField("Map embed URL (iframe src)", "url")}>
                    <Input placeholder="https://maps.google.com/maps?q=...&output=embed" />
                  </Form.Item>
                  <Form.Item name={["location", "mapLinkUrl"]} {...plainField("Open in Maps direct URL", "url")}>
                    <Input placeholder="https://maps.app.goo.gl/..." />
                  </Form.Item>
                  <Pair en={["location", "mapOpen"]} bn={["location", "mapOpenBn"]} label="Open label" kind="uiLabel" />
                  <p className="mb-2 text-sm font-medium">Proximity Facts & Travel Times</p>
                  <ListEditor name={["location", "facts"]} addLabel="Add fact">
                    {(n, listPath) => (
                      <>
                        <Pair pathPrefix={listPath} en={[n, "label"]} bn={[n, "labelBn"]} label="Label" kind="short" />
                        <Pair pathPrefix={listPath} en={[n, "value"]} bn={[n, "valueBn"]} label="Value" kind="short" />
                      </>
                    )}
                  </ListEditor>
          </Block>
          </div>

          <div className={panelClass("process")}>
          <Block
            sectionKey="process"
            title="Process"
            hint="The booking and acquisition steps."
          >
                  <Pair en={["process", "eyebrow"]} bn={["process", "eyebrowBn"]} label="Eyebrow" kind="eyebrow" />
                  <Pair en={["process", "title"]} bn={["process", "titleBn"]} label="Title" kind="title" />
                  <ListEditor name={["process", "steps"]} addLabel="Add step">
                    {(n, listPath) => (
                      <>
                        <Pair pathPrefix={listPath} en={[n, "title"]} bn={[n, "titleBn"]} label="Step Title" kind="title" />
                        <Pair pathPrefix={listPath} en={[n, "body"]} bn={[n, "bodyBn"]} label="Step Description" rows={2} kind="body" />
                      </>
                    )}
                  </ListEditor>
          </Block>
          </div>

          <div className={panelClass("cta")}>
          <Block
            sectionKey="cta"
            title="CTA band"
            hint="The bottom call to action band with quick inquiry & call buttons."
          >
                  <Pair en={["cta", "eyebrow"]} bn={["cta", "eyebrowBn"]} label="Eyebrow" kind="eyebrow" />
                  <Pair en={["cta", "title"]} bn={["cta", "titleBn"]} label="Title" kind="title" />
                  <Pair en={["cta", "description"]} bn={["cta", "descriptionBn"]} label="Description" rows={3} kind="description" />
                  <Pair en={["cta", "primary"]} bn={["cta", "primaryBn"]} label="Primary button" kind="cta" />
                  <Pair en={["cta", "call"]} bn={["cta", "callBn"]} label="Call button" kind="cta" />
                  <Pair en={["cta", "whatsapp"]} bn={["cta", "whatsappBn"]} label="WhatsApp button" kind="cta" />
          </Block>
          </div>

          <div className={panelClass("reviews")}>
          <Block
            sectionKey="reviews"
            title="Reviews"
            hint="Client quotes and review videos."
          >
                  <Pair en={["reviews", "eyebrow"]} bn={["reviews", "eyebrowBn"]} label="Eyebrow" kind="eyebrow" />
                  <Pair en={["reviews", "title"]} bn={["reviews", "titleBn"]} label="Title" kind="title" />
                  <Pair en={["reviews", "description"]} bn={["reviews", "descriptionBn"]} label="Description" rows={3} kind="description" />
                  <ListEditor name={["reviews", "items"]} addLabel="Add review">
                    {(n, listPath) => (
                      <>
                        <Form.Item label="Client Photo / Avatar" tooltip={imageTooltip(IMG_SIZE.avatar)}>
                          <UploadMedia
                            form={form}
                            fieldPath={["reviews", "items", n, "avatarUrl"] as any}
                            idFieldPath={["reviews", "items", n, "avatar"]}
                            type="image"
                          />
                        </Form.Item>
                        <Pair pathPrefix={listPath} en={[n, "name"]} bn={[n, "nameBn"]} label="Name" kind="short" />
                        <Pair pathPrefix={listPath} en={[n, "role"]} bn={[n, "roleBn"]} label="Role / Designation" kind="short" />
                        <Pair pathPrefix={listPath} en={[n, "quote"]} bn={[n, "quoteBn"]} label="Quote" rows={3} kind="body" />
                        <Form.Item name={[n, "videoUrl"]} {...plainField("Video Review URL (optional)", "url")}>
                          <Input placeholder="https://www.youtube.com/watch?v=..." />
                        </Form.Item>
                      </>
                    )}
                  </ListEditor>
                  <Pair en={["reviews", "play"]} bn={["reviews", "playBn"]} label="Play label" kind="uiLabel" />
                  <Pair en={["reviews", "close"]} bn={["reviews", "closeBn"]} label="Close label" kind="uiLabel" />
          </Block>
          </div>

          <div className={panelClass("faq")}>
          <Block
            sectionKey="faq"
            title="FAQ"
            hint="Frequently asked questions and answers."
          >
                  <Pair en={["faq", "eyebrow"]} bn={["faq", "eyebrowBn"]} label="Eyebrow" kind="eyebrow" />
                  <Pair en={["faq", "title"]} bn={["faq", "titleBn"]} label="Title" kind="title" />
                  <Pair en={["faq", "description"]} bn={["faq", "descriptionBn"]} label="Description" rows={3} kind="description" />
                  <ListEditor name={["faq", "items"]} addLabel="Add question">
                    {(n, listPath) => (
                      <>
                        <Pair pathPrefix={listPath} en={[n, "question"]} bn={[n, "questionBn"]} label="Question" rows={2} kind="description" />
                        <Pair pathPrefix={listPath} en={[n, "answer"]} bn={[n, "answerBn"]} label="Answer" rows={3} kind="body" />
                      </>
                    )}
                  </ListEditor>
          </Block>
          </div>

          <div className={panelClass("enquire")}>
          <Block
            sectionKey="enquire"
            title="Enquire"
            hint="The booking form pitch, direct action buttons, and form labels."
          >
                  <Pair en={["enquire", "eyebrow"]} bn={["enquire", "eyebrowBn"]} label="Eyebrow" kind="eyebrow" />
                  <Pair en={["enquire", "title"]} bn={["enquire", "titleBn"]} label="Title" kind="title" />
                  <Pair en={["enquire", "description"]} bn={["enquire", "descriptionBn"]} label="Description" rows={3} kind="description" />
                  <Pair en={["enquire", "phoneLabel"]} bn={["enquire", "phoneLabelBn"]} label="Phone label" kind="uiLabel" />
                  <Pair en={["enquire", "whatsappLabel"]} bn={["enquire", "whatsappLabelBn"]} label="WhatsApp label" kind="uiLabel" />
                  <div className="my-4 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                    <h4 className="font-heading text-sm font-semibold text-secondary-800 mb-3">Lead Form Fields & Copy</h4>
                    <Form.Item name={["enquire", "source"]} {...plainField("Lead source", "short")}>
                      <Input placeholder="Zoom Al Zahara" />
                    </Form.Item>
                    <Pair en={["enquire", "form", "name"]} bn={["enquire", "form", "nameBn"]} label="Name field" kind="uiLabel" />
                    <Pair en={["enquire", "form", "namePlaceholder"]} bn={["enquire", "form", "namePlaceholderBn"]} label="Name placeholder" kind="short" />
                    <Pair en={["enquire", "form", "phone"]} bn={["enquire", "form", "phoneBn"]} label="Phone field" kind="uiLabel" />
                    <Pair en={["enquire", "form", "email"]} bn={["enquire", "form", "emailBn"]} label="Email field" kind="uiLabel" />
                    <Pair en={["enquire", "form", "plan"]} bn={["enquire", "form", "planBn"]} label="Plan field" kind="uiLabel" />
                    <Pair en={["enquire", "form", "message"]} bn={["enquire", "form", "messageBn"]} label="Message field" kind="uiLabel" />
                    <Pair en={["enquire", "form", "messagePlaceholder"]} bn={["enquire", "form", "messagePlaceholderBn"]} label="Message placeholder" kind="short" />
                    <Pair en={["enquire", "form", "submit"]} bn={["enquire", "form", "submitBn"]} label="Submit button" kind="cta" />
                    <Pair en={["enquire", "form", "submitting"]} bn={["enquire", "form", "submittingBn"]} label="Submitting text" kind="uiLabel" />
                    <Pair en={["enquire", "form", "privacy"]} bn={["enquire", "form", "privacyBn"]} label="Privacy note" rows={2} kind="note" />
                    <Pair en={["enquire", "form", "successTitle"]} bn={["enquire", "form", "successTitleBn"]} label="Success title" kind="title" />
                    <Pair en={["enquire", "form", "successBody"]} bn={["enquire", "form", "successBodyBn"]} label="Success body" rows={2} kind="description" />
                  </div>
          </Block>
          </div>

          <div className={panelClass("custom")}>
          <Block
            sectionKey="custom"
            title="Custom"
            hint="Bottom page section with a rich text editor — headings, lists, links, images. Place any free-form content here."
          >
                  <Pair en={["custom", "eyebrow"]} bn={["custom", "eyebrowBn"]} label="Eyebrow" kind="eyebrow" />
                  <Pair en={["custom", "title"]} bn={["custom", "titleBn"]} label="Title" kind="title" />
                  <CustomBodyEditors />
          </Block>
          </div>
        </Card>

        <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-lg border border-gray-300 bg-white/95 p-4 shadow-md backdrop-blur-md">
          <Button
            htmlType="button"
            onClick={() => navigate("/projects")}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            htmlType="button"
            type="primary"
            loading={busy}
            disabled={busy}
            size="large"
            onClick={handleSave}
            className="min-w-[12rem] !flex items-center justify-center"
          >
            {busy ? "Saving..." : tabSaveLabel(activeTab)}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ProjectLandingForm;
