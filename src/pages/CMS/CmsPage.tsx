import { Button, Empty, Form, Input, Popconfirm, Space, Spin, Tabs, Tag, Tooltip } from "antd";
import { FileText, Info, Languages, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import { translateToBanglaApi, translateToEnglishApi } from "../../components/Common/LangInput";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import PermissionGate from "../../components/Common/PermissionGate";
import RichTextEditor from "../../components/Common/RichEditor/RichTextEditor";
import UploadImage from "../../components/shared/UploadImage";
import {
  useGetCmsContentQuery,
  useResetCmsContentMutation,
  useSaveCmsContentMutation,
  type CmsContentDoc,
  type CmsUpsertItem,
} from "../../redux/features/cms/cmsApi";
import {
  cmsPageById,
  cmsStorageKey,
  type CmsField,
  type CmsSection,
} from "./cmsSchema";

/**
 * The copy on one public page, section by section.
 *
 * One component for all twelve pages rather than twelve near-identical ones:
 * the pages differ only in which fields they carry, and that is data
 * (`cmsSchema.ts`), not code. Adding a section to the site means regenerating
 * the schema — no new screen to write, and no screen left behind when a
 * dictionary key is renamed.
 *
 * Each field is stored twice, once per language, under `<dictionary path>.en`
 * and `.bn`. An empty box is not an empty string on the site: nothing is
 * stored, and the site keeps its built-in text — which is why the built-in
 * text is the placeholder rather than the initial value.
 */
const CmsPage = () => {
  const { pageId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = cmsPageById(pageId);
  const activeTab = searchParams.get("tab") || page?.sections?.[0]?.id;

  const { data: stored = {}, isLoading } = useGetCmsContentQuery(pageId, {
    skip: !page,
  });

  if (!page) {
    return (
      <div className="py-20">
        <Empty description={`No CMS page called "${pageId}"`} />
      </div>
    );
  }

  return (
    <div>
      <PageMeta title={`${page.label} content · Zoom Property Admin`} noindex />
      <PageHeader
        title={`${page.label} content`}
        subtitle={page.description}
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "CMS" },
          { title: page.label },
        ]}
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spin />
        </div>
      ) : (
        <div className="rounded-xl border border-secondary-100 bg-white p-4 shadow-xs">
          <Tabs
            tabPosition="top"
            className="cms-tabs"
            activeKey={activeTab}
            onChange={(key) => setSearchParams({ tab: key })}
            items={page.sections.map((section) => ({
              key: section.id,
              label: <span className="text-sm font-medium">{section.label}</span>,
              children: (
                <SectionForm
                  key={`${pageId}-${section.id}`}
                  pageId={pageId}
                  section={section}
                  stored={stored}
                />
              ),
            }))}
          />
        </div>
      )}
    </div>
  );
};

/** The value stored for one field in one language, or "" when untouched. */
const storedValue = (
  stored: Record<string, CmsContentDoc>,
  key: string,
  lang: "en" | "bn"
) => {
  const doc = stored[cmsStorageKey(key, lang)];
  const value = doc?.value ?? (doc as any)?.imageUrl;
  return typeof value === "string" ? value : (Array.isArray(value) ? value : "");
};

const SectionForm = ({
  pageId,
  section,
  stored,
}: {
  pageId: string;
  section: CmsSection;
  stored: Record<string, CmsContentDoc>;
}) => {
  const [form] = Form.useForm();
  const [translatingDirection, setTranslatingDirection] = useState<"bn" | "en" | null>(null);
  const [save, { isLoading: saving }] = useSaveCmsContentMutation();
  const [reset, { isLoading: resetting }] = useResetCmsContentMutation();

  const repeatable = section.repeatable;
  const [repeatableIndices, setRepeatableIndices] = useState<number[]>(() => {
    if (!repeatable) return [];
    const prefix = `${repeatable.itemPrefix}.`;
    const foundIndices = new Set<number>();
    for (const key of Object.keys(stored)) {
      if (key.startsWith(prefix)) {
        const rest = key.slice(prefix.length);
        const match = rest.match(/^(\d+)\./);
        if (match) {
          foundIndices.add(parseInt(match[1], 10));
        }
      }
    }
    if (foundIndices.size > 0) {
      return Array.from(foundIndices).sort((a, b) => a - b);
    }
    const initialCount = repeatable.initialCount ?? repeatable.defaultItems?.length ?? 1;
    return Array.from({ length: initialCount }, (_, i) => i);
  });

  useEffect(() => {
    if (!repeatable) {
      setRepeatableIndices([]);
      return;
    }
    const prefix = `${repeatable.itemPrefix}.`;
    const foundIndices = new Set<number>();
    for (const key of Object.keys(stored)) {
      if (key.startsWith(prefix)) {
        const rest = key.slice(prefix.length);
        const match = rest.match(/^(\d+)\./);
        if (match) {
          foundIndices.add(parseInt(match[1], 10));
        }
      }
    }
    if (foundIndices.size > 0) {
      setRepeatableIndices(Array.from(foundIndices).sort((a, b) => a - b));
    }
  }, [repeatable, stored]);

  const allEffectiveFields = useMemo(() => {
    if (!repeatable) return section.fields;
    const dynamicFields: CmsField[] = [];
    for (const idx of repeatableIndices) {
      const defaultItem = repeatable.defaultItems?.[idx];
      for (const itemField of repeatable.itemFields) {
        const key = `${repeatable.itemPrefix}.${idx}.${itemField.suffix}`;
        // A field's default comes from its own key and nowhere else.
        //
        // This used to fall back to `bodyEn`/`bodyBn` for any suffix that was
        // not "title", which meant the icon field inherited the body text —
        // and once "load defaults" wrote that into the box, saving stored a
        // paragraph of Bangla as an icon name.
        const defEn =
          defaultItem?.[`${itemField.suffix}En`] || itemField.defaultEn || "";
        // An icon name is the same in both languages, so a field with no
        // Bangla default falls back to its English one rather than to some
        // other field's text.
        const defBn =
          defaultItem?.[`${itemField.suffix}Bn`] ||
          itemField.defaultBn ||
          defEn ||
          "";
        dynamicFields.push({
          key,
          label: itemField.label,
          type: itemField.type,
          en: defEn,
          bn: defBn,
        });
      }
    }
    return [...section.fields, ...dynamicFields];
  }, [section.fields, repeatable, repeatableIndices]);

  const initial = useMemo(() => {
    const values: Record<string, string | string[]> = {};
    for (const field of allEffectiveFields) {
      values[`${field.key}|en`] = storedValue(stored, field.key, "en");
      values[`${field.key}|bn`] = storedValue(stored, field.key, "bn");
    }
    return values;
  }, [allEffectiveFields, stored]);

  useEffect(() => {
    form.setFieldsValue(initial);
  }, [initial, form]);

  const overridden = allEffectiveFields.filter(
    (f) =>
      storedValue(stored, f.key, "en") || storedValue(stored, f.key, "bn")
  ).length;

  const handleAddProcess = () => {
    if (!repeatable) return;
    if (
      typeof repeatable.maxItems === "number" &&
      repeatableIndices.length >= repeatable.maxItems
    ) {
      toast.error(`সর্বোচ্চ ${repeatable.maxItems} টি ${repeatable.itemName || "item"} যোগ করা যাবে`);
      return;
    }
    const nextIdx = repeatableIndices.length > 0 ? Math.max(...repeatableIndices) + 1 : 0;
    
    const defaultItem = repeatable.defaultItems?.[nextIdx];
    if (defaultItem) {
      const newValues: Record<string, string> = {};
      for (const itemField of repeatable.itemFields) {
        const key = `${repeatable.itemPrefix}.${nextIdx}.${itemField.suffix}`;
        const defEn =
          defaultItem?.[`${itemField.suffix}En`] ||
          (itemField.suffix === "title" ? defaultItem?.titleEn : defaultItem?.bodyEn) ||
          itemField.defaultEn ||
          "";
        const defBn =
          defaultItem?.[`${itemField.suffix}Bn`] ||
          (itemField.suffix === "title" ? defaultItem?.titleBn : defaultItem?.bodyBn) ||
          itemField.defaultBn ||
          "";
        
        if (defEn) newValues[`${key}|en`] = defEn;
        if (defBn) newValues[`${key}|bn`] = defBn;
      }
      form.setFieldsValue(newValues);
    }

    setRepeatableIndices((prev) => [...prev, nextIdx]);
    toast.success(`${repeatable.itemName || "Process"} #${nextIdx + 1} যোগ করা হয়েছে`);
  };

  const handleRemoveProcess = (idxToRemove: number) => {
    if (!repeatable) return;
    for (const itemField of repeatable.itemFields) {
      const key = `${repeatable.itemPrefix}.${idxToRemove}.${itemField.suffix}`;
      form.setFieldValue(`${key}|en`, "");
      form.setFieldValue(`${key}|bn`, "");
    }
    setRepeatableIndices((prev) => prev.filter((i) => i !== idxToRemove));
    toast.info(`ধাপ #${idxToRemove + 1} সরানো হয়েছে। পরিবর্তন সংরক্ষণ করতে Save section-এ ক্লিক করুন।`);
  };

  const onFillDefaults = () => {
    let count = 0;
    for (const field of allEffectiveFields) {
      if (field.type === "image" || field.type === "url" || field.type === "images" || field.type === "icon") {
        if (field.en) {
          const val = field.type === "images" ? (field.en === "[]" ? [] : field.en) : field.en;
          form.setFieldValue([`${field.key}|en`], val);
          count++;
        }
      } else {
        if (field.en) {
          form.setFieldValue(`${field.key}|en`, field.en);
          count++;
        }
        if (field.bn) {
          form.setFieldValue(`${field.key}|bn`, field.bn);
          count++;
        }
      }
    }
    toast.success(`ফর্মে ${count}টি ফিল্ডে ডিফল্ট ডেটা লোড হয়েছে। Save section-এ ক্লিক করে সেভ করুন।`);
  };

  const onTranslateAllEnToBn = async () => {
    setTranslatingDirection("bn");
    let count = 0;
    try {
      for (const field of allEffectiveFields) {
        if (field.type === "image" || field.type === "url" || field.type === "images" || field.type === "icon") continue;
        const enVal = (form.getFieldValue(`${field.key}|en`) || field.en || "").trim();
        if (enVal) {
          const bnText = await translateToBanglaApi(enVal);
          if (bnText) {
            form.setFieldValue(`${field.key}|bn`, bnText);
            count++;
          }
        }
      }
      if (count > 0) {
        toast.success(`সেকশনের ${count}টি ফিল্ড বাংলায় অনুবাদ করা হয়েছে`);
      } else {
        toast.info("অনুবাদ করার মতো কোনো ইংরেজি টেক্সট পাওয়া যায়নি");
      }
    } catch {
      toast.error("অনুবাদ করতে সমস্যা হয়েছে");
    } finally {
      setTranslatingDirection(null);
    }
  };

  const onTranslateAllBnToEn = async () => {
    setTranslatingDirection("en");
    let count = 0;
    try {
      for (const field of allEffectiveFields) {
        if (field.type === "image" || field.type === "url" || field.type === "images" || field.type === "icon") continue;
        const bnVal = (form.getFieldValue(`${field.key}|bn`) || field.bn || "").trim();
        if (bnVal) {
          const enText = await translateToEnglishApi(bnVal);
          if (enText) {
            form.setFieldValue(`${field.key}|en`, enText);
            count++;
          }
        }
      }
      if (count > 0) {
        toast.success(`সেকশনের ${count}টি ফিল্ড ইংরেজিতে অনুবাদ করা হয়েছে`);
      } else {
        toast.info("অনুবাদ করার মতো কোনো বাংলা টেক্সট পাওয়া যায়নি");
      }
    } catch {
      toast.error("অনুবাদ করতে সমস্যা হয়েছে");
    } finally {
      setTranslatingDirection(null);
    }
  };

  const onFinish = async (values: Record<string, string | string[]>) => {
    const contents: CmsUpsertItem[] = [];
    const clear: string[] = [];

    for (const field of allEffectiveFields) {
      if (field.type === "image" || field.type === "url" || field.type === "images" || field.type === "icon") {
        const allValues = form.getFieldsValue(true);
        const rawVal =
          form.getFieldValue([`${field.key}|en`]) ??
          allValues[`${field.key}|en`] ??
          values[`${field.key}|en`];
          
        const next = field.type === "images" 
          ? (Array.isArray(rawVal) ? rawVal : (typeof rawVal === "string" && rawVal.trim() ? [rawVal] : []))
          : (typeof rawVal === "string" ? rawVal : "").trim();
          
        for (const lang of ["en", "bn"] as const) {
          const key = cmsStorageKey(field.key, lang);
          const before = storedValue(stored, field.key, lang);
          
          const hasChanged = field.type === "images"
            ? JSON.stringify(next) !== JSON.stringify(Array.isArray(before) ? before : (before ? [before] : []))
            : next !== before;
            
          if (hasChanged) {
            if (field.type === "images" ? next.length > 0 : next) {
              contents.push({ key, value: next, group: pageId, type: "text" });
            } else {
              clear.push(key);
            }
          }
        }
        continue;
      }

      for (const lang of ["en", "bn"] as const) {
        const key = cmsStorageKey(field.key, lang);
        const raw = values[`${field.key}|${lang}`] ?? "";
        // This branch only runs for the text kinds; a gallery is handled above.
        const next = (typeof raw === "string" ? raw : "").trim();
        const before = storedValue(stored, field.key, lang);
        if (next) {
          if (next !== before) {
            contents.push({ key, value: next, group: pageId, type: "text" });
          }
        } else if (before) {
          clear.push(key);
        }
      }
    }

    // Also clear any stored keys for removed repeatable stages
    if (repeatable) {
      const prefix = `${repeatable.itemPrefix}.`;
      for (const storedKey of Object.keys(stored)) {
        if (storedKey.startsWith(prefix)) {
          const rest = storedKey.slice(prefix.length);
          const match = rest.match(/^(\d+)\./);
          if (match) {
            const idx = parseInt(match[1], 10);
            if (!repeatableIndices.includes(idx)) {
              clear.push(storedKey);
            }
          }
        }
      }
    }

    if (!contents.length && !clear.length) {
      toast.info("Nothing changed");
      return;
    }

    try {
      if (contents.length) await save(contents).unwrap();
      if (clear.length) await reset(clear).unwrap();
      toast.success(`${section.label} saved`);
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not save the content");
    }
  };

  const onResetSection = async () => {
    const keys = allEffectiveFields.flatMap((f) =>
      (["en", "bn"] as const)
        .filter((lang) => storedValue(stored, f.key, lang))
        .map((lang) => cmsStorageKey(f.key, lang))
    );
    if (!keys.length) {
      toast.info("This section is already using the site's built-in text");
      return;
    }
    try {
      await reset(keys).unwrap();
      form.resetFields();
      toast.success(`${section.label} reset to the built-in text`);
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not reset the section");
    }
  };

  const fieldGroups = useMemo(() => {
    const groups: { header?: string; fields: CmsField[]; n?: number }[] = [];
    let currentGroup: { header?: string; fields: CmsField[] } | null = null;

    for (const field of section.fields) {
      if (field.groupHeader) {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = { header: field.groupHeader, fields: [field] };
      } else if (currentGroup) {
        currentGroup.fields.push(field);
      } else {
        currentGroup = { fields: [field] };
      }
    }
    if (currentGroup) groups.push(currentGroup);

    // Number the titled cards 1, 2, 3 in their own sequence. Using the array
    // index numbered a section that opens with a few loose fields from 2, and
    // a card badge that does not match the card above it is worse than none.
    let n = 0;
    for (const group of groups) if (group.header) group.n = ++n;

    return groups;
  }, [section.fields]);

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Space size={8}>
          <p className="text-sm font-medium text-secondary-800">
            {section.label}
          </p>
          <Tag color={overridden ? "blue" : "default"}>
            {overridden
              ? `${overridden} of ${allEffectiveFields.length} edited`
              : "Using built-in text"}
          </Tag>
        </Space>
        <Space>
          <Tooltip title="ফর্মটিতে সাইটের ডিফল্ট টেক্সট ও ধাপগুলো লোড করুন">
            <Button
              icon={<FileText className="h-4 w-4 text-primary-600" />}
              onClick={onFillDefaults}
              className="text-primary-700 border-primary-200 hover:bg-primary-50"
            >
              ডিফল্ট ডেটা লোড করুন
            </Button>
          </Tooltip>
          <Tooltip title="Translate all English fields in this section to Bangla (EN → BN)">
            <Button
              icon={<Languages className="h-4 w-4 text-emerald-600" />}
              loading={translatingDirection === "bn"}
              onClick={onTranslateAllEnToBn}
              className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
            >
              সবগুলো বাংলা করুন
            </Button>
          </Tooltip>
          <Tooltip title="Translate all Bangla fields in this section to English (BN → EN)">
            <Button
              icon={<Languages className="h-4 w-4 text-blue-600" />}
              loading={translatingDirection === "en"}
              onClick={onTranslateAllBnToEn}
              className="text-blue-700 border-blue-300 hover:bg-blue-50"
            >
              সবগুলো English করুন
            </Button>
          </Tooltip>
          <PermissionGate module="Dynamic Content" action="Delete">
            <Tooltip title="Clear this section's edits and go back to the text built into the site">
              <Button
                icon={<RotateCcw className="h-4 w-4" />}
                loading={resetting}
                onClick={onResetSection}
              >
                Reset
              </Button>
            </Tooltip>
          </PermissionGate>
          <PermissionGate module="Dynamic Content" action="Update">
            <Button
              type="primary"
              htmlType="submit"
              icon={<Save className="h-4 w-4" />}
              loading={saving}
            >
              Save section
            </Button>
          </PermissionGate>
        </Space>
      </div>

      <div className="space-y-4">
        {fieldGroups.map((group, gIdx) => (
          <div
            key={gIdx}
            className={
              group.header
                ? "rounded-xl border border-secondary-200 bg-secondary-50/30 p-4 shadow-sm"
                : "space-y-1"
            }
          >
            {group.header && (
              <div className="mb-3 flex items-center gap-2 border-b border-secondary-200/80 pb-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary-100 text-[11px] font-bold text-primary-700 border border-primary-200">
                  {group.n}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-secondary-800">
                  {group.header}
                </span>
              </div>
            )}
            <div className="space-y-1">
              {group.fields.map((field) => (
                <FieldRow key={field.key} field={field} form={form} />
              ))}
            </div>
          </div>
        ))}

        {/* Dynamic Repeatable Process Stages */}
        {repeatable && (
          <div className="mt-6 space-y-4 pt-4 border-t border-secondary-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-secondary-900">
                  {repeatable.itemName} List ({repeatableIndices.length}
                  {typeof repeatable.maxItems === "number"
                    ? ` / ${repeatable.maxItems}`
                    : ""}{" "}
                  টি)
                </h4>
                <p className="text-xs text-secondary-500">
                  {typeof repeatable.maxItems === "number"
                    ? `সর্বোচ্চ ${repeatable.maxItems} টি পর্যন্ত — পরিবর্তন করুন বা মুছে ফেলুন`
                    : "যেকোনো আইটেম পরিবর্তন করুন, নতুন যোগ করুন বা মুছে ফেলুন"}
                </p>
              </div>
              <Button
                type="dashed"
                onClick={handleAddProcess}
                disabled={
                  typeof repeatable.maxItems === "number" &&
                  repeatableIndices.length >= repeatable.maxItems
                }
                icon={<Plus className="h-4 w-4 text-primary-600" />}
                className="border-primary-300 text-primary-700 bg-primary-50/50 hover:bg-primary-50 hover:border-primary-500 font-medium disabled:opacity-50"
              >
                {repeatable.addButtonText || "+ Add Process"}
              </Button>
            </div>

            <div className="space-y-3.5">
              {repeatableIndices.map((idx, listPosition) => {
                const defaultItem = repeatable.defaultItems?.[idx];
                const stageNum = listPosition + 1;
                return (
                  <div
                    key={`repeatable-${idx}`}
                    className="rounded-xl border border-secondary-200/90 bg-secondary-50/40 p-4 shadow-xs transition-all hover:border-secondary-300"
                  >
                    <div className="mb-3 flex items-center justify-between border-b border-secondary-200/70 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary-600 text-[11px] font-bold text-white shadow-xs">
                          {stageNum}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-secondary-800">
                          {/* Named by whichever item field carries the row's
                              name — "title" for a process, "label" for a
                              social link — so the heading reads as the list
                              it belongs to rather than always as a stage. */}
                          {repeatable.itemName} {String(stageNum).padStart(2, "0")} — {form.getFieldValue(`${repeatable.itemPrefix}.${idx}.${repeatable.titleSuffix || "title"}|en`) || defaultItem?.[`${repeatable.titleSuffix || "title"}En`] || `${repeatable.itemName} ${stageNum}`}
                        </span>
                      </div>
                      <Popconfirm
                        title="ধাপটি মুছে ফেলতে চান?"
                        description="এই ধাপটি এবং এর টেক্সট মুছে ফেলা হবে।"
                        onConfirm={() => handleRemoveProcess(idx)}
                        okText="হ্যাঁ, মুছুন"
                        cancelText="বাতিল"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<Trash2 className="h-3.5 w-3.5" />}
                          className="!flex items-center gap-1 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          মুছে ফেলুন
                        </Button>
                      </Popconfirm>
                    </div>

                    <div className="space-y-1">
                      {repeatable.itemFields.map((itemField) => {
                        const key = `${repeatable.itemPrefix}.${idx}.${itemField.suffix}`;
                        const defEn =
                          defaultItem?.[`${itemField.suffix}En`] ||
                          (itemField.suffix === "title" ? defaultItem?.titleEn : defaultItem?.bodyEn) ||
                          itemField.defaultEn ||
                          "";
                        const defBn =
                          defaultItem?.[`${itemField.suffix}Bn`] ||
                          (itemField.suffix === "title" ? defaultItem?.titleBn : defaultItem?.bodyBn) ||
                          itemField.defaultBn ||
                          "";
                        const field: CmsField = {
                          key,
                          label: itemField.label,
                          type: itemField.type,
                          en: defEn,
                          bn: defBn,
                        };
                        return <FieldRow key={key} field={field} form={form} />;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              type="dashed"
              block
              onClick={handleAddProcess}
              disabled={
                typeof repeatable.maxItems === "number" &&
                repeatableIndices.length >= repeatable.maxItems
              }
              icon={<Plus className="h-4 w-4 text-primary-600" />}
              className="py-5 border-dashed border-primary-300 text-primary-700 bg-primary-50/30 hover:bg-primary-50 hover:border-primary-500 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {typeof repeatable.maxItems === "number" &&
              repeatableIndices.length >= repeatable.maxItems
                ? `সর্বোচ্চ ${repeatable.maxItems} টি ${repeatable.itemName}`
                : repeatable.addButtonText || "+ Add Process (নতুন ধাপ যোগ করুন)"}
            </Button>
          </div>
        )}
      </div>
    </Form>
  );
};

/**
 * One string, in both languages.
 *
 * Side by side with 1-click English to Bangla auto-translation button.
 */
const FieldRow = ({
  field,
  form,
}: {
  field: CmsField;
  form: any;
}) => {
  const [translating, setTranslating] = useState(false);

  if (field.type === "image" || field.type === "images") {
    const hintText =
      field.hint || "Recommended: 1920 × 1080 px (16:9 Landscape) · High quality JPG / WebP (Max 2MB)";

    return (
      <div className="border-b border-secondary-50 py-3.5 last:border-0">
        <div className="mb-2 flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-secondary-800">
              {field.label}
            </span>
            <Tooltip title={hintText}>
              <Info className="h-3.5 w-3.5 cursor-pointer text-primary-600 hover:text-primary-700" />
            </Tooltip>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-primary-50 border border-primary-200/60 px-2 py-0.5 text-[11px] font-medium text-primary-800">
              📏 {hintText}
            </span>
          </div>
        </div>
        <Form.Item name={[`${field.key}|en`]} noStyle>
          <Input type="hidden" />
        </Form.Item>
        <UploadImage
          form={form}
          fieldPath={[`${field.key}|en`]}
          mode={field.type === "images" ? "multiple" : "single"}
        />
      </div>
    );
  }

  if (field.type === "url" || field.type === "icon") {
    const isIcon = field.type === "icon";
    const tooltipContent = isIcon ? (
      <div className="flex flex-col gap-1 text-xs">
        <span>You can use exact names (e.g. <code>check</code>) or FontAwesome classes / tags.</span>
        <span>Example: <code>fa-solid fa-house</code> or <code>&lt;i class="fa-solid fa-house"&gt;&lt;/i&gt;</code></span>
        <a href="https://fontawesome.com/search?o=r&m=free" target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-100 underline mt-1">
          Search FontAwesome Icons ↗
        </a>
      </div>
    ) : field.key;

    return (
      <div className="border-b border-secondary-50 py-3 last:border-0">
        <Form.Item
          label={
            <span className="text-xs font-medium text-secondary-700">
              {field.label}
            </span>
          }
          name={`${field.key}|en`}
          className="!mb-0"
          tooltip={tooltipContent}
        >
          <Input placeholder={isIcon ? 'e.g. "fa-solid fa-house" or "<i class=\'fa-solid fa-house\'></i>"' : field.en || "—"} />
        </Form.Item>
      </div>
    );
  }

  const Control = field.type === "textarea" ? Input.TextArea : Input;

  const handleTranslate = async () => {
    const enVal = (form.getFieldValue(`${field.key}|en`) || field.en || "").trim();
    if (!enVal) {
      toast.warning("অনুবাদ করার জন্য প্রথমে ইংরেজি বক্সে লিখুন");
      return;
    }
    setTranslating(true);
    try {
      const bnText = await translateToBanglaApi(enVal);
      if (bnText) {
        form.setFieldValue(`${field.key}|bn`, bnText);
        toast.success("বাংলায় অনুবাদ সম্পন্ন হয়েছে");
      }
    } catch {
      toast.error("অনুবাদ করতে সমস্যা হয়েছে");
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="grid gap-3 border-b border-secondary-50 py-3 last:border-0 md:grid-cols-2">
      <Form.Item
        label={
          <span className="text-xs font-medium text-secondary-700">
            {field.label}
          </span>
        }
        name={`${field.key}|en`}
        className="!mb-0"
        tooltip={field.key}
      >
        {field.type === "richtext" ? (
          <RichTextEditor placeholder={field.en || "—"} height={500} />
        ) : (
          <Control
            placeholder={field.en || "—"}
            autoSize={field.type === "textarea" ? { minRows: 2 } : undefined}
          />
        )}
      </Form.Item>
      <Form.Item
        label={
          <div className="flex w-full items-center justify-between">
            <span className="text-xs font-medium text-secondary-500">
              {field.label} (বাংলা)
            </span>
            {field.type !== "richtext" && (
              <Button
                type="link"
                size="small"
                onClick={handleTranslate}
                loading={translating}
                icon={!translating ? <Languages className="h-3.5 w-3.5 text-primary-600" /> : undefined}
                className="!h-auto !p-0 !text-xs !font-medium text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                বাংলা করুন
              </Button>
            )}
          </div>
        }
        name={`${field.key}|bn`}
        className="!mb-0"
      >
        {field.type === "richtext" ? (
          <RichTextEditor placeholder={field.bn || "—"} height={500} />
        ) : (
          <Control
            placeholder={field.bn || "—"}
            autoSize={field.type === "textarea" ? { minRows: 2 } : undefined}
          />
        )}
      </Form.Item>
    </div>
  );
};

export default CmsPage;
