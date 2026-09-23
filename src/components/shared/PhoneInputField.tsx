import { parsePhoneNumberFromString } from "libphonenumber-js";
import { useMemo } from "react";
import PhoneInput, {
  type Country,
  type Value,
} from "react-phone-number-input";
import "react-phone-number-input/style.css";

const DEFAULT_COUNTRY: Country = "BD";

/** Turn stored local BD numbers (017…) into E.164 for the picker. */
export function toPhoneValue(raw?: string | null): Value | undefined {
  const text = String(raw || "").trim();
  if (!text) return undefined;
  if (text.startsWith("+")) return text as Value;
  const parsed = parsePhoneNumberFromString(text, DEFAULT_COUNTRY);
  return (parsed?.number as Value | undefined) || undefined;
}

type Props = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Default Bangladesh. */
  defaultCountry?: Country;
};

/**
 * Phone field with country flag — Bangladesh by default.
 * Stores E.164 (e.g. +8801711250406) for Ant Design Form.Item.
 */
const PhoneInputField = ({
  value,
  onChange,
  placeholder = "01712-345678",
  disabled,
  className,
  defaultCountry = DEFAULT_COUNTRY,
}: Props) => {
  const phoneValue = useMemo(() => toPhoneValue(value), [value]);

  return (
    <PhoneInput
      international
      defaultCountry={defaultCountry}
      countryCallingCodeEditable={false}
      value={phoneValue}
      onChange={(next) => onChange?.(next || "")}
      placeholder={placeholder}
      disabled={disabled}
      className={["PhoneInputField", className].filter(Boolean).join(" ")}
    />
  );
};

export default PhoneInputField;
