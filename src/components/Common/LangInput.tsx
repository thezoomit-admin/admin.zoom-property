/* eslint-disable react-refresh/only-export-components */
import { Button, Form, Input, Tooltip } from "antd";
import { Languages, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "react-toastify";

/**
 * Utility function to translate English text to Bangla using Google Translate free API with fallback.
 */
export const translateToBanglaApi = async (text: string): Promise<string> => {
  if (!text || !text.trim()) return "";

  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=bn&dt=t&q=${encodeURIComponent(
        text.trim(),
      )}`,
    );
    if (response.ok) {
      const data = await response.json();
      if (data && data[0] && Array.isArray(data[0])) {
        const translated = data[0].map((item: any) => item[0]).join("");
        if (translated) return translated;
      }
    }
  } catch (error) {
    console.warn("Google Translate GTX error, attempting fallback...", error);
  }

  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text.trim(),
      )}&langpair=en|bn`,
    );
    if (response.ok) {
      const data = await response.json();
      if (data?.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch (fallbackError) {
    console.error("MyMemory translate error:", fallbackError);
  }

  toast.error("অনুবাদ করতে সমস্যা হয়েছে");
  return text;
};

/**
 * Utility function to translate Bangla text to English using Google Translate free API with fallback.
 */
export const translateToEnglishApi = async (text: string): Promise<string> => {
  if (!text || !text.trim()) return "";

  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=bn&tl=en&dt=t&q=${encodeURIComponent(
        text.trim(),
      )}`,
    );
    if (response.ok) {
      const data = await response.json();
      if (data && data[0] && Array.isArray(data[0])) {
        const translated = data[0].map((item: any) => item[0]).join("");
        if (translated) return translated;
      }
    }
  } catch (error) {
    console.warn("Google Translate GTX error, attempting fallback...", error);
  }

  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text.trim(),
      )}&langpair=bn|en`,
    );
    if (response.ok) {
      const data = await response.json();
      if (data?.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch (fallbackError) {
    console.error("MyMemory translate error:", fallbackError);
  }

  toast.error("Failed to translate to English");
  return text;
};

/**
 * Automatically infer counterpart field name (e.g. titleBn -> titleEn, titleEn -> titleBn)
 */
function inferCounterpartField(
  field: string | number | (string | number)[],
  currentLang: "bn" | "en"
): string | number | (string | number)[] | null {
  const targetLang = currentLang === "bn" ? "en" : "bn";
  if (Array.isArray(field)) {
    return field.map((part) => {
      if (typeof part === "string") {
        if (part === currentLang) return targetLang;
        if (part.endsWith("Bn") && currentLang === "bn") return part.replace(/Bn$/, "En");
        if (part.endsWith("En") && currentLang === "en") return part.replace(/En$/, "Bn");
        if (part.endsWith("_bn") && currentLang === "bn") return part.replace(/_bn$/, "_en");
        if (part.endsWith("_en") && currentLang === "en") return part.replace(/_en$/, "_bn");
      }
      return part;
    });
  }
  if (typeof field === "string") {
    if (field === currentLang) return targetLang;
    if (field.endsWith("Bn") && currentLang === "bn") return field.replace(/Bn$/, "En");
    if (field.endsWith("En") && currentLang === "en") return field.replace(/En$/, "Bn");
    if (field.endsWith("_bn") && currentLang === "bn") return field.replace(/_bn$/, "_en");
    if (field.endsWith("_en") && currentLang === "en") return field.replace(/_en$/, "_bn");
    if (field.endsWith("|bn") && currentLang === "bn") return field.replace(/\|bn$/, "|en");
    if (field.endsWith("|en") && currentLang === "en") return field.replace(/\|en$/, "|bn");
  }
  return null;
}

/**
 * Bangla script + common punctuation/digits.
 * Allows middot (·), en/em dashes, etc. used in CMS badges like
 * "ল্যান্ড শেয়ার · বুকিং চালু" / "জি+৯ · ১০ তলা".
 * Still blocks Latin A–Z so EN copy does not sneak into BN fields.
 */
export const BANGLA_REGEX =
  /^[\u0980-\u09FF\u0964\u0965\u200C\u200D\s0-9.,!()"'\-/:;?%&+*=#@~^[\]{}·•…“”‘’—–−]*$/;
export const ENGLISH_ONLY_REGEX = /^[^\u0980-\u09FF]*$/;

export const BANGLA_RULE = {
  pattern: BANGLA_REGEX,
  message: "শুধুমাত্র বাংলা লেখা টাইপ করুন (Only Bangla text allowed)",
};

export const ENGLISH_RULE = {
  pattern: ENGLISH_ONLY_REGEX,
  message: "English fields cannot contain Bangla text (বাংলা টাইপ করা যাবে না)",
};

/** Ant Design Form.Item tooltip body — length + what to write. */
export function fieldTooltip(tip: string, softMax?: number) {
  if (!softMax) return tip;
  return (
    <div className="space-y-1">
      <div>{tip}</div>
      <div>
        ডিজাইন সেফ: সর্বোচ্চ <strong>{softMax}</strong> অক্ষর — বেশি হলে লেআউট
        নষ্ট হতে পারে।
      </div>
    </div>
  );
}

interface LangInputProps {
  label: React.ReactNode;
  name: string | number | (string | number)[];
  lang: "bn" | "en";
  required?: boolean;
  optional?: boolean;
  hint?: string;
  softMax?: number;
  placeholder?: string;
  isTextArea?: boolean;
  rows?: number;
  sourceFieldName?: string | number | (string | number)[];
  pathPrefix?: (string | number)[];
  form?: any;
  className?: string;
}

export const LangInput: React.FC<LangInputProps> = ({
  label,
  name,
  lang,
  required = false,
  optional = false,
  hint,
  softMax,
  placeholder,
  isTextArea = false,
  rows = 2,
  sourceFieldName,
  pathPrefix,
  form,
  className,
}) => {
  const [translating, setTranslating] = useState(false);

  const rules: any[] = [];
  if (required) {
    rules.push({ required: true, message: `${label} is required` });
  }

  if (lang === "bn") {
    rules.push(BANGLA_RULE);
  } else if (lang === "en") {
    rules.push(ENGLISH_RULE);
  }

  const toPath = (field: string | number | (string | number)[]) => {
    const parts = Array.isArray(field) ? field : [field];
    return pathPrefix?.length ? [...pathPrefix, ...parts] : parts;
  };

  const handleAutoTranslate = async () => {
    if (!form) return;
    setTranslating(true);
    try {
      let srcPath = sourceFieldName ? toPath(sourceFieldName) : null;
      if (!srcPath) {
        const counterpart = inferCounterpartField(name, lang);
        if (counterpart) {
          srcPath = toPath(counterpart);
        }
      }

      let sourceText = srcPath ? form.getFieldValue(srcPath) : "";
      if (!sourceText) {
        sourceText = form.getFieldValue(toPath(name));
      }

      if (!sourceText || !String(sourceText).trim()) {
        toast.info(
          lang === "bn"
            ? "অনুবাদের জন্য আগে ইংরেজিতে টেক্সট টাইপ করুন"
            : "Please type Bangla text first to translate into English"
        );
        return;
      }

      if (lang === "bn") {
        const bnText = await translateToBanglaApi(String(sourceText));
        form.setFieldValue(toPath(name), bnText);
        toast.success("বাংলায় রূপান্তর করা হয়েছে!");
      } else {
        const enText = await translateToEnglishApi(String(sourceText));
        form.setFieldValue(toPath(name), enText);
        toast.success("English-এ রূপান্তর করা হয়েছে!");
      }
    } finally {
      setTranslating(false);
    }
  };

  const labelNode = (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      {optional ? (
        <span className="text-[11px] font-normal text-secondary-400">
          (optional)
        </span>
      ) : null}
    </span>
  );

  const labelWithTranslateBtn = form ? (
    <div className="flex w-full items-center justify-between gap-2">
      {labelNode}
      <Tooltip
        title={
          lang === "bn"
            ? "ইংরেজিতে লেখা থেকে বাংলায় রূপান্তর করুন (EN → BN)"
            : "বাংলায় লেখা থেকে ইংরেজিতে রূপান্তর করুন (BN → EN)"
        }
      >
        <Button
          type="link"
          size="small"
          className={`!h-auto !px-1 !text-xs flex shrink-0 items-center gap-1 whitespace-nowrap cursor-pointer ${
            lang === "bn"
              ? "text-emerald-600 hover:text-emerald-700"
              : "text-blue-600 hover:text-blue-700"
          }`}
          onClick={handleAutoTranslate}
          loading={translating}
          icon={
            translating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Languages className="h-3.5 w-3.5" />
            )
          }
        >
          {translating
            ? "অনুবাদ হচ্ছে..."
            : lang === "bn"
            ? "বাংলা করুন"
            : "English করুন"}
        </Button>
      </Tooltip>
    </div>
  ) : (
    labelNode
  );

  const countProps = softMax
    ? {
        showCount: {
          formatter: ({ count }: { count: number }) => (
            <span
              className={
                count > softMax ? "font-medium text-amber-600" : undefined
              }
            >
              {count}/{softMax}
            </span>
          ),
        },
      }
    : {};

  return (
    <Form.Item
      label={labelWithTranslateBtn}
      name={name}
      rules={rules}
      className={className}
      tooltip={hint ? fieldTooltip(hint, softMax) : undefined}
    >
      {isTextArea ? (
        <Input.TextArea rows={rows} placeholder={placeholder} {...countProps} />
      ) : (
        <Input placeholder={placeholder} {...countProps} />
      )}
    </Form.Item>
  );
};

export default LangInput;
