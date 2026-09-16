/* eslint-disable react-refresh/only-export-components */
import { Radio } from "antd";
import React from "react";

export const DESIGNATION_SCOPE_OPTIONS = [
  { value: "employee", label: "Employee" },
] as const;

export type SelectableScope = (typeof DESIGNATION_SCOPE_OPTIONS)[number]["value"];

export const scopeLabel = (scope?: string): string => {
  const match = DESIGNATION_SCOPE_OPTIONS.find((o) => o.value === scope);
  return match ? match.label : "Employee";
};

export const ScopeRadio: React.FC<{
  value?: SelectableScope;
  onChange?: (value: SelectableScope) => void;
}> = ({ value, onChange }) => (
  <Radio.Group
    optionType="button"
    buttonStyle="solid"
    value={value}
    onChange={(e) => onChange?.(e.target.value)}
  >
    {DESIGNATION_SCOPE_OPTIONS.map((o) => (
      <Radio.Button key={o.value} value={o.value}>
        {o.label}
      </Radio.Button>
    ))}
  </Radio.Group>
);
