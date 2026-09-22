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
  
  // Try Google Translate GTX API first
  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=bn&dt=t&q=${encodeURIComponent(
        text
      )}`
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

  // Fallback to MyMemory translation API if Google GTX is blocked/fails
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text
      )}&langpair=en|bn`
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

export const BANGLA_REGEX = /^[\u0980-\u09FF\u0964\u0965\u200C\u200D\s0-9.,!()"'\-/:;?%&+“”‘’—–]*$/;
const ENGLISH_ONLY_REGEX = /^[^\u0980-\u09FF]*$/;

export const BANGLA_RULE = {
  pattern: BANGLA_REGEX,
  message: "শুধুমাত্র বাংলা লেখা টাইপ করুন (Only Bangla text allowed)",
};

export const ENGLISH_RULE = {
  pattern: ENGLISH_ONLY_REGEX,
  message: "English fields cannot contain Bangla text (বাংলা টাইপ করা যাবে না)",
};

interface LangInputProps {
  label: React.ReactNode;
  name: string | number | (string | number)[];
  lang: "bn" | "en";
  required?: boolean;
  placeholder?: string;
  isTextArea?: boolean;
  rows?: number;
  /**
   * Optional name of the English source field to translate from when auto-converting.
   */
  sourceFieldName?: string | number | (string | number)[];
  /**
   * When this input sits inside a `Form.List`, pass the list's root path so
   * translate get/set use the full store path while `name` stays relative.
   */
  pathPrefix?: (string | number)[];
  form?: any;
  className?: string;
}

/**
 * Global Language Input Component
 * Automatically handles Bangla / English language validation, placeholders,
 * and provides a 1-click "Translate to Bangla (বাংলা করুন)" button.
 */
export const LangInput: React.FC<LangInputProps> = ({
  label,
  name,
  lang,
  required = false,
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

  const labelWithTranslateBtn = (
    <div className="flex items-center justify-between w-full gap-2">
      <span className="whitespace-nowrap">{label}</span>
      {lang === "bn" && form && (
        <Tooltip title="ইংরেজিতে লেখা থেকে বাংলায় রূপান্তর করুন">
          <Button
            type="link"
            size="small"
            className="!px-1 !h-auto !text-xs flex items-center gap-1 text-primary-600 hover:text-primary-700 shrink-0 whitespace-nowrap"
            onClick={handleAutoTranslate}
            loading={translating}
            icon={
              translating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Languages className="w-3.5 h-3.5" />
              )
            }
          >
            {translating ? "রূপান্তর হচ্ছে..." : "বাংলা করুন"}
          </Button>
        </Tooltip>
      )}
    </div>
  );

  return (
    <Form.Item label={labelWithTranslateBtn} name={name} rules={rules} className={className}>
      {isTextArea ? (
        <Input.TextArea rows={rows} placeholder={placeholder} />
      ) : (
        <Input placeholder={placeholder} />
      )}
    </Form.Item>
  );
};

export default LangInput;
