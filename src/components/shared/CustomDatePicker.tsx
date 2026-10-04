import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Calendar } from "lucide-react";
import React from "react";

const { RangePicker } = DatePicker;

/**
 * The one date control, everywhere a date range is chosen.
 *
 * ── Why it is one control now ──────────────────────────────────────────────
 *
 * It used to be two. Clicking it opened a list of presets, and picking a range
 * of your own meant finding "Custom" at the bottom of that list and waiting for
 * a calendar to unfold underneath it — two clicks and a hunt to do the thing
 * people came to do. The presets have not been lost: they sit beside the
 * calendar in the same panel, so they are still one click, and choosing dates is
 * now one click as well.
 *
 * ── The range it reports ───────────────────────────────────────────────────
 *
 * `onChange` emits `[start, end]` where **end is exclusive** — the instant after
 * the last day, at midnight. Every caller queries `date >= start && date < end`,
 * so an inclusive end would silently drop everything recorded on the last day,
 * which is the day people care about most.
 *
 * The box itself shows the inclusive range, because that is the range that was
 * chosen. The old version showed the exclusive end raw: pick the 1st to the 6th
 * and the box read "2026-09-01 to 2026-09-07" while the page beside it said
 * "01 Sep – 06 Sep". Two labels for one range, disagreeing by a day, on the
 * same screen.
 */
interface CustomDatePickerProps {
  /** `[start, end]`, end exclusive. `[null, null]` means all time. */
  selectedData?: [string | null, string | null];
  onChange?: (dates: [string | null, string | null]) => void;
  isDisabled?: boolean;
}

/** The quick answers, offered beside the calendar rather than instead of it. */
const presets = () => {
  const today = dayjs();
  return [
    { label: "Today", value: [today, today] as [Dayjs, Dayjs] },
    {
      label: "Yesterday",
      value: [today.subtract(1, "day"), today.subtract(1, "day")] as [
        Dayjs,
        Dayjs,
      ],
    },
    {
      label: "This week",
      value: [today.startOf("week"), today] as [Dayjs, Dayjs],
    },
    {
      label: "This month",
      value: [today.startOf("month"), today.endOf("month")] as [Dayjs, Dayjs],
    },
    {
      label: "Last month",
      value: [
        today.subtract(1, "month").startOf("month"),
        today.subtract(1, "month").endOf("month"),
      ] as [Dayjs, Dayjs],
    },
    {
      label: "This year",
      value: [today.startOf("year"), today.endOf("year")] as [Dayjs, Dayjs],
    },
    {
      label: "Last year",
      value: [
        today.subtract(1, "year").startOf("year"),
        today.subtract(1, "year").endOf("year"),
      ] as [Dayjs, Dayjs],
    },
  ];
};

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selectedData,
  onChange,
  isDisabled = false,
}) => {
  /*
   * Shown inclusive, reported exclusive. The end held in state is one day past
   * the last day, so a day comes off for display and goes back on for the
   * caller — the conversion lives here, once, rather than in each page.
   */
  const value: [Dayjs | null, Dayjs | null] | null =
    selectedData?.[0] && selectedData?.[1]
      ? [dayjs(selectedData[0]), dayjs(selectedData[1]).subtract(1, "day")]
      : null;

  const handleChange = (range: [Dayjs | null, Dayjs | null] | null) => {
    // Cleared: all time, which is what every caller reads `[null, null]` as.
    if (!range?.[0] || !range?.[1]) {
      onChange?.([null, null]);
      return;
    }

    onChange?.([
      range[0].startOf("day").toISOString(),
      range[1].add(1, "day").startOf("day").toISOString(),
    ]);
  };

  return (
    <RangePicker
      value={value}
      onChange={handleChange}
      disabled={isDisabled}
      allowClear
      presets={presets()}
      format="DD MMM YYYY"
      // Clearing is how you ask for everything, so the empty state says so
      // rather than leaving two blank boxes to interpret.
      placeholder={["All time", "All time"]}
      suffixIcon={<Calendar className="h-4 w-4 text-gray-500" />}
      className="w-[260px]"
      popupClassName="[&_*]:!font-display"
    />
  );
};

export default CustomDatePicker;
