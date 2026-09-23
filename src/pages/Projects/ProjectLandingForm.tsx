import { Button, Card, Col, Form, Input, Row, Select, Space, Switch, Tabs, Tooltip } from "antd";
import { ArrowLeft, ExternalLink, Languages, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import LangInput, {
  fieldTooltip,
  translateToBanglaApi,
} from "../../components/Common/LangInput";
import RichTextEditor from "../../components/Common/RichEditor/RichTextEditor";
import UploadMedia from "../../components/shared/UploadMedia";
import PhoneInputField from "../../components/shared/PhoneInputField";
import { mediaSrc } from "../../utils/mediaSrc";
import { publicLandingUrl } from "../../utils/landing";
import {
  isEmptyRichText,
  translateRichTextToBangla,
} from "../../utils/richText";

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
  { key: "custom", title: "Custom (কাস্টম কন্টেন্ট)" },
] as const;

const TABS = [
  { key: "publishing", title: "Publishing (প্রকাশ)" },
  ...SECTIONS,
] as const;

type TabKey = (typeof TABS)[number]["key"];

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

const mediaId = (m: any) => m?._id ?? m ?? undefined;
const mediaPreview = (m: any) => mediaSrc(m) || undefined;

/** Soft-normalize path: lowercase only — spaces stay so validation can warn. */
const normalizeLandingPathCase = (raw: string) =>
  String(raw || "").toLowerCase();

/** Recommended upload sizes so frontend crops look clean. */
const IMG_SIZE = {
  hero: "সাইজ: ২৪০০×১৬০০ (৩:২) বা ২৫৬০×১৪৪০ (১৬:৯)। ফুল-স্ক্রিন ব্যাকগ্রাউন্ড — সাবজেক্ট মাঝে/ডানে রাখুন।",
  about: "সাইজ: ১৮০০×১২০০ (৩:২)। মোবাইলে চেপে যাবে না (object-contain)।",
  residences: "সাইজ: ১৬০০×১২০০ (৪:৩) বা ২০০০×১২০০। ক্রপ ছাড়া পুরো দেখাবে।",
  elevation: "সাইজ: লম্বা ১২০০×১৮০০ (২:৩) বা চওড়া ২০০০×১৪০০। গ্যালারি থেকে আলাদা।",
  gallery: "সাইজ: ১৯২০×১০৮০ (১৬:৯)। মেইন ভিউয়ার ১৬:৯ ক্রপ করে।",
  avatar: "সাইজ: ৪০০×৪০০ (১:১)। গোল সার্কেলে দেখায় — মুখ মাঝে রাখুন।",
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
    tip: "টাইটেলের উপরের ছোট লেবেল (যেমন: ফ্ল্যাট / প্রকল্প)।",
    softMax: 22,
  },
  title: {
    tip: "সেকশনের মূল শিরোনাম — লাইভ পেজে বড় করে দেখায়।",
    softMax: 48,
  },
  heroTitle: {
    tip: "হিরোর সবচেয়ে বড় শিরোনাম — প্রথম স্ক্রিনের মেইন টেক্সট।",
    softMax: 42,
  },
  lead: {
    tip: "হিরো টাইটেলের নিচে এক লাইনের সাপোর্ট টেক্সট।",
    softMax: 140,
  },
  body: {
    tip: "অনুচ্ছেদ / বিস্তারিত লেখা। মোবাইলে পড়তে সুবিধা হয় এমন ছোট রাখুন।",
    softMax: 280,
  },
  description: {
    tip: "টাইটেলের নিচের সংক্ষিপ্ত বর্ণনা।",
    softMax: 160,
  },
  badge: {
    tip: "ছোট ব্যাজ/পিল টেক্সট — এক লাইনে থাকতে হবে।",
    softMax: 18,
  },
  cta: {
    tip: "বাটনের লেখা (যেমন: বুক করুন / কল)। ছোট রাখুন।",
    softMax: 22,
  },
  uiLabel: {
    tip: "ছোট UI লেবেল (Preview / Close / Play)। খুব সংক্ষিপ্ত।",
    softMax: 16,
  },
  price: {
    tip: "ঐচ্ছিক। ইউনিট নামের পাশে দামের নোট। খালি রাখলে সাইটে দাম দেখাবে না।",
    softMax: 36,
    optional: true,
  },
  metaTitle: {
    tip: "ব্রাউজার ট্যাব / গুগল সার্চের টাইটেল।",
    softMax: 60,
  },
  metaDesc: {
    tip: "সার্চ রেজাল্টে টাইটেলের নিচের বর্ণনা।",
    softMax: 155,
  },
  short: {
    tip: "এক লাইনের ছোট টেক্সট।",
    softMax: 40,
  },
  statValue: {
    tip: "স্ট্যাটের বড় সংখ্যা/মান (যেমন: ৪.২৯ বা G+৯)।",
    softMax: 10,
  },
  statLabel: {
    tip: "স্ট্যাটের নিচের ছোট লেবেল (যেমন: কাঠা, তলা)।",
    softMax: 16,
  },
  caption: {
    tip: "ছবি/ভিডিওর নিচের ক্যাপশন।",
    softMax: 48,
  },
  note: {
    tip: "ঐচ্ছিক সাপোর্ট নোট।",
    softMax: 100,
    optional: true,
  },
  unitSpec: {
    tip: "বেড/বাথ/সাইজ চিপ — ছোট রাখুন (যেমন: ৪ বেড, ১,৫৪৪ বর্গফুট)।",
    softMax: 18,
  },
  nav: {
    tip: "হেডারের “বুক” বাটনের লেখা।",
    softMax: 18,
  },
  icon: {
    tip: "FontAwesome ক্লাস দিন (যেমন: fa-solid fa-building)।",
  },
  url: {
    tip: "পুরো লিংক দিন — https:// দিয়ে শুরু।",
  },
  phone: {
    tip: "মোবাইল নম্বর — ডিফল্ট বাংলাদেশ (+880)। ফ্ল্যাগ থেকে অন্য দেশও বেছে নিতে পারবেন।",
  },
};

const imageTooltip = (hint: string) =>
  fieldTooltip(`ছবির সাইজ গাইড: ${hint}`);

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
  return stripPreview(body) as Record<string, unknown>;
};

const tabSaveLabel = (tab: TabKey) => {
  const row = TABS.find((t) => t.key === tab);
  const short = (row?.title || tab).split(" (")[0];
  return `Save ${short}`;
};

/** Collect every `…Bn` field and its English sibling under a form value tree. */
function collectBnPairs(
  value: unknown,
  path: (string | number)[] = [],
): { en: (string | number)[]; bn: (string | number)[] }[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectBnPairs(item, [...path, index]),
    );
  }
  if (!value || typeof value !== "object") return [];

  const pairs: { en: (string | number)[]; bn: (string | number)[] }[] = [];
  const record = value as Record<string, unknown>;
  for (const [key, entry] of Object.entries(record)) {
    if (key.endsWith("Bn")) {
      const enKey = key.slice(0, -2);
      if (enKey in record && typeof record[enKey] === "string") {
        pairs.push({ en: [...path, enKey], bn: [...path, key] });
      }
      continue;
    }
    pairs.push(...collectBnPairs(entry, [...path, key]));
  }
  return pairs;
}

function Pair({
  en,
  bn,
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
      <Col xs={24} md={12}>
        <LangInput
          form={form}
          lang="en"
          name={en}
          pathPrefix={pathPrefix}
          label={`${label} (EN)`}
          placeholder={`${label} in English`}
          isTextArea={!!rows}
          rows={rows}
          hint={guide?.tip}
          softMax={guide?.softMax}
          optional={guide?.optional}
        />
      </Col>
      <Col xs={24} md={12}>
        <LangInput
          form={form}
          lang="bn"
          name={bn}
          sourceFieldName={en}
          pathPrefix={pathPrefix}
          label={`${label} (BN)`}
          placeholder={`${label} বাংলায়`}
          isTextArea={!!rows}
          rows={rows}
          hint={guide?.tip}
          softMax={guide?.softMax}
          optional={guide?.optional}
        />
      </Col>
    </Row>
  );
}

function TranslateSectionButton({
  sectionKey,
}: {
  /** When set, walk that section. When omitted, only publishing meta fields. */
  sectionKey?: string;
}) {
  const form = Form.useFormInstance();
  const [busy, setBusy] = useState(false);

  const onTranslateAll = async () => {
    setBusy(true);
    let count = 0;
    try {
      const pairs = sectionKey
        ? collectBnPairs(form.getFieldValue(sectionKey), [sectionKey])
        : collectBnPairs(
            form.getFieldsValue([
              "metaTitle",
              "metaTitleBn",
              "metaDescription",
              "metaDescriptionBn",
              "navEnquire",
              "navEnquireBn",
            ]),
          );

      for (const pair of pairs) {
        const enVal = String(form.getFieldValue(pair.en) || "").trim();
        if (!enVal) continue;
        const looksHtml = /<[a-z][\s\S]*>/i.test(enVal);
        const bnText = looksHtml
          ? await translateRichTextToBangla(enVal)
          : await translateToBanglaApi(enVal);
        if (bnText) {
          form.setFieldValue(pair.bn, bnText);
          count++;
        }
      }

      if (count > 0) {
        toast.success(`${count}টি ফিল্ড বাংলায় অনুবাদ করা হয়েছে`);
      } else {
        toast.info("অনুবাদ করার মতো কোনো ইংরেজি টেক্সট পাওয়া যায়নি");
      }
    } catch {
      toast.error("অনুবাদ করতে সমস্যা হয়েছে");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Tooltip title="এই ট্যাবের সব ইংরেজি ফিল্ড বাংলায় অনুবাদ করুন">
      <Button
        icon={<Languages className="h-4 w-4" />}
        loading={busy}
        onClick={onTranslateAll}
      >
        সবগুলো বাংলা করুন
      </Button>
    </Tooltip>
  );
}

/** Dual TinyMCE editors for the bottom custom rich-text section. */
function CustomBodyEditors() {
  const form = Form.useFormInstance();
  const [busy, setBusy] = useState(false);

  const onTranslateBody = async () => {
    const enText = form.getFieldValue(["custom", "body"]);
    if (isEmptyRichText(enText)) {
      toast.info("অনুবাদের জন্য আগে ইংরেজিতে লেখাটি লিখুন");
      return;
    }
    setBusy(true);
    try {
      form.setFieldValue(
        ["custom", "bodyBn"],
        await translateRichTextToBangla(enText),
      );
      toast.success("লেখাটি বাংলায় রূপান্তর করা হয়েছে");
    } catch {
      toast.error("অনুবাদ করতে সমস্যা হয়েছে");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2 flex flex-col gap-4">
      <Form.Item
        name={["custom", "body"]}
        label="Body (English)"
        tooltip="ল্যান্ডিং পেজের নিচে দেখাবে — হেডিং, লিস্ট, লিংক, ছবি ব্যবহার করতে পারবেন। দৈর্ঘ্যের সীমা নেই, তবে খুব লম্বা হলে স্ক্রল বাড়বে।"
      >
        <RichTextEditor
          placeholder="Write free-form content in English..."
          height={420}
        />
      </Form.Item>

      <Form.Item
        name={["custom", "bodyBn"]}
        label={
          <div className="flex w-full items-center justify-between gap-2">
            <span>Body (Bangla)</span>
            <Tooltip title="ইংরেজি বডি থেকে বাংলায় রূপান্তর করুন">
              <Button
                type="link"
                size="small"
                className="!h-auto !px-1 !text-xs flex shrink-0 items-center gap-1 whitespace-nowrap"
                onClick={onTranslateBody}
                loading={busy}
                icon={
                  busy ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Languages className="h-3.5 w-3.5" />
                  )
                }
              >
                {busy ? "রূপান্তর হচ্ছে..." : "বাংলা করুন"}
              </Button>
            </Tooltip>
          </div>
        }
        tooltip="বাংলা সাইটে এই লেখাটি দেখাবে। ইংরেজি থেকে “বাংলা করুন” চাপতে পারেন।"
      >
        <RichTextEditor placeholder="বাংলায় লিখুন..." height={420} />
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
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-secondary-500">{hint}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sectionKey ? <TranslateSectionButton sectionKey={sectionKey} /> : null}
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
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            size="small"
            tabBarGutter={8}
            items={TABS.map((tab) => ({
              key: tab.key,
              label: (
                <span className="text-sm font-medium whitespace-nowrap">
                  {tab.title}
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
                  Publishing (প্রকাশ)
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
              <TranslateSectionButton />
            </div>
            <Row gutter={16}>
              <Col xs={24} md={10}>
                <Form.Item
                  name="path"
                  label="Landing path"
                  tooltip={fieldTooltip(
                    "লাইভ URL এর অংশ। স্পেস দেওয়া যাবে না — ছোট হাতের অক্ষর, সংখ্যা ও - ব্যবহার করুন (যেমন: zoomgreencity বা zoom-green-city)।",
                  )}
                  validateFirst
                  rules={[
                    { required: true, message: "Landing path আবশ্যক" },
                    {
                      validator: async (_, value) => {
                        const v = String(value || "");
                        if (!v) return;
                        if (/\s/.test(v)) {
                          throw new Error(
                            "স্পেস দেওয়া যাবে না। স্পেস সরিয়ে একসাথে লিখুন, অথবা - ব্যবহার করুন (যেমন: zoom-green-city)।",
                          );
                        }
                        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)) {
                          throw new Error(
                            "শুধু ছোট হাতের ইংরেজি অক্ষর (a–z), সংখ্যা (0–9) ও হাইফেন (-) চলবে। বাংলা বা অন্য চিহ্ন নয়।",
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
                  <Input placeholder="zoomalzahara বা zoom-green-city" />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item
                  name="isActive"
                  label="Published"
                  valuePropName="checked"
                  tooltip="চালু থাকলে পাবলিক সাইটে ল্যান্ডিং পেজ দেখা যাবে।"
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
            title="Hero (হিরো)"
            hint="The first screen: photo, title, location and the two buttons."
          >
                  <Form.Item label="Hero image" tooltip={imageTooltip(IMG_SIZE.hero)}>
                    <UploadMedia form={form} fieldPath={["hero", "imageUrl"] as any} idFieldPath={["hero", "image"]} type="image" />
                  </Form.Item>
                  <Pair en={["hero", "badge"]} bn={["hero", "badgeBn"]} label="Badge" kind="badge" />
                  <Pair en={["hero", "handover"]} bn={["hero", "handoverBn"]} label="Handover badge" kind="badge" />
                  <Pair en={["hero", "eyebrow"]} bn={["hero", "eyebrowBn"]} label="Eyebrow" kind="eyebrow" />
                  <Pair en={["hero", "title"]} bn={["hero", "titleBn"]} label="Title" kind="heroTitle" />
                  <Pair en={["hero", "lead"]} bn={["hero", "leadBn"]} label="Lead" rows={3} kind="lead" />
                  <Pair en={["hero", "location"]} bn={["hero", "locationBn"]} label="Location" kind="short" />
                  <Pair en={["hero", "ctaPrimary"]} bn={["hero", "ctaPrimaryBn"]} label="Primary CTA" kind="cta" />
                  <Pair en={["hero", "ctaSecondary"]} bn={["hero", "ctaSecondaryBn"]} label="Secondary CTA" kind="cta" />
                  <p className="mb-2 text-sm font-medium">Stats</p>
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
          </Block>
          </div>

          <div className={panelClass("about")}>
          <Block
            sectionKey="about"
            title="About (প্রকল্প)"
            hint="The project story, the side photo and the points beside it."
          >
                  <Form.Item label="Side image" tooltip={imageTooltip(IMG_SIZE.about)}>
                    <UploadMedia form={form} fieldPath={["about", "imageUrl"] as any} idFieldPath={["about", "image"]} type="image" />
                  </Form.Item>
                  <Pair en={["about", "eyebrow"]} bn={["about", "eyebrowBn"]} label="Eyebrow" kind="eyebrow" />
                  <Pair en={["about", "title"]} bn={["about", "titleBn"]} label="Title" kind="title" />
                  <Pair en={["about", "body"]} bn={["about", "bodyBn"]} label="Body" rows={4} kind="body" />
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
            title="Residences (ফ্ল্যাট)"
            hint="Flat photos, the featured unit and its highlights."
          >
                  <Form.Item label="Residence images" tooltip={imageTooltip(IMG_SIZE.residences)}>
                    <UploadMedia form={form} fieldPath={["residences", "imageUrls"] as any} idFieldPath={["residences", "images"]} mode="multiple" type="image" />
                  </Form.Item>
                  <Pair en={["residences", "eyebrow"]} bn={["residences", "eyebrowBn"]} label="Eyebrow" kind="eyebrow" />
                  <Pair en={["residences", "title"]} bn={["residences", "titleBn"]} label="Title" kind="title" />
                  <Pair en={["residences", "description"]} bn={["residences", "descriptionBn"]} label="Description" rows={3} kind="description" />
                  <Pair en={["residences", "featured"]} bn={["residences", "featuredBn"]} label="Featured badge" kind="badge" />
                  <Pair en={["residences", "cta"]} bn={["residences", "ctaBn"]} label="CTA" kind="cta" />
                  <Pair en={["residences", "preview"]} bn={["residences", "previewBn"]} label="Preview label" kind="uiLabel" />
                  <Pair en={["residences", "close"]} bn={["residences", "closeBn"]} label="Close label" kind="uiLabel" />
                  <Pair en={["residences", "unit", "name"]} bn={["residences", "unit", "nameBn"]} label="Unit name" kind="short" />
                  <Pair en={["residences", "unit", "beds"]} bn={["residences", "unit", "bedsBn"]} label="Beds" kind="unitSpec" />
                  <Pair en={["residences", "unit", "baths"]} bn={["residences", "unit", "bathsBn"]} label="Baths" kind="unitSpec" />
                  <Pair en={["residences", "unit", "size"]} bn={["residences", "unit", "sizeBn"]} label="Size" kind="unitSpec" />
                  <Pair en={["residences", "unit", "price"]} bn={["residences", "unit", "priceBn"]} label="Price note" kind="price" />
                  <Pair en={["residences", "unit", "note"]} bn={["residences", "unit", "noteBn"]} label="Note" rows={2} kind="note" />
                  <ListEditor name={["residences", "highlights"]} addLabel="Add highlight">
                    {(n, listPath) => (
                      <>
                        <Pair pathPrefix={listPath} en={[n, "label"]} bn={[n, "labelBn"]} label="Label" kind="short" />
                        <Pair pathPrefix={listPath} en={[n, "value"]} bn={[n, "valueBn"]} label="Value" kind="short" />
                        <Form.Item name={[n, "icon"]} {...plainField("Icon", "icon")}>
                          <Input />
                        </Form.Item>
                      </>
                    )}
                  </ListEditor>
          </Block>
          </div>

          <div className={panelClass("elevation")}>
          <Block
            sectionKey="elevation"
            title="Elevation (এলিভেশন)"
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
            title="Films (ফিল্ম)"
            hint="Project films from Facebook or YouTube."
          >
                  <Pair en={["films", "eyebrow"]} bn={["films", "eyebrowBn"]} label="Eyebrow" kind="eyebrow" />
                  <Pair en={["films", "title"]} bn={["films", "titleBn"]} label="Title" kind="title" />
                  <Pair en={["films", "description"]} bn={["films", "descriptionBn"]} label="Description" rows={3} kind="description" />
                  <Pair en={["films", "play"]} bn={["films", "playBn"]} label="Play label" kind="uiLabel" />
                  <ListEditor name={["films", "items"]} addLabel="Add film">
                    {(n, listPath) => (
                      <>
                        <Pair pathPrefix={listPath} en={[n, "title"]} bn={[n, "titleBn"]} label="Title" kind="title" />
                        <Pair pathPrefix={listPath} en={[n, "caption"]} bn={[n, "captionBn"]} label="Caption" kind="caption" />
                        <Form.Item name={[n, "url"]} {...plainField("Video URL", "url")}>
                          <Input placeholder="Facebook or YouTube URL" />
                        </Form.Item>
                        <Form.Item name={[n, "provider"]} {...plainField("Provider", "short")}>
                          <Select
                            allowClear
                            options={[
                              { value: "facebook", label: "Facebook" },
                              { value: "youtube", label: "YouTube" },
                            ]}
                          />
                        </Form.Item>
                      </>
                    )}
                  </ListEditor>
          </Block>
          </div>

          <div className={panelClass("amenities")}>
          <Block
            sectionKey="amenities"
            title="Amenities (সুবিধা)"
            hint="The amenity cards under the films."
          >
                  <Pair en={["amenities", "eyebrow"]} bn={["amenities", "eyebrowBn"]} label="Eyebrow" kind="eyebrow" />
                  <Pair en={["amenities", "title"]} bn={["amenities", "titleBn"]} label="Title" kind="title" />
                  <Pair en={["amenities", "description"]} bn={["amenities", "descriptionBn"]} label="Description" rows={3} kind="description" />
                  <ListEditor name={["amenities", "items"]} addLabel="Add amenity">
                    {(n, listPath) => (
                      <>
                        <Pair pathPrefix={listPath} en={[n, "title"]} bn={[n, "titleBn"]} label="Title" kind="title" />
                        <Pair pathPrefix={listPath} en={[n, "body"]} bn={[n, "bodyBn"]} label="Body" rows={2} kind="body" />
                        <Form.Item name={[n, "icon"]} {...plainField("Icon", "icon")}>
                          <Input />
                        </Form.Item>
                      </>
                    )}
                  </ListEditor>
          </Block>
          </div>

          <div className={panelClass("gallery")}>
          <Block
            sectionKey="gallery"
            title="Gallery (গ্যালারি)"
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
            title="Location (লোকেশন)"
            hint="The map and the facts beside it."
          >
                  <Pair en={["location", "eyebrow"]} bn={["location", "eyebrowBn"]} label="Eyebrow" kind="eyebrow" />
                  <Pair en={["location", "title"]} bn={["location", "titleBn"]} label="Title" kind="title" />
                  <Pair en={["location", "description"]} bn={["location", "descriptionBn"]} label="Description" rows={3} kind="description" />
                  <Form.Item name={["location", "mapEmbedUrl"]} {...plainField("Map embed URL", "url")}>
                    <Input placeholder="https://maps.google.com/maps?q=...&output=embed" />
                  </Form.Item>
                  <Form.Item name={["location", "mapLinkUrl"]} {...plainField("Open in Maps URL", "url")}>
                    <Input />
                  </Form.Item>
                  <Pair en={["location", "mapOpen"]} bn={["location", "mapOpenBn"]} label="Open label" kind="uiLabel" />
                  <Pair en={["location", "mapHint"]} bn={["location", "mapHintBn"]} label="Map hint" kind="short" />
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
            title="Process (প্রক্রিয়া)"
            hint="The booking steps."
          >
                  <Pair en={["process", "eyebrow"]} bn={["process", "eyebrowBn"]} label="Eyebrow" kind="eyebrow" />
                  <Pair en={["process", "title"]} bn={["process", "titleBn"]} label="Title" kind="title" />
                  <ListEditor name={["process", "steps"]} addLabel="Add step">
                    {(n, listPath) => (
                      <>
                        <Pair pathPrefix={listPath} en={[n, "title"]} bn={[n, "titleBn"]} label="Title" kind="title" />
                        <Pair pathPrefix={listPath} en={[n, "body"]} bn={[n, "bodyBn"]} label="Body" rows={2} kind="body" />
                      </>
                    )}
                  </ListEditor>
          </Block>
          </div>

          <div className={panelClass("cta")}>
          <Block
            sectionKey="cta"
            title="CTA band (কল ব্যান্ড)"
            hint="The band that asks the visitor to call or book."
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
            title="Reviews (রিভিউ)"
            hint="Client quotes and review videos."
          >
                  <Pair en={["reviews", "eyebrow"]} bn={["reviews", "eyebrowBn"]} label="Eyebrow" kind="eyebrow" />
                  <Pair en={["reviews", "title"]} bn={["reviews", "titleBn"]} label="Title" kind="title" />
                  <Pair en={["reviews", "description"]} bn={["reviews", "descriptionBn"]} label="Description" rows={3} kind="description" />
                  <Pair en={["reviews", "play"]} bn={["reviews", "playBn"]} label="Play label" kind="uiLabel" />
                  <Pair en={["reviews", "close"]} bn={["reviews", "closeBn"]} label="Close label" kind="uiLabel" />
                  <ListEditor name={["reviews", "items"]} addLabel="Add review">
                    {(n, listPath) => (
                      <>
                        <Pair pathPrefix={listPath} en={[n, "name"]} bn={[n, "nameBn"]} label="Name" kind="short" />
                        <Pair pathPrefix={listPath} en={[n, "role"]} bn={[n, "roleBn"]} label="Role" kind="short" />
                        <Pair pathPrefix={listPath} en={[n, "quote"]} bn={[n, "quoteBn"]} label="Quote" rows={3} kind="body" />
                        <Form.Item name={[n, "videoUrl"]} {...plainField("Video URL", "url")}>
                          <Input />
                        </Form.Item>
                        <Form.Item label="Avatar" tooltip={imageTooltip(IMG_SIZE.avatar)}>
                          <UploadMedia
                            form={form}
                            fieldPath={["reviews", "items", n, "avatarUrl"] as any}
                            idFieldPath={["reviews", "items", n, "avatar"]}
                            type="image"
                          />
                        </Form.Item>
                      </>
                    )}
                  </ListEditor>
          </Block>
          </div>

          <div className={panelClass("faq")}>
          <Block
            sectionKey="faq"
            title="FAQ"
            hint="The questions under the reviews."
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
            title="Enquire (বুকিং ফর্ম)"
            hint="The booking form and its field labels."
          >
                  <Pair en={["enquire", "eyebrow"]} bn={["enquire", "eyebrowBn"]} label="Eyebrow" kind="eyebrow" />
                  <Pair en={["enquire", "title"]} bn={["enquire", "titleBn"]} label="Title" kind="title" />
                  <Pair en={["enquire", "description"]} bn={["enquire", "descriptionBn"]} label="Description" rows={3} kind="description" />
                  <Pair en={["enquire", "phoneLabel"]} bn={["enquire", "phoneLabelBn"]} label="Phone label" kind="uiLabel" />
                  <Pair en={["enquire", "whatsappLabel"]} bn={["enquire", "whatsappLabelBn"]} label="WhatsApp label" kind="uiLabel" />
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
                  <Pair en={["enquire", "form", "submit"]} bn={["enquire", "form", "submitBn"]} label="Submit" kind="cta" />
                  <Pair en={["enquire", "form", "submitting"]} bn={["enquire", "form", "submittingBn"]} label="Submitting" kind="uiLabel" />
                  <Pair en={["enquire", "form", "privacy"]} bn={["enquire", "form", "privacyBn"]} label="Privacy note" rows={2} kind="note" />
                  <Pair en={["enquire", "form", "successTitle"]} bn={["enquire", "form", "successTitleBn"]} label="Success title" kind="title" />
                  <Pair en={["enquire", "form", "successBody"]} bn={["enquire", "form", "successBodyBn"]} label="Success body" rows={2} kind="description" />
          </Block>
          </div>

          <div className={panelClass("custom")}>
          <Block
            sectionKey="custom"
            title="Custom (কাস্টম কন্টেন্ট)"
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
            {busy ? "সেকশন সেভ হচ্ছে..." : tabSaveLabel(activeTab)}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ProjectLandingForm;
