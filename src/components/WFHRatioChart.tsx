import { useMemo, useState } from "react";
import { Badge, Table } from "react-bootstrap";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { calculate } from "../tax";
import type { TaxInputs } from "../tax/types";
import * as m from "../paraglide/messages.js";
import { fmt, pct } from "./format.js";

interface Props {
  inputs: TaxInputs;
}

interface DataPoint {
  x: number; // beRatio * 100 (0–100)
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

interface ThresholdLabelProps {
  viewBox?: { x: number; y: number; width: number; height: number };
  label: string;
  color: string;
  bg: string;
}

function ThresholdLabel({ viewBox, label, color, bg }: ThresholdLabelProps) {
  if (!viewBox) return null;
  const W = 44;
  const H = 14;
  return (
    <g transform={`translate(${viewBox.x + 4}, ${viewBox.y + 4})`}>
      <rect rx={3} ry={3} width={W} height={H} fill={bg} />
      <text
        x={W / 2}
        y={H / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={8}
        fontFamily="var(--bt-font-mono)"
        fontWeight={600}
        fill={color}
      >
        {label}
      </text>
    </g>
  );
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
        x: i,
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

  const showBE = inputs.residentCountry === "BE";
  const hp = hovered !== null ? (data[hovered] ?? null) : null;
  const displayPoint = hp ?? data[currentIdx] ?? null;
  const isHovering = hp !== null;

  const currentNet = data[currentIdx]?.netIncome ?? 0;
  const optimalNet = data[optimalIdx]?.netIncome ?? 0;
  const delta = optimalNet - currentNet;
  const currentZone = getZone(currentBeRatio);

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
        <div className="bt-wfh-recharts">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={data}
              margin={{ top: 16, right: 16, bottom: 32, left: 56 }}
              onMouseMove={(state) => {
                if (state.isTooltipActive && typeof state.activeTooltipIndex === "number") {
                  setHovered(state.activeTooltipIndex);
                }
              }}
              onMouseLeave={() => setHovered(null)}
            >
              <defs>
                <linearGradient id="wfh-net-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--bt-success)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="var(--bt-success)" stopOpacity={0.01} />
                </linearGradient>
              </defs>

              {/* Zone shading */}
              <ReferenceArea x1={0} x2={T_90 * 100} fill="rgba(34,197,94,0.06)" stroke="none" />
              <ReferenceArea
                x1={T_90 * 100}
                x2={T_25 * 100}
                fill="rgba(96,165,250,0.025)"
                stroke="none"
              />
              <ReferenceArea
                x1={T_25 * 100}
                x2={T_49 * 100}
                fill="rgba(168,85,247,0.025)"
                stroke="none"
              />
              <ReferenceArea x1={T_49 * 100} x2={100} fill="rgba(245,158,11,0.025)" stroke="none" />

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--bt-border-soft)"
                vertical={false}
              />

              <XAxis
                dataKey="x"
                type="number"
                domain={[0, 100]}
                ticks={[0, 10, 25, 50, 75, 100]}
                tickFormatter={(v: number) => `${v}%`}
                tick={{
                  fontFamily: "var(--bt-font-mono)",
                  fontSize: 10,
                  fill: "var(--bt-text-muted)",
                }}
                label={{
                  value: m.wfh_x_label(),
                  position: "insideBottom",
                  offset: -12,
                  style: {
                    textAnchor: "middle",
                    fontFamily: "var(--bt-font-body)",
                    fontSize: 10,
                    fill: "var(--bt-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  },
                }}
              />

              <YAxis
                domain={[yLow, yHigh]}
                tickFormatter={fmtK}
                tick={{
                  fontFamily: "var(--bt-font-mono)",
                  fontSize: 10,
                  fill: "var(--bt-text-muted)",
                }}
                width={60}
              />

              {/* Threshold lines with chip labels */}
              <ReferenceLine
                x={T_90 * 100}
                stroke="rgba(96,165,250,0.7)"
                strokeDasharray="5 3"
                strokeWidth={1.5}
                label={(props: { viewBox?: { x: number; y: number; width: number; height: number } }) => (
                  <ThresholdLabel
                    viewBox={props.viewBox}
                    label={m.wfh_threshold_10_label()}
                    color="rgba(96,165,250,0.9)"
                    bg="rgba(96,165,250,0.15)"
                  />
                )}
              />
              <ReferenceLine
                x={T_25 * 100}
                stroke="rgba(245,158,11,0.7)"
                strokeDasharray="5 3"
                strokeWidth={1.5}
                label={(props: { viewBox?: { x: number; y: number; width: number; height: number } }) => (
                  <ThresholdLabel
                    viewBox={props.viewBox}
                    label={m.wfh_threshold_25_label()}
                    color="rgba(245,158,11,0.9)"
                    bg="rgba(245,158,11,0.12)"
                  />
                )}
              />
              <ReferenceLine
                x={T_49 * 100}
                stroke="rgba(168,85,247,0.7)"
                strokeDasharray="5 3"
                strokeWidth={1.5}
                label={(props: { viewBox?: { x: number; y: number; width: number; height: number } }) => (
                  <ThresholdLabel
                    viewBox={props.viewBox}
                    label={m.wfh_threshold_49_label()}
                    color="rgba(168,85,247,0.9)"
                    bg="rgba(168,85,247,0.12)"
                  />
                )}
              />

              {/* Current position line */}
              <ReferenceLine
                x={data[currentIdx]?.x}
                stroke="rgba(255,255,255,0.55)"
                strokeDasharray="6 4"
                strokeWidth={1.5}
              />

              {/* Optimal position line */}
              {optimalIdx !== currentIdx && (
                <ReferenceLine
                  x={data[optimalIdx]?.x}
                  stroke="var(--bt-success)"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  opacity={0.55}
                />
              )}

              {/* Net income area */}
              <Area
                type="monotone"
                dataKey="netIncome"
                fill="url(#wfh-net-grad)"
                stroke="var(--bt-success)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "var(--bt-success)",
                  stroke: "var(--bt-bg)",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />

              {/* NL Tax line */}
              <Line
                type="monotone"
                dataKey="nlTax"
                stroke="var(--bt-nl)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: "var(--bt-nl)", stroke: "var(--bt-bg)", strokeWidth: 2 }}
                opacity={0.85}
                isAnimationActive={false}
              />

              {/* BE Tax line */}
              {showBE && (
                <Line
                  type="monotone"
                  dataKey="beTax"
                  stroke="var(--bt-be)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 3,
                    fill: "var(--bt-be)",
                    stroke: "var(--bt-bg)",
                    strokeWidth: 2,
                  }}
                  opacity={0.85}
                  isAnimationActive={false}
                />
              )}

              {/* Current position dot */}
              {data[currentIdx] && (
                <ReferenceDot
                  x={data[currentIdx]!.x}
                  y={data[currentIdx]!.netIncome}
                  r={5}
                  fill="var(--bt-bg)"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth={2.5}
                />
              )}

              {/* Optimal position diamond */}
              {optimalIdx !== currentIdx && data[optimalIdx] && (
                <ReferenceDot
                  x={data[optimalIdx]!.x}
                  y={data[optimalIdx]!.netIncome}
                  r={0}
                  shape={(props: { cx?: number; cy?: number }) => {
                    const { cx, cy } = props;
                    if (cx == null || cy == null) return <g />;
                    return (
                      <polygon
                        points={`${cx},${cy - 8} ${cx + 6},${cy} ${cx},${cy + 8} ${cx - 6},${cy}`}
                        fill="var(--bt-success)"
                        opacity={0.9}
                      />
                    );
                  }}
                />
              )}

              {/* Scrubber cursor without tooltip box */}
              <Tooltip
                content={() => null}
                cursor={{ stroke: "rgba(255,255,255,0.3)", strokeWidth: 1 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

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

interface RatioTableProps {
  data: DataPoint[];
  currentIdx: number;
  optimalIdx: number;
  showBE: boolean;
}

function RatioTable({ data, currentIdx, optimalIdx, showBE }: RatioTableProps) {
  if (data.length === 0) return null;

  interface RowMeta {
    idx: number;
    threshold?: "90-norm" | "hybrid" | "kaderakkoord";
    isCurrent?: boolean;
    isOptimal?: boolean;
  }
  const seen = new Set<number>();
  const rows: RowMeta[] = [];

  function add(idx: number, extra: Partial<RowMeta> = {}) {
    if (seen.has(idx)) {
      const r = rows.find((x) => x.idx === idx);
      if (r) Object.assign(r, extra);
      return;
    }
    seen.add(idx);
    rows.push({ idx, ...extra });
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

  rows.sort((a, b) => a.idx - b.idx);

  return (
    <Table bordered hover responsive className="bt-wfh-table">
      <thead>
        <tr>
          <th>{m.wfh_be_split()}</th>
          <th className="text-end">{m.years_nl_tax()}</th>
          {showBE && <th className="text-end">{m.years_be_tax()}</th>}
          <th className="text-end">{m.years_total_tax()}</th>
          <th className="text-end">{m.years_net_income()}</th>
          <th className="text-end">{m.years_effective_rate()}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ idx, threshold, isCurrent, isOptimal }) => {
          const d = data[idx];
          if (!d) return null;
          const bePct = Math.round(d.beRatio * 100);
          const totalTax = d.nlTax + d.beTax;
          const gross = d.netIncome + totalTax;
          const rate = gross > 0 ? totalTax / gross : 0;
          const zone = getZone(d.beRatio);
          const rowClass = isCurrent ? "table-primary" : isOptimal ? "table-success" : undefined;

          return (
            <tr key={idx} className={rowClass}>
              <td className={`bt-wfh-table-cell bt-wfh-table-cell--${zone}`}>
                <span className="bt-wfh-table-ratio">{bePct}%</span>
                <span className="text-muted ms-2 small">
                  {d.nlDays}d NL / {d.beDays}d BE
                </span>
                {isCurrent && (
                  <Badge bg="primary" className="ms-2">
                    {m.years_active()}
                  </Badge>
                )}
                {isOptimal && !isCurrent && (
                  <Badge bg="success" className="ms-2">
                    {m.wfh_optimal()}
                  </Badge>
                )}
                {threshold === "90-norm" && (
                  <Badge className="ms-2 bt-wfh-badge-10">{m.wfh_threshold_10_label()}</Badge>
                )}
                {threshold === "hybrid" && (
                  <Badge className="ms-2 bt-wfh-badge-25">{m.wfh_threshold_25_label()}</Badge>
                )}
                {threshold === "kaderakkoord" && (
                  <Badge className="ms-2 bt-wfh-badge-49">{m.wfh_threshold_49_label()}</Badge>
                )}
              </td>
              <td className="text-end text-danger small">−{fmt(d.nlTax)}</td>
              {showBE && <td className="text-end text-danger small">−{fmt(d.beTax)}</td>}
              <td className="text-end text-danger fw-semibold">−{fmt(totalTax)}</td>
              <td className="text-end text-success fw-semibold">{fmt(d.netIncome)}</td>
              <td className="text-end text-muted small">{pct(rate)}</td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
