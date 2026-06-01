import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Table } from "react-bootstrap";
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

const W = 600;
const H = 300;
const PAD = { top: 32, right: 24, bottom: 52, left: 76 };
const CW = W - PAD.left - PAD.right;
const CH = H - PAD.top - PAD.bottom;

const SNAP_RADIUS = 3;

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

function snapToKnown(idx: number, snapPoints: number[]): number {
  let best: number | null = null;
  let bestDist = SNAP_RADIUS + 1;
  for (const pt of snapPoints) {
    const dist = Math.abs(idx - pt);
    if (dist <= SNAP_RADIUS && dist < bestDist) {
      best = pt;
      bestDist = dist;
    }
  }
  return best ?? idx;
}

export default function WFHRatioChart({ inputs }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [tableOpen, setTableOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const scrubToRef = useRef<(clientX: number) => void>(() => {});

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

  const snapPoints = useMemo(
    () =>
      [
        ...new Set([
          Math.round(T_90 * (STEPS - 1)),
          Math.round(T_25 * (STEPS - 1)),
          Math.round(T_49 * (STEPS - 1)),
          currentIdx,
          optimalIdx,
        ]),
      ],
    [currentIdx, optimalIdx],
  );

  const yMin = useMemo(
    () => Math.min(0, ...data.map((d) => Math.min(d.netIncome, d.nlTax, d.beTax))),
    [data],
  );
  const yMax = useMemo(() => Math.max(...data.map((d) => d.netIncome)), [data]);
  const yPad = (yMax - yMin) * 0.12;
  const yLow = yMin - yPad;
  const yHigh = yMax + yPad;

  const xOf = (r: number) => PAD.left + r * CW;
  const xIdx = (i: number) => xOf(i / (STEPS - 1));
  const yOf = (v: number) => PAD.top + CH - ((v - yLow) / (yHigh - yLow)) * CH;

  const polyline = (key: keyof DataPoint) =>
    data
      .map(
        (d, i) => `${i === 0 ? "M" : "L"}${xIdx(i).toFixed(1)},${yOf(d[key] as number).toFixed(1)}`,
      )
      .join(" ");

  const areaPath = data.length
    ? `${polyline("netIncome")} L${xIdx(STEPS - 1).toFixed(1)},${(PAD.top + CH).toFixed(1)} L${xIdx(0).toFixed(1)},${(PAD.top + CH).toFixed(1)} Z`
    : "";

  const Y_TICKS = 5;
  const yTicks = Array.from(
    { length: Y_TICKS + 1 },
    (_, i) => yLow + (i / Y_TICKS) * (yHigh - yLow),
  );

  const showBE = inputs.residentCountry === "BE";
  const hp = hovered !== null ? (data[hovered] ?? null) : null;
  const displayPoint = hp ?? data[currentIdx] ?? null;
  const isHovering = hp !== null;

  const currentNet = data[currentIdx]?.netIncome ?? 0;
  const optimalNet = data[optimalIdx]?.netIncome ?? 0;
  const delta = optimalNet - currentNet;
  const currentZone = getZone(currentBeRatio);

  const x90 = xOf(T_90);
  const x25 = xOf(T_25);
  const x49 = xOf(T_49);
  const xCur = xIdx(currentIdx);
  const xOpt = xIdx(optimalIdx);

  // Unified pointer handler — shared by mouse and touch
  function scrubTo(clientX: number) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const idx = Math.round(
      (((clientX - rect.left) * (W / rect.width) - PAD.left) / CW) * (STEPS - 1),
    );
    setHovered(snapToKnown(Math.max(0, Math.min(STEPS - 1, idx)), snapPoints));
  }
  scrubToRef.current = scrubTo;

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    scrubTo(e.clientX);
  }

  // Attach touch listener non-passively so preventDefault() suppresses scroll
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) scrubToRef.current(touch.clientX);
    }
    function onTouchEnd() {
      setHovered(null);
    }
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

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
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="bt-wfh-svg"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHovered(null)}
          aria-label={m.wfh_title()}
        >
          <defs>
            <linearGradient id="wfh-net-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--bt-success)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--bt-success)" stopOpacity="0.01" />
            </linearGradient>
            <filter id="wfh-glow" x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <clipPath id="wfh-clip">
              <rect x={PAD.left} y={PAD.top} width={CW} height={CH} />
            </clipPath>
          </defs>

          {/* ── Zone backgrounds ──────────────────────────────────────── */}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={x90 - PAD.left}
            height={CH}
            className="bt-wfh-zone bt-wfh-zone--full"
          />
          <rect
            x={x90}
            y={PAD.top}
            width={x25 - x90}
            height={CH}
            className="bt-wfh-zone bt-wfh-zone--hybrid"
          />
          <rect
            x={x25}
            y={PAD.top}
            width={x49 - x25}
            height={CH}
            className="bt-wfh-zone bt-wfh-zone--kaderakkoord"
          />
          <rect
            x={x49}
            y={PAD.top}
            width={W - PAD.right - x49}
            height={CH}
            className="bt-wfh-zone bt-wfh-zone--above"
          />

          {/* Zone top-edge accents */}
          <line x1={PAD.left} x2={x90} y1={PAD.top} y2={PAD.top} className="bt-wfh-zone-edge bt-wfh-zone-edge--full" />
          <line x1={x90} x2={x25} y1={PAD.top} y2={PAD.top} className="bt-wfh-zone-edge bt-wfh-zone-edge--hybrid" />
          <line x1={x25} x2={x49} y1={PAD.top} y2={PAD.top} className="bt-wfh-zone-edge bt-wfh-zone-edge--kaderakkoord" />
          <line x1={x49} x2={W - PAD.right} y1={PAD.top} y2={PAD.top} className="bt-wfh-zone-edge bt-wfh-zone-edge--above" />

          {/* ── Y grid + labels ───────────────────────────────────────── */}
          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={PAD.left} x2={W - PAD.right} y1={yOf(v)} y2={yOf(v)} className="bt-wfh-grid" />
              <text x={PAD.left - 8} y={yOf(v)} textAnchor="end" dominantBaseline="middle" className="bt-wfh-axis-label">
                {fmtK(v)}
              </text>
            </g>
          ))}

          {/* ── X axis ────────────────────────────────────────────────── */}
          {[0, 10, 25, 50, 75, 100].map((p) => (
            <text key={p} x={xOf(p / 100)} y={H - PAD.bottom + 16} textAnchor="middle" className="bt-wfh-axis-label">
              {p}%
            </text>
          ))}
          <text x={PAD.left + CW / 2} y={H - 6} textAnchor="middle" className="bt-wfh-axis-title">
            {m.wfh_x_label()}
          </text>

          {/* ── Threshold lines + chips ────────────────────────────────── */}
          <line x1={x90} x2={x90} y1={PAD.top} y2={H - PAD.bottom} className="bt-wfh-threshold bt-wfh-threshold--10" />
          <line x1={x25} x2={x25} y1={PAD.top} y2={H - PAD.bottom} className="bt-wfh-threshold bt-wfh-threshold--25" />
          <line x1={x49} x2={x49} y1={PAD.top} y2={H - PAD.bottom} className="bt-wfh-threshold bt-wfh-threshold--49" />

          <g transform={`translate(${x90 + 4}, ${PAD.top + 4})`}>
            <rect rx="3" ry="3" width="44" height="14" className="bt-wfh-chip-bg bt-wfh-chip-bg--10" />
            <text x="22" y="7" textAnchor="middle" dominantBaseline="middle" className="bt-wfh-chip-text bt-wfh-chip-text--10">
              {m.wfh_threshold_10_label()}
            </text>
          </g>
          <g transform={`translate(${x25 + 4}, ${PAD.top + 4})`}>
            <rect rx="3" ry="3" width="44" height="14" className="bt-wfh-chip-bg bt-wfh-chip-bg--25" />
            <text x="22" y="7" textAnchor="middle" dominantBaseline="middle" className="bt-wfh-chip-text bt-wfh-chip-text--25">
              {m.wfh_threshold_25_label()}
            </text>
          </g>
          <g transform={`translate(${x49 + 4}, ${PAD.top + 4})`}>
            <rect rx="3" ry="3" width="44" height="14" className="bt-wfh-chip-bg bt-wfh-chip-bg--49" />
            <text x="22" y="7" textAnchor="middle" dominantBaseline="middle" className="bt-wfh-chip-text bt-wfh-chip-text--49">
              {m.wfh_threshold_49_label()}
            </text>
          </g>

          {/* ── Area fill + data lines ─────────────────────────────────── */}
          <g clipPath="url(#wfh-clip)">
            <path d={areaPath} fill="url(#wfh-net-grad)" />
            <path d={polyline("netIncome")} fill="none" className="bt-wfh-line bt-wfh-line--net" filter="url(#wfh-glow)" />
            <path d={polyline("nlTax")} fill="none" className="bt-wfh-line bt-wfh-line--nl" />
            {showBE && (
              <path d={polyline("beTax")} fill="none" className="bt-wfh-line bt-wfh-line--be" />
            )}
          </g>

          {/* ── Optimal marker ────────────────────────────────────────── */}
          {optimalIdx !== currentIdx && data[optimalIdx] && (
            <>
              <line x1={xOpt} x2={xOpt} y1={PAD.top} y2={H - PAD.bottom} className="bt-wfh-optimal" />
              <polygon
                points={`${xOpt},${yOf(optimalNet) - 8} ${xOpt + 6},${yOf(optimalNet)} ${xOpt},${yOf(optimalNet) + 8} ${xOpt - 6},${yOf(optimalNet)}`}
                className="bt-wfh-optimal-diamond"
              />
            </>
          )}

          {/* ── Current position ──────────────────────────────────────── */}
          <line x1={xCur} x2={xCur} y1={PAD.top} y2={H - PAD.bottom} className="bt-wfh-current" />
          {data[currentIdx] && (
            <>
              <circle cx={xCur} cy={yOf(data[currentIdx]!.netIncome)} r="10" className="bt-wfh-pulse" />
              <circle cx={xCur} cy={yOf(data[currentIdx]!.netIncome)} r="5" className="bt-wfh-current-dot" />
            </>
          )}

          {/* ── Hover scrubber ────────────────────────────────────────── */}
          {hovered !== null && hovered !== currentIdx && data[hovered] && (
            <>
              <line x1={xIdx(hovered)} x2={xIdx(hovered)} y1={PAD.top} y2={H - PAD.bottom} className="bt-wfh-scrubber" />
              <circle cx={xIdx(hovered)} cy={yOf(data[hovered]!.netIncome)} r={4} className="bt-wfh-dot bt-wfh-dot--net" />
              <circle cx={xIdx(hovered)} cy={yOf(data[hovered]!.nlTax)} r={3} className="bt-wfh-dot bt-wfh-dot--nl" />
              {showBE && (
                <circle cx={xIdx(hovered)} cy={yOf(data[hovered]!.beTax)} r={3} className="bt-wfh-dot bt-wfh-dot--be" />
              )}
            </>
          )}
        </svg>

        {/* ── Legend — directly below chart, above readout ──────────── */}
        <div className="bt-year-chart__legend bt-wfh-legend">
          <span className="bt-year-chart__legend-item">
            <span className="bt-year-chart__legend-dot" style={{ background: "var(--bt-success)" }} />
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
              <span className={`bt-wfh-readout__label${isHovering ? "" : " bt-wfh-readout__label--current"}`}>
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
              <span className={`bt-wfh-readout__badge bt-wfh-readout__badge--${getZone(displayPoint.beRatio)}`}>
                {getZone(displayPoint.beRatio) === "full" && `✓ ${m.wfh_threshold_10_label()}`}
                {getZone(displayPoint.beRatio) === "hybrid" && `✓ ${m.wfh_threshold_25_label()} · ✗ hypo`}
                {getZone(displayPoint.beRatio) === "kaderakkoord" && `✓ ${m.wfh_threshold_49_label()} · A1`}
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
                  <Badge bg="primary" className="ms-2">{m.years_active()}</Badge>
                )}
                {isOptimal && !isCurrent && (
                  <Badge bg="success" className="ms-2">{m.wfh_optimal()}</Badge>
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
