import { DistributionSegment } from "@/components/ui/distribution-segment";
import { ArrowUp, ArrowDown } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";
import clsx from "clsx";
import {
  columnVisibilityFeature,
  createColumnHelper,
  createSortedRowModel,
  flexRender,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_text,
  tableFeatures,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import { VALID_YEARS } from "../tax/constants";
import type { TaxYear } from "../tax/constants";
import type { TaxResult } from "../tax/types";
import * as m from "../paraglide/messages.js";
import { fmt, pct } from "./format.js";

interface ComparisonRow {
  year: (typeof VALID_YEARS)[number];
  result: TaxResult;
}

interface Props {
  rows: ComparisonRow[];
  activeYear: TaxYear;
}

const comparisonTableFeatures = tableFeatures({
  columnVisibilityFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    text: sortFn_text,
  },
});
const columnHelper = createColumnHelper<typeof comparisonTableFeatures, ComparisonRow>();

const NUMERIC_COLS = new Set(["gross", "nlTax", "beTax", "totalTax", "netIncome", "effectiveRate"]);

export default function MultiYearComparison({ rows, activeYear }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("year", {
          header: () => m.years_year(),
          cell: (info) => (
            <>
              {info.getValue()}
              {info.getValue() === activeYear && (
                <Badge variant="primary" className="ms-2">
                  {m.years_active()}
                </Badge>
              )}
            </>
          ),
        }),
        columnHelper.accessor((row) => row.result.grossIncome, {
          id: "gross",
          header: () => m.years_gross(),
          cell: (info) => fmt(info.getValue()),
        }),
        columnHelper.accessor((row) => row.result.nl.netTaxNL, {
          id: "nlTax",
          header: () => m.years_nl_tax(),
          cell: (info) => <span className="text-danger">-{fmt(info.getValue())}</span>,
        }),
        columnHelper.accessor((row) => row.result.be?.netTaxBE ?? 0, {
          id: "beTax",
          header: () => m.years_be_tax(),
          cell: (info) => <span className="text-danger">-{fmt(info.getValue())}</span>,
        }),
        columnHelper.accessor((row) => row.result.totalTax, {
          id: "totalTax",
          header: () => m.years_total_tax(),
          cell: (info) => (
            <span className="text-danger font-semibold">-{fmt(info.getValue())}</span>
          ),
        }),
        columnHelper.accessor((row) => row.result.netIncome, {
          id: "netIncome",
          header: () => m.years_net_income(),
          cell: (info) => (
            <span className="text-success font-semibold">{fmt(info.getValue())}</span>
          ),
        }),
        columnHelper.accessor((row) => row.result.effectiveRateTotal, {
          id: "effectiveRate",
          header: () => m.years_effective_rate(),
          cell: (info) => pct(info.getValue()),
        }),
      ]),
    [activeYear],
  );

  const table = useTable({
    features: comparisonTableFeatures,
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
  });

  return (
    <div>
      <h6 className="text-text-muted mb-4">{m.years_title()}</h6>

      {/* Visual year chart */}
      <div className="bt-year-chart">
        {rows.map(({ year, result }) => {
          const gross = result.grossIncome;
          if (gross === 0) return null;
          const nlPct = (result.nl.netTaxNL / gross) * 100;
          const bePct = ((result.be?.netTaxBE ?? 0) / gross) * 100;
          const netPct = 100 - nlPct - bePct;
          const isActive = year === activeYear;

          return (
            <div
              key={year}
              className={clsx("bt-year-chart__row", isActive && "bt-year-chart__row--active")}
            >
              <div className="bt-year-chart__label">
                {year}
                {isActive && <span className="bt-year-chart__active-dot" />}
              </div>
              <div className="bt-year-chart__bar">
                <DistributionSegment
                  className="bt-year-chart__seg bt-year-chart__seg--net"
                  percent={netPct}
                />
                <DistributionSegment
                  className="bt-year-chart__seg bt-year-chart__seg--nl"
                  percent={nlPct}
                />
                {bePct > 0 && (
                  <DistributionSegment
                    className="bt-year-chart__seg bt-year-chart__seg--be"
                    percent={bePct}
                  />
                )}
              </div>
              <div className="bt-year-chart__value">{fmt(result.netIncome)}</div>
            </div>
          );
        })}
      </div>

      {/* Chart legend */}
      <div className="bt-year-chart__legend">
        <span className="bt-year-chart__legend-item">
          <span className="bt-year-chart__legend-dot bt-year-chart__seg--net" />
          {m.summary_net_label()}
        </span>
        <span className="bt-year-chart__legend-item">
          <span className="bt-year-chart__legend-dot bt-year-chart__seg--nl" />
          🇳🇱 {m.summary_dutch_tax()}
        </span>
        <span className="bt-year-chart__legend-item">
          <span className="bt-year-chart__legend-dot bt-year-chart__seg--be" />
          🇧🇪 {m.summary_belgian_tax()}
        </span>
      </div>

      {/* Detail table */}
      <Table bordered hover responsive>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={NUMERIC_COLS.has(header.column.id) ? "text-end" : undefined}
                  aria-sort={
                    header.column.getIsSorted() === "asc"
                      ? "ascending"
                      : header.column.getIsSorted() === "desc"
                        ? "descending"
                        : "none"
                  }
                >
                  {header.column.getCanSort() ? (
                    <button
                      type="button"
                      className=" border-0 bg-transparent text-brand-light p-0 text-inherit no-underline"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" && (
                        <ArrowUp className="ms-1 inline size-3" aria-hidden="true" />
                      )}
                      {header.column.getIsSorted() === "desc" && (
                        <ArrowDown className="ms-1 inline size-3" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    flexRender(header.column.columnDef.header, header.getContext())
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              variant={row.original.year === activeYear ? "primary" : "default"}
              data-state={row.original.year === activeYear ? "selected" : undefined}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={NUMERIC_COLS.has(cell.column.id) ? "text-end" : undefined}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-text-muted text-sm mb-0">{m.years_description()}</p>
    </div>
  );
}
