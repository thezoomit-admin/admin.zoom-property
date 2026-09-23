/* eslint-disable react-refresh/only-export-components */
import { Button, Form, Input, Tooltip } from "antd";
import { Languages, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "react-toastify";

/**
 * Utility function to translate English text to Bangla using Google Translate free API.
 */
export const translateToBanglaApi = async (text: string): Promise<string> => {
  if (!text || !text.trim()) return "";

  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=bn&dt=t&q=${encodeURIComponent(
        text,
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
        text,
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
 * Bangla script + common punctuation/digits.
 * Allows middot (·), en/em dashes, etc. used in CMS badges like
 * "ল্যান্ড শেয়ার · বুকিং চালু" / "জি+৯ · ১০ তলা".
 * Still blocks Latin A–Z so EN copy does not sneak into BN fields.
 */
export const BANGLA_REGEX =
  /^[\u0980-\u09FF\u0964\u0965\u200C\u200D\s0-9.,!()"'\-/:;?%&+*=#@~^\[\]{}·•…“”‘’—–−]*$/;
const ENGLISH_ONLY_REGEX = /^[^\u0980-\u09FF]*$/;

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
      let sourceText = sourceFieldName
        ? form.getFieldValue(toPath(sourceFieldName))
        : "";
      if (!sourceText) {
        sourceText = form.getFieldValue(toPath(name));
      }

      if (!sourceText || !String(sourceText).trim()) {
        toast.info("অনুবাদের জন্য আগে ইংরেজিতে টেক্সট টাইপ করুন");
        return;
      }

      const bnText = await translateToBanglaApi(String(sourceText));
      form.setFieldValue(toPath(name), bnText);
      toast.success("বাংলায় রূপান্তর করা হয়েছে!");
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

  const labelWithTranslateBtn =
    lang === "bn" && form ? (
      <div className="flex w-full items-center justify-between gap-2">
        {labelNode}
        <Tooltip title="ইংরেজিতে লেখা থেকে বাংলায় রূপান্তর করুন">
          <Button
            type="link"
            size="small"
            className="!h-auto !px-1 !text-xs flex shrink-0 items-center gap-1 whitespace-nowrap text-primary-600 hover:text-primary-700"
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
            {translating ? "রূপান্তর হচ্ছে..." : "বাংলা করুন"}
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
