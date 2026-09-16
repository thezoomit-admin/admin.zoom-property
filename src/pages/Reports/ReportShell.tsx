import type { ColumnsType } from "antd/es/table";
import { useEffect, useState, type ReactNode } from "react";

import ExportMenu from "../../components/Common/ExportMenu";
import { Stat, StatRow } from "../../components/Details/DetailKit";
import DataTable from "../../components/Table/DataTable";
import { makeSheet, type SheetColumn } from "../../utils/tableExport";

export type StatSpec = {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "neutral" | "green" | "red" | "amber";
  icon?: any;
};

/**
 * One frame for all four reports: headline figures, then the rows, with the
 * export sitting on the panel it exports.
 *
 * The four reports differ only in what they count, so everything else — the
 * card strip, the table chrome, the empty state, the file the Export button
 * writes — is defined once here. A report is then a set of stats and a set of
 * columns, which is all a report actually is.
 *
 * Columns are declared once and used twice: `antd` renders them and the same
 * list builds the export, so a printed report can never carry different columns
 * from the screen it was taken from.
 */
export type ReportColumn<T> = {
  title: string;
  /** What the table shows — falls back to the export value when omitted. */
  render?: (row: T) => ReactNode;
  /** What the file gets. Plain text, never JSX. */
  value: (row: T) => string | number;
  width?: number;
  align?: "left" | "right" | "center";
  /** Excel-only, for the fields that are too wide to print. */
  detail?: boolean;
};

const ReportShell = <T,>({
  title,
  subtitle,
  stats,
  columns,
  rows,
  allRows,
  meta,
  page,
  setPage,
  limit,
  setLimit,
  loading,
  rangeLabel,
  emptyHint,
}: {
  title: string;
  subtitle?: string;
  stats: StatSpec[];
  columns: ReportColumn<T>[];
  rows: T[];
  allRows?: T[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
  page?: number;
  setPage?: (p: number) => void;
  limit?: number;
  setLimit?: (l: number) => void;
  loading?: boolean;
  rangeLabel: string;
  emptyHint?: string;
}) => {
  const [internalPage, setInternalPage] = useState(1);
  const [internalLimit, setInternalLimit] = useState(10);

  const currentPage = page ?? internalPage;
  const setCurrentPage = setPage ?? setInternalPage;
  const currentLimit = limit ?? internalLimit;
  const setCurrentLimit = setLimit ?? setInternalLimit;
  const exportRows = allRows || rows;
  const totalCount = meta?.total ?? rows.length;

  useEffect(() => {
    if (!page) setCurrentPage(1);
  }, [page, rangeLabel, setCurrentPage, title]);

  const tableColumns: ColumnsType<any> = columns
    .filter((c) => !c.detail)
    .map((c, i) => ({
      title: c.title,
      key: `${c.title}-${i}`,
      width: c.width,
      align: c.align,
      render: (_: unknown, row: T) => (
        <div className="whitespace-nowrap">
          {c.render ? c.render(row) : c.value(row) || "—"}
        </div>
      ),
    }));

  const sheetColumns: SheetColumn<T>[] = columns.map((c) => ({
    header: c.title,
    cell: c.value,
    detail: c.detail,
  }));

  return (
    <div className="space-y-4">
      {stats.length > 0 && (
        <StatRow>
          {stats.map((s) => (
            <Stat
              key={s.label}
              label={s.label}
              value={s.value}
              hint={s.hint}
              tone={s.tone}
              icon={s.icon}
            />
          ))}
        </StatRow>
      )}

      <div className="overflow-hidden rounded-xl border border-secondary-100 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary-100 px-5 py-3.5">
          <div>
            <h3 className="text-sm font-semibold text-secondary-900">
              {title}
            </h3>
            <p className="text-xs text-secondary-400">
              {subtitle ? `${subtitle} · ` : ""}
              {totalCount} row{totalCount === 1 ? "" : "s"} · {rangeLabel}
            </p>
          </div>
          {/* FR-2.8.5 — every report downloadable, same button as the lists. */}
          <ExportMenu
            disabled={exportRows.length === 0}
            sheet={(format) =>
              makeSheet({
                title: `${title} — ${rangeLabel}`,
                unit: "row",
                format,
                rows: exportRows,
                columns: sheetColumns,
                note: `Report period: ${rangeLabel}`,
              })
            }
          />
        </div>

        {rows.length === 0 && !loading ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-secondary-500">
              Nothing in this period
            </p>
            {emptyHint && (
              <p className="mt-1 text-xs text-secondary-400">{emptyHint}</p>
            )}
          </div>
        ) : (
          <DataTable
            data={rows}
            columns={tableColumns}
            rowKey={(_: T, i: number) => String(i)}
            loading={loading}
            isPaginate={true}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            limit={currentLimit}
            setLimit={setCurrentLimit}
            total={totalCount}
            isShowSizeChanger={true}
          />
        )}
      </div>
    </div>
  );
};

export default ReportShell;
