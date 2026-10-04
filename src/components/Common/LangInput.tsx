/* eslint-disable react-refresh/only-export-components */
import { Form, Input } from "antd";
import React from "react";

export const ENGLISH_ONLY_REGEX = /^[^\u0980-\u09FF]*$/;

export const ENGLISH_RULE = {
  pattern: ENGLISH_ONLY_REGEX,
  message: "Please enter English text only",
};

/** Ant Design Form.Item tooltip body — length + what to write. */
export function fieldTooltip(tip: string, softMax?: number) {
  if (!softMax) return tip;
  return (
    <div className="space-y-1">
      <div>{tip}</div>
      <div>
        Keep it within <strong>{softMax}</strong> characters to preserve the design.
      </div>
    </div>
  );
}

interface LangInputProps {
  label: React.ReactNode;
  name: string | number | (string | number)[];
  lang: "en";
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
  required = false,
  optional = false,
  hint,
  softMax,
  placeholder,
  isTextArea = false,
  rows = 2,
  className,
}) => {
  const rules: any[] = [];
  if (required) {
    rules.push({ required: true, message: `${label} is required` });
  }
  rules.push(ENGLISH_RULE);

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
      label={labelNode}
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
