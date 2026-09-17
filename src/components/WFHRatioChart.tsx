import { useMemo, useState } from "react";
import { Badge, Table } from "react-bootstrap";
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
import {
  areaY,
  defineChart,
  dot,
  lineY,
  rect,
  ruleX,
  text as textMark,
  whenFocused,
} from "@tanstack/charts";
import { decorative } from "@tanstack/charts/mark/decorative";
import { crosshair } from "@tanstack/charts/crosshair";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { motion } from "@tanstack/charts/motion";
import { Chart } from "@tanstack/charts/react/core";
import { calculate } from "../tax";
import type { TaxInputs } from "../tax/types";
import * as m from "../paraglide/messages.js";
import { fmt, pct } from "./format.js";

interface Props {
  inputs: TaxInputs;
}

interface DataPoint {
  beRatio: number;
  beDays: number;
  nlDays: number;
  netIncome: number;
  nlTax: number;
  beTax: number;
}

const STEPS = 101;

/** ≤10 % BE → ≥90 % NL income → qualifies for hypotheekrenteaftrek */
const T_90 = 0.1;
/** ≤25 % BE → NL retains sole tax & social-security sourcing (NL-BE 2023 agreement) */
const T_25 = 0.25;
/** ≤49 % BE → Dutch social security remains applicable via kaderakkoord (apply at SVB; A1 document required) */
const T_49 = 0.49;

const Y_TICKS = 5;

// Spring transition for line/area/marker movement as the ratio curve is
// recomputed (inputs change) or the focused point moves along it.
const chartRenderer = motion({
  transition: { type: "spring", stiffness: 170, damping: 22, mass: 1 },
});

function fmtK(n: number): string {
  if (Math.abs(n) >= 1000) return `€${Math.round(n / 1000)}k`;
  return `€${Math.round(n)}`;
}

type Zone = "full" | "hybrid" | "kaderakkoord" | "above";

function getZone(ratio: number): Zone {
  if (ratio <= T_90) return "full";
  if (ratio <= T_25) return "hybrid";
  if (ratio <= T_49) return "kaderakkoord";
  return "above";
}

// Threshold/current/optimal marker rows are plain objects rather than raw
// numbers so their positional channels can use stable field-name accessors.
interface XPoint {
  x: number;
}
interface XYPoint {
  x: number;
  y: number;
}
interface ZoneRow {
  x1: number;
  x2: number;
  fill: string;
}
interface ChipRow {
  x: number;
  label: string;
  color: string;
}

export default function WFHRatioChart({ inputs }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [tableOpen, setTableOpen] = useState(false);

  const nlbeDays = inputs.daysWorkedNL + inputs.daysWorkedBE;

  const data = useMemo<DataPoint[]>(() => {
    if (nlbeDays === 0) return [];
    return Array.from({ length: STEPS }, (_, i) => {
      const beRatio = i / (STEPS - 1);
      const beDays = Math.round(beRatio * nlbeDays);
      const result = calculate({
        ...inputs,
        daysWorkedNL: nlbeDays - beDays,
        daysWorkedBE: beDays,
      });
      return {
        beRatio,
        beDays,
        nlDays: nlbeDays - beDays,
        netIncome: result.netIncome,
        nlTax: result.nl.netTaxNL,
        beTax: result.be?.netTaxBE ?? 0,
      };
    });
  }, [inputs, nlbeDays]);

  const currentBeRatio = nlbeDays > 0 ? inputs.daysWorkedBE / nlbeDays : 0;
  const currentIdx = Math.round(currentBeRatio * (STEPS - 1));

  const optimalIdx = useMemo(() => {
    if (data.length === 0) return 0;
    let best = 0;
    for (let i = 1; i < data.length; i++) {
      if ((data[i]?.netIncome ?? 0) > (data[best]?.netIncome ?? 0)) best = i;
    }
    return best;
  }, [data]);

  const yMin = useMemo(
    () => Math.min(0, ...data.map((d) => Math.min(d.netIncome, d.nlTax, d.beTax))),
    [data],
  );
  const yMax = useMemo(() => Math.max(...data.map((d) => d.netIncome)), [data]);
  const yPad = (yMax - yMin) * 0.12;
  const yLow = yMin - yPad;
  const yHigh = yMax + yPad;

  const yTicks = useMemo(
    () => Array.from({ length: Y_TICKS + 1 }, (_, i) => yLow + (i / Y_TICKS) * (yHigh - yLow)),
    [yLow, yHigh],
  );

  const showBE = inputs.residentCountry === "BE";
  const hp = hovered !== null ? (data[hovered] ?? null) : null;
  const displayPoint = hp ?? data[currentIdx] ?? null;
  const isHovering = hp !== null;

  const currentNet = data[currentIdx]?.netIncome ?? 0;
  const optimalNet = data[optimalIdx]?.netIncome ?? 0;
  const delta = optimalNet - currentNet;
  const currentZone = getZone(currentBeRatio);
  const optimalBeRatio = data[optimalIdx]?.beRatio ?? 0;
  const showOptimalMarker = optimalIdx !== currentIdx && data[optimalIdx] !== undefined;

  const chartDefinition = useMemo(() => {
    if (data.length === 0) return null;

    const zoneRows: ZoneRow[] = [
      { x1: 0, x2: T_90, fill: "rgba(34, 197, 94, 0.06)" },
      { x1: T_90, x2: T_25, fill: "rgba(96, 165, 250, 0.025)" },
      { x1: T_25, x2: T_49, fill: "rgba(168, 85, 247, 0.025)" },
      { x1: T_49, x2: 1, fill: "rgba(245, 158, 11, 0.025)" },
    ];
    const chipRows: ChipRow[] = [
      { x: T_90, label: m.wfh_threshold_10_label(), color: "rgba(96, 165, 250, 0.9)" },
      { x: T_25, label: m.wfh_threshold_25_label(), color: "rgba(245, 158, 11, 0.9)" },
      { x: T_49, label: m.wfh_threshold_49_label(), color: "rgba(168, 85, 247, 0.9)" },
    ];
    const currentPoint: XYPoint[] = [{ x: currentBeRatio, y: currentNet }];
    const optimalPoint: XYPoint[] = showOptimalMarker ? [{ x: optimalBeRatio, y: optimalNet }] : [];
    const thresholdRules: XPoint[] = [{ x: T_90 }, { x: T_25 }, { x: T_49 }];
    const thresholdColors = [
      "rgba(96, 165, 250, 0.7)",
      "rgba(245, 158, 11, 0.7)",
      "rgba(168, 85, 247, 0.7)",
    ];

    return defineChart(
      {
        marks: [
          ...zoneRows.map((row, i) =>
            decorative(
              rect([row], {
                id: `zone-${i}`,
                x1: "x1",
                x2: "x2",
                y1: () => yLow,
                y2: () => yHigh,
                fill: row.fill,
                inset: 0,
              }),
            ),
          ),
          decorative(
            areaY(data, {
              id: "net-area",
              x: "beRatio",
              y: "netIncome",
              fill: "url(#wfh-net-grad)",
            }),
          ),
          lineY(data, {
            id: "net-line",
            x: "beRatio",
            y: "netIncome",
            stroke: "var(--bt-success)",
            strokeWidth: 2.5,
          }),
          decorative(
            lineY(data, {
              id: "nl-line",
              x: "beRatio",
              y: "nlTax",
              stroke: "var(--bt-nl)",
              strokeWidth: 2,
              strokeOpacity: 0.85,
            }),
          ),
          ...(showBE
            ? [
                decorative(
                  lineY(data, {
                    id: "be-line",
                    x: "beRatio",
                    y: "beTax",
                    stroke: "var(--bt-be)",
                    strokeWidth: 2,
                    strokeOpacity: 0.85,
                  }),
                ),
              ]
            : []),
          ...thresholdRules.map((row, i) =>
            ruleX([row], {
              id: `threshold-${i}`,
              x: "x",
              stroke: thresholdColors[i],
              strokeWidth: 1.5,
              strokeDasharray: "5 3",
            }),
          ),
          decorative(
            textMark(chipRows, {
              id: "threshold-chips",
              x: "x",
              y: () => yHigh,
              text: "label",
              fill: "color",
              fontSize: 8,
              fontWeight: 600,
              anchor: "start",
              dx: 4,
              dy: 10,
            }),
          ),
          ruleX([{ x: currentBeRatio }], {
            id: "current-line",
            x: "x",
            stroke: "rgba(255, 255, 255, 0.55)",
            strokeWidth: 1.5,
            strokeDasharray: "6 4",
          }),
          ...(showOptimalMarker
            ? [
                ruleX([{ x: optimalBeRatio }], {
                  id: "optimal-line",
                  x: "x",
                  stroke: "var(--bt-success)",
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                  strokeOpacity: 0.55,
                }),
                decorative(
                  dot(optimalPoint, {
                    id: "optimal-dot",
                    x: "x",
                    y: "y",
                    r: 6,
                    fill: "var(--bt-success)",
                    fillOpacity: 0.9,
                  }),
                ),
              ]
            : []),
          decorative(
            dot(currentPoint, {
              id: "current-dot",
              x: "x",
              y: "y",
              r: 5,
              fill: "var(--bt-bg)",
              stroke: "rgba(255, 255, 255, 0.85)",
              strokeWidth: 2.5,
            }),
          ),
          whenFocused(
            dot(data, {
              id: "hover-net-dot",
              x: "beRatio",
              y: "netIncome",
              r: 4,
              fill: "var(--bt-success)",
              stroke: "var(--bt-bg)",
              strokeWidth: 2,
            }),
            { match: "x" },
          ),
          whenFocused(
            dot(data, {
              id: "hover-nl-dot",
              x: "beRatio",
              y: "nlTax",
              r: 3,
              fill: "var(--bt-nl)",
              stroke: "var(--bt-bg)",
              strokeWidth: 2,
            }),
            { match: "x" },
          ),
          ...(showBE
            ? [
                whenFocused(
                  dot(data, {
                    id: "hover-be-dot",
                    x: "beRatio",
                    y: "beTax",
                    r: 3,
                    fill: "var(--bt-be)",
                    stroke: "var(--bt-bg)",
                    strokeWidth: 2,
                  }),
                  { match: "x" },
                ),
              ]
            : []),
          crosshair({ x: {}, y: false }),
        ],
        scales: {
          x: {
            scale: () => scaleLinear().domain([0, 1]),
            axis: {
              ticks: {
                values: [0, 0.1, 0.25, 0.5, 0.75, 1],
                format: (v: number) => `${Math.round(v * 100)}%`,
              },
              label: m.wfh_x_label(),
            },
          },
          y: {
            scale: () => scaleLinear().domain([yLow, yHigh]),
            grid: true,
            axis: {
              ticks: { values: yTicks, format: fmtK },
            },
          },
        },
        gradients: [
          {
            id: "wfh-net-grad",
            y1: 0,
            y2: 1,
            stops: [
              { offset: 0, color: "var(--bt-success)", opacity: 0.18 },
              { offset: 1, color: "var(--bt-success)", opacity: 0.01 },
            ],
          },
        ],
        clip: true,
      },
      {
        focus: "nearest-x",
        maxFocusDistance: Number.POSITIVE_INFINITY,
        keyboard: true,
      },
    );
  }, [
    data,
    showBE,
    currentBeRatio,
    currentNet,
    optimalBeRatio,
    optimalNet,
    showOptimalMarker,
    yLow,
    yHigh,
    yTicks,
  ]);

  if (nlbeDays === 0) {
    return (
      <div className="bt-wfh-empty">
        <i className="bi bi-bar-chart-line text-muted me-2" style={{ fontSize: "1.5rem" }} />
        <p className="text-muted small mb-0">{m.input_workdays_total_zero_warning()}</p>
      </div>
    );
  }

  return (
    <div className="bt-wfh-root">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="bt-wfh-header">
        <div>
          <h6 className="text-muted mb-0">{m.wfh_title()}</h6>
          <p className="text-muted small mb-0 mt-1">{m.wfh_description()}</p>
        </div>
        <div className={`bt-wfh-zone-pill bt-wfh-zone-pill--${currentZone}`}>
          🏠 {Math.round(currentBeRatio * 100)}% BE
          <span className="bt-wfh-zone-pill__rule">
            {currentZone === "full" && m.wfh_threshold_10_label()}
            {currentZone === "hybrid" && m.wfh_threshold_25_label()}
            {currentZone === "kaderakkoord" && m.wfh_threshold_49_label()}
            {currentZone === "above" && `>${m.wfh_threshold_49_label()}`}
          </span>
        </div>
      </div>

      {/* ── Chart ───────────────────────────────────────────────────── */}
      <div className="bt-wfh-chart-wrap">
        {chartDefinition && (
          <Chart
            definition={chartDefinition}
            renderer={chartRenderer}
            height={300}
            ariaLabel={m.wfh_title()}
            ariaDescription={`${m.wfh_description()} ${m.wfh_current_ratio()}: ${Math.round(currentBeRatio * 100)}% BE.`}
            onFocusChange={(point) => setHovered(point?.datumIndex ?? null)}
          />
        )}

        {/* ── Legend — directly below chart, above readout ──────────── */}
        <div className="bt-year-chart__legend bt-wfh-legend">
          <span className="bt-year-chart__legend-item">
            <span
              className="bt-year-chart__legend-dot"
              style={{ background: "var(--bt-success)" }}
            />
            {m.summary_net_income()}
          </span>
          <span className="bt-year-chart__legend-item">
            <span className="bt-year-chart__legend-dot" style={{ background: "var(--bt-nl)" }} />
            🇳🇱 {m.summary_dutch_tax()}
          </span>
          {showBE && (
            <span className="bt-year-chart__legend-item">
              <span className="bt-year-chart__legend-dot" style={{ background: "var(--bt-be)" }} />
              🇧🇪 {m.summary_belgian_tax()}
            </span>
          )}
          <span className="bt-year-chart__legend-item">
            <span className="bt-wfh-legend-zone bt-wfh-legend-zone--full" />
            {m.wfh_zone_full_benefits()}
          </span>
          <span className="bt-year-chart__legend-item">
            <span className="bt-wfh-legend-zone bt-wfh-legend-zone--hybrid" />
            {m.wfh_zone_hybrid_safe()}
          </span>
          <span className="bt-year-chart__legend-item">
            <span className="bt-wfh-legend-zone bt-wfh-legend-zone--kaderakkoord" />
            {m.wfh_zone_kaderakkoord()}
          </span>
          <span className="bt-year-chart__legend-item">
            <span className="bt-wfh-legend-dash bt-wfh-legend-dash--current" />
            {m.wfh_current_ratio()}
          </span>
          {optimalIdx !== currentIdx && (
            <span className="bt-year-chart__legend-item">
              <span className="bt-wfh-legend-dash bt-wfh-legend-dash--optimal" />
              {m.wfh_optimal()}
            </span>
          )}
        </div>

        {/* ── Readout bar ───────────────────────────────────────────── */}
        <div className={`bt-wfh-readout${isHovering ? " bt-wfh-readout--visible" : ""}`}>
          {displayPoint ? (
            <>
              <span
                className={`bt-wfh-readout__label${isHovering ? "" : " bt-wfh-readout__label--current"}`}
              >
                {!isHovering && (
                  <span className="bt-wfh-readout__tag">{m.wfh_current_ratio()}</span>
                )}
                🏢 {Math.round((1 - displayPoint.beRatio) * 100)}% NL · 🏠{" "}
                {Math.round(displayPoint.beRatio * 100)}% BE
                <span className="text-muted bt-wfh-readout__days">
                  ({displayPoint.nlDays}d / {displayPoint.beDays}d)
                </span>
              </span>
              <span className="bt-wfh-readout__item bt-wfh-readout__item--net">
                {m.summary_net_income()} {fmt(displayPoint.netIncome)}
              </span>
              <span className="bt-wfh-readout__item bt-wfh-readout__item--nl">
                🇳🇱 −{fmt(displayPoint.nlTax)}
              </span>
              {showBE && (
                <span className="bt-wfh-readout__item bt-wfh-readout__item--be">
                  🇧🇪 −{fmt(displayPoint.beTax)}
                </span>
              )}
              <span
                className={`bt-wfh-readout__badge bt-wfh-readout__badge--${getZone(displayPoint.beRatio)}`}
              >
                {getZone(displayPoint.beRatio) === "full" && `✓ ${m.wfh_threshold_10_label()}`}
                {getZone(displayPoint.beRatio) === "hybrid" &&
                  `✓ ${m.wfh_threshold_25_label()} · ✗ hypo`}
                {getZone(displayPoint.beRatio) === "kaderakkoord" &&
                  `✓ ${m.wfh_threshold_49_label()} · A1`}
                {getZone(displayPoint.beRatio) === "above" && `✗ ${m.wfh_threshold_49_label()}`}
              </span>
            </>
          ) : (
            <span className="text-muted small">{m.wfh_hover_hint()}</span>
          )}
        </div>

        {/* ── Delta callout — only shown when there's meaningful gain ── */}
        {delta > 50 && data[optimalIdx] && (
          <div className="bt-wfh-delta">
            <i className="bi bi-arrow-up-circle-fill me-1" />↑ <strong>{fmt(delta)}</strong>/yr more
            at {Math.round(data[optimalIdx]!.beRatio * 100)}% BE
          </div>
        )}
      </div>

      {/* ── Table toggle ────────────────────────────────────────────── */}
      <button
        className="bt-wfh-table-toggle"
        onClick={() => setTableOpen((v) => !v)}
        aria-expanded={tableOpen}
      >
        <i className={`bi bi-chevron-${tableOpen ? "up" : "down"} me-1`} />
        {tableOpen ? m.wfh_table_hide() : m.wfh_table_show()}
      </button>

      {/* ── Kaderakkoord note ────────────────────────────────────────── */}
      <p className="text-muted small mt-2 mb-0">
        <i className="bi bi-info-circle me-1" />
        {m.wfh_kaderakkoord_note()}
      </p>

      {/* ── Qualifying taxpayer note (only relevant at ≤10% BE) ─────── */}
      {currentZone === "full" && (
        <p className="text-muted small mt-1 mb-0">
          <i className="bi bi-info-circle me-1" />
          {m.wfh_qualifying_taxpayer_note()}
        </p>
      )}

      {tableOpen && (
        <RatioTable data={data} currentIdx={currentIdx} optimalIdx={optimalIdx} showBE={showBE} />
      )}
    </div>
  );
}

// ─── Detail table ───────────────────────────────────────────────────────────

interface RatioRow {
  idx: number;
  beRatio: number;
  beDays: number;
  nlDays: number;
  nlTax: number;
  beTax: number;
  totalTax: number;
  netIncome: number;
  effectiveRate: number;
  threshold?: "90-norm" | "hybrid" | "kaderakkoord";
  isCurrent?: boolean;
  isOptimal?: boolean;
}

const ratioTableFeatures = tableFeatures({
  columnVisibilityFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    text: sortFn_text,
  },
});
const ratioColumnHelper = createColumnHelper<typeof ratioTableFeatures, RatioRow>();
const RATIO_NUMERIC_COLS = new Set(["nlTax", "beTax", "totalTax", "netIncome", "effectiveRate"]);

const ratioColumns = ratioColumnHelper.columns([
  ratioColumnHelper.accessor("beRatio", {
    id: "beSplit",
    header: () => m.wfh_be_split(),
    enableSorting: false,
    cell: (info) => {
      const row = info.row.original;
      const bePct = Math.round(info.getValue() * 100);
      return (
        <>
          <span className="bt-wfh-table-ratio">{bePct}%</span>
          <span className="text-muted ms-2 small">
            {row.nlDays}d NL / {row.beDays}d BE
          </span>
          {row.isCurrent && (
            <Badge bg="primary" className="ms-2">
              {m.years_active()}
            </Badge>
          )}
          {row.isOptimal && !row.isCurrent && (
            <Badge bg="success" className="ms-2">
              {m.wfh_optimal()}
            </Badge>
          )}
          {row.threshold === "90-norm" && (
            <Badge className="ms-2 bt-wfh-badge-10">{m.wfh_threshold_10_label()}</Badge>
          )}
          {row.threshold === "hybrid" && (
            <Badge className="ms-2 bt-wfh-badge-25">{m.wfh_threshold_25_label()}</Badge>
          )}
          {row.threshold === "kaderakkoord" && (
            <Badge className="ms-2 bt-wfh-badge-49">{m.wfh_threshold_49_label()}</Badge>
          )}
        </>
      );
    },
  }),
  ratioColumnHelper.accessor("nlTax", {
    header: () => m.years_nl_tax(),
    cell: (info) => <span className="text-danger small">−{fmt(info.getValue())}</span>,
  }),
  ratioColumnHelper.accessor("beTax", {
    header: () => m.years_be_tax(),
    cell: (info) => <span className="text-danger small">−{fmt(info.getValue())}</span>,
  }),
  ratioColumnHelper.accessor("totalTax", {
    header: () => m.years_total_tax(),
    cell: (info) => <span className="text-danger fw-semibold">−{fmt(info.getValue())}</span>,
  }),
  ratioColumnHelper.accessor("netIncome", {
    header: () => m.years_net_income(),
    cell: (info) => <span className="text-success fw-semibold">{fmt(info.getValue())}</span>,
  }),
  ratioColumnHelper.accessor("effectiveRate", {
    header: () => m.years_effective_rate(),
    cell: (info) => <span className="text-muted small">{pct(info.getValue())}</span>,
  }),
]);

interface RatioTableProps {
  data: DataPoint[];
  currentIdx: number;
  optimalIdx: number;
  showBE: boolean;
}

function RatioTable({ data, currentIdx, optimalIdx, showBE }: RatioTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const tableRows = useMemo<RatioRow[]>(() => {
    if (data.length === 0) return [];

    interface RowMeta {
      idx: number;
      threshold?: RatioRow["threshold"];
      isCurrent?: boolean;
      isOptimal?: boolean;
    }
    const seen = new Set<number>();
    const metas: RowMeta[] = [];

    function add(idx: number, extra: Partial<RowMeta> = {}) {
      if (seen.has(idx)) {
        const r = metas.find((x) => x.idx === idx);
        if (r) Object.assign(r, extra);
        return;
      }
      seen.add(idx);
      metas.push({ idx, ...extra });
    }

    add(0);
    add(Math.round(T_90 * (STEPS - 1)), { threshold: "90-norm" });
    add(Math.round(T_25 * (STEPS - 1)), { threshold: "hybrid" });
    add(Math.round(T_49 * (STEPS - 1)), { threshold: "kaderakkoord" });
    add(currentIdx, { isCurrent: true });
    add(optimalIdx, { isOptimal: true });
    add(Math.round(0.5 * (STEPS - 1)));
    add(Math.round(0.75 * (STEPS - 1)));
    add(STEPS - 1);

    metas.sort((a, b) => a.idx - b.idx);

    return metas.flatMap(({ idx, threshold, isCurrent, isOptimal }) => {
      const d = data[idx];
      if (!d) return [];
      const totalTax = d.nlTax + d.beTax;
      const gross = d.netIncome + totalTax;
      return [
        {
          idx,
          beRatio: d.beRatio,
          beDays: d.beDays,
          nlDays: d.nlDays,
          nlTax: d.nlTax,
          beTax: d.beTax,
          totalTax,
          netIncome: d.netIncome,
          effectiveRate: gross > 0 ? totalTax / gross : 0,
          threshold,
          isCurrent,
          isOptimal,
        },
      ];
    });
  }, [data, currentIdx, optimalIdx]);

  const table = useTable({
    features: ratioTableFeatures,
    data: tableRows,
    columns: ratioColumns,
    state: { sorting, columnVisibility: { beTax: showBE } },
    onSortingChange: setSorting,
  });

  if (tableRows.length === 0) return null;

  return (
    <Table bordered hover responsive className="bt-wfh-table">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className={RATIO_NUMERIC_COLS.has(header.column.id) ? "text-end" : undefined}
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
                    className="btn btn-link p-0 text-reset text-decoration-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === "asc" && (
                      <i className="bi bi-arrow-up ms-1" aria-hidden="true" />
                    )}
                    {header.column.getIsSorted() === "desc" && (
                      <i className="bi bi-arrow-down ms-1" aria-hidden="true" />
                    )}
                  </button>
                ) : (
                  flexRender(header.column.columnDef.header, header.getContext())
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => {
          const zone = getZone(row.original.beRatio);
          const rowClass = row.original.isCurrent
            ? "table-primary"
            : row.original.isOptimal
              ? "table-success"
              : undefined;
          return (
            <tr key={row.id} className={rowClass}>
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={
                    cell.column.id === "beSplit"
                      ? `bt-wfh-table-cell bt-wfh-table-cell--${zone}`
                      : RATIO_NUMERIC_COLS.has(cell.column.id)
                        ? "text-end"
                        : undefined
                  }
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
