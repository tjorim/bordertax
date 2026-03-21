import { useMemo, useRef, useState } from "react";
import { Badge, Table } from "react-bootstrap";
import { calculate } from "../tax";
import type { TaxInputs } from "../tax/types";
import * as m from "../paraglide/messages.js";
import { fmt, pct } from "./format.js";

interface Props {
  inputs: TaxInputs;
}

interface DataPoint {
  beRatio: number; // 0–1 fraction of (NL+BE) days that are BE
  beDays: number;
  nlDays: number;
  netIncome: number;
  nlTax: number;
  beTax: number;
}

const STEPS = 101; // 0 % to 100 % in 1 % steps

/** ≤ 10% BE days → ≥ 90% NL income → qualifies for hypotheekrenteaftrek / kwalificerende buitenlandse belastingplichtige */
const THRESHOLD_90_NORM = 0.10;

/** ≤ 25% BE days → NL retains sole income-tax & social-security sourcing (NL-BE hybrid-work agreement 2023) */
const THRESHOLD_HYBRID = 0.25;

// SVG layout constants
const W = 600;
const H = 310;
const PAD = { top: 28, right: 24, bottom: 52, left: 76 };
const CW = W - PAD.left - PAD.right; // chart width
const CH = H - PAD.top - PAD.bottom; // chart height

function fmtK(n: number): string {
  if (Math.abs(n) >= 1000) return `€${Math.round(n / 1000)}k`;
  return `€${Math.round(n)}`;
}

export default function WFHRatioChart({ inputs }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const nlbeDays = inputs.daysWorkedNL + inputs.daysWorkedBE;

  const data = useMemo<DataPoint[]>(() => {
    if (nlbeDays === 0) return [];
    return Array.from({ length: STEPS }, (_, i) => {
      const beRatio = i / (STEPS - 1);
      const beDays = Math.round(beRatio * nlbeDays);
      const nlDays = nlbeDays - beDays;
      const result = calculate({
        ...inputs,
        daysWorkedNL: nlDays,
        daysWorkedBE: beDays,
      });
      return {
        beRatio,
        beDays,
        nlDays,
        netIncome: result.netIncome,
        nlTax: result.nl.netTaxNL,
        beTax: result.be?.netTaxBE ?? 0,
      };
    });
  }, [inputs, nlbeDays]);

  // Current position in the sweep
  const currentBeRatio = nlbeDays > 0 ? inputs.daysWorkedBE / nlbeDays : 0;
  const currentIdx = Math.round(currentBeRatio * (STEPS - 1));

  // Index of maximum net income
  const optimalIdx = useMemo(() => {
    if (data.length === 0) return 0;
    let best = 0;
    for (let i = 1; i < data.length; i++) {
      if ((data[i]?.netIncome ?? 0) > (data[best]?.netIncome ?? 0)) best = i;
    }
    return best;
  }, [data]);

  // Y axis bounds
  const yMin = useMemo(
    () => Math.min(0, ...data.map((d) => Math.min(d.netIncome, d.nlTax, d.beTax))),
    [data],
  );
  const yMax = useMemo(() => Math.max(...data.map((d) => d.netIncome)), [data]);
  const yPad = (yMax - yMin) * 0.1;
  const yLow = yMin - yPad;
  const yHigh = yMax + yPad;

  // Coordinate helpers
  const xOf = (ratio: number) => PAD.left + ratio * CW;
  const xOfIdx = (i: number) => xOf(i / (STEPS - 1));
  const yOf = (v: number) => PAD.top + CH - ((v - yLow) / (yHigh - yLow)) * CH;

  function polyline(key: keyof DataPoint): string {
    return data
      .map(
        (d, i) =>
          `${i === 0 ? "M" : "L"}${xOfIdx(i).toFixed(1)},${yOf(d[key] as number).toFixed(1)}`,
      )
      .join(" ");
  }

  // Y axis ticks
  const Y_TICKS = 5;
  const yTicks = Array.from(
    { length: Y_TICKS + 1 },
    (_, i) => yLow + (i / Y_TICKS) * (yHigh - yLow),
  );

  const showBE = inputs.residentCountry === "BE";
  const hp = hovered !== null ? data[hovered] : null;

  // Delta: current vs optimal net income
  const currentNet = data[currentIdx]?.netIncome ?? 0;
  const optimalNet = data[optimalIdx]?.netIncome ?? 0;
  const delta = optimalNet - currentNet;

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = W / rect.width;
    const ratio = (e.clientX - rect.left) * scaleX;
    const idx = Math.round(((ratio - PAD.left) / CW) * (STEPS - 1));
    setHovered(Math.max(0, Math.min(STEPS - 1, idx)));
  }

  // Zone status for hovered point
  function zoneStatus(beRatio: number): "full-benefits" | "hybrid-safe" | "above-hybrid" {
    if (beRatio <= THRESHOLD_90_NORM) return "full-benefits";
    if (beRatio <= THRESHOLD_HYBRID) return "hybrid-safe";
    return "above-hybrid";
  }

  if (nlbeDays === 0) {
    return (
      <div>
        <h6 className="text-muted mb-1">{m.wfh_title()}</h6>
        <p className="text-muted small">{m.input_workdays_total_zero_warning()}</p>
      </div>
    );
  }

  const x10 = xOf(THRESHOLD_90_NORM);
  const x25 = xOf(THRESHOLD_HYBRID);
  const xCurrent = xOfIdx(currentIdx);
  const xOptimal = xOfIdx(optimalIdx);
  const currentZone = zoneStatus(currentBeRatio);

  return (
    <div>
      <h6 className="text-muted mb-1">{m.wfh_title()}</h6>
      <p className="text-muted small mb-3">{m.wfh_description()}</p>

      <div className="bt-wfh-wrap">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="bt-wfh-svg"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHovered(null)}
          role="img"
          aria-label={m.wfh_title()}
        >
          {/* ── Background zones ─────────────────────────────────────── */}
          {/* Zone 1: 0–10 % — full Dutch benefits */}
          <rect x={PAD.left} y={PAD.top} width={x10 - PAD.left} height={CH}
            className="bt-wfh-zone bt-wfh-zone--full" />
          {/* Zone 2: 10–25 % — hybrid-safe but no mortgage deduction */}
          <rect x={x10} y={PAD.top} width={x25 - x10} height={CH}
            className="bt-wfh-zone bt-wfh-zone--hybrid" />
          {/* Zone 3: 25–100 % — Belgian income tax applies */}
          <rect x={x25} y={PAD.top} width={W - PAD.right - x25} height={CH}
            className="bt-wfh-zone bt-wfh-zone--above" />

          {/* ── Y grid + labels ──────────────────────────────────────── */}
          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={PAD.left} x2={W - PAD.right} y1={yOf(v)} y2={yOf(v)}
                className="bt-wfh-grid" />
              <text x={PAD.left - 8} y={yOf(v)} textAnchor="end" dominantBaseline="middle"
                className="bt-wfh-axis-label">
                {fmtK(v)}
              </text>
            </g>
          ))}

          {/* ── X axis tick labels ───────────────────────────────────── */}
          {[0, 10, 25, 50, 75, 100].map((p) => (
            <text key={p} x={xOf(p / 100)} y={H - PAD.bottom + 16}
              textAnchor="middle" className="bt-wfh-axis-label">
              {p}%
            </text>
          ))}

          {/* ── X axis title ─────────────────────────────────────────── */}
          <text x={PAD.left + CW / 2} y={H - 6} textAnchor="middle"
            className="bt-wfh-axis-title">
            {m.wfh_x_label()}
          </text>

          {/* ── 90%-norm threshold (10 % BE) ─────────────────────────── */}
          <line x1={x10} x2={x10} y1={PAD.top} y2={H - PAD.bottom}
            className="bt-wfh-threshold bt-wfh-threshold--10" />
          <text x={x10 + 4} y={PAD.top + 12}
            className="bt-wfh-threshold-label bt-wfh-threshold-label--10">
            {m.wfh_threshold_10_label()}
          </text>

          {/* ── 25 % hybrid-work threshold ───────────────────────────── */}
          <line x1={x25} x2={x25} y1={PAD.top} y2={H - PAD.bottom}
            className="bt-wfh-threshold bt-wfh-threshold--25" />
          <text x={x25 + 4} y={PAD.top + 12}
            className="bt-wfh-threshold-label bt-wfh-threshold-label--25">
            {m.wfh_threshold_25_label()}
          </text>

          {/* ── Data lines ───────────────────────────────────────────── */}
          <path d={polyline("netIncome")} fill="none"
            className="bt-wfh-line bt-wfh-line--net" />
          <path d={polyline("nlTax")} fill="none"
            className="bt-wfh-line bt-wfh-line--nl" />
          {showBE && (
            <path d={polyline("beTax")} fill="none"
              className="bt-wfh-line bt-wfh-line--be" />
          )}

          {/* ── Optimal net income marker ────────────────────────────── */}
          {optimalIdx !== currentIdx && (
            <>
              <line x1={xOptimal} x2={xOptimal} y1={PAD.top} y2={H - PAD.bottom}
                className="bt-wfh-optimal" />
              <polygon
                points={`${xOptimal},${yOf(optimalNet) - 7} ${xOptimal + 5},${yOf(optimalNet)} ${xOptimal},${yOf(optimalNet) + 7} ${xOptimal - 5},${yOf(optimalNet)}`}
                className="bt-wfh-optimal-diamond" />
            </>
          )}

          {/* ── Current position marker ──────────────────────────────── */}
          <line x1={xCurrent} x2={xCurrent} y1={PAD.top} y2={H - PAD.bottom}
            className="bt-wfh-current" />
          {data[currentIdx] && (
            <circle cx={xCurrent} cy={yOf(data[currentIdx].netIncome)} r={5}
              className="bt-wfh-current-dot" />
          )}

          {/* ── Hover scrubber ───────────────────────────────────────── */}
          {hovered !== null && hovered !== currentIdx && data[hovered] && (
            <>
              <line x1={xOfIdx(hovered)} x2={xOfIdx(hovered)}
                y1={PAD.top} y2={H - PAD.bottom} className="bt-wfh-scrubber" />
              <circle cx={xOfIdx(hovered)} cy={yOf(data[hovered]!.netIncome)}
                r={4} className="bt-wfh-dot bt-wfh-dot--net" />
              <circle cx={xOfIdx(hovered)} cy={yOf(data[hovered]!.nlTax)}
                r={3} className="bt-wfh-dot bt-wfh-dot--nl" />
              {showBE && (
                <circle cx={xOfIdx(hovered)} cy={yOf(data[hovered]!.beTax)}
                  r={3} className="bt-wfh-dot bt-wfh-dot--be" />
              )}
            </>
          )}
        </svg>

        {/* ── Readout bar ───────────────────────────────────────────── */}
        <div className={`bt-wfh-readout${hp ? " bt-wfh-readout--visible" : ""}`}>
          {hp ? (
            <>
              <span className="bt-wfh-readout__ratio">
                🏢&nbsp;{Math.round((1 - hp.beRatio) * 100)}%&nbsp;NL
                &nbsp;·&nbsp;
                🏠&nbsp;{Math.round(hp.beRatio * 100)}%&nbsp;BE
                <span className="text-muted ms-2 fw-normal">
                  ({hp.nlDays}d&nbsp;/&nbsp;{hp.beDays}d)
                </span>
              </span>
              <span className="bt-wfh-readout__item bt-wfh-readout__item--net">
                {m.summary_net_income()}&nbsp;{fmt(hp.netIncome)}
              </span>
              <span className="bt-wfh-readout__item bt-wfh-readout__item--nl">
                🇳🇱&nbsp;−{fmt(hp.nlTax)}
              </span>
              {showBE && (
                <span className="bt-wfh-readout__item bt-wfh-readout__item--be">
                  🇧🇪&nbsp;−{fmt(hp.beTax)}
                </span>
              )}
              {zoneStatus(hp.beRatio) === "full-benefits" && (
                <span className="bt-wfh-readout__badge bt-wfh-readout__badge--full">
                  ✓ {m.wfh_threshold_10_label()}
                </span>
              )}
              {zoneStatus(hp.beRatio) === "hybrid-safe" && (
                <span className="bt-wfh-readout__badge bt-wfh-readout__badge--hybrid">
                  ✓ {m.wfh_threshold_25_label()} · {m.wfh_threshold_10_hint()}
                </span>
              )}
              {zoneStatus(hp.beRatio) === "above-hybrid" && (
                <span className="bt-wfh-readout__badge bt-wfh-readout__badge--above">
                  {m.wfh_threshold_25_hint()}
                </span>
              )}
            </>
          ) : (
            <span className="text-muted small">{m.wfh_description()}</span>
          )}
        </div>

        {/* ── Current position status pill ─────────────────────────── */}
        <div className={`bt-wfh-status bt-wfh-status--${currentZone}`}>
          <span className="bt-wfh-status__ratio">
            🏠 {Math.round(currentBeRatio * 100)}% BE
            &nbsp;({inputs.daysWorkedBE}d)
          </span>
          {currentZone === "full-benefits" && (
            <span>✓ Qualifies for hypotheekrenteaftrek &amp; full NL deductions</span>
          )}
          {currentZone === "hybrid-safe" && (
            <span>✓ Within 25% hybrid rule &nbsp;·&nbsp; ✗ Above 90%-norm — no hypotheekrenteaftrek</span>
          )}
          {currentZone === "above-hybrid" && (
            <span>✗ Above 25% hybrid rule — Belgian income tax applies &nbsp;·&nbsp; ✗ No hypotheekrenteaftrek</span>
          )}
        </div>

        {/* ── Delta callout: how much moving to optimal would gain ─── */}
        {delta > 50 && data[optimalIdx] && (
          <div className="bt-wfh-delta">
            <i className="bi bi-arrow-up-circle me-1" />
            {m.wfh_optimal()}&nbsp;
            ({Math.round(data[optimalIdx]!.beRatio * 100)}%&nbsp;BE) adds{" "}
            <strong>{fmt(delta)}</strong>/year vs. current
          </div>
        )}

        {/* ── Legend ───────────────────────────────────────────────── */}
        <div className="bt-year-chart__legend mt-2">
          <span className="bt-year-chart__legend-item">
            <span className="bt-year-chart__legend-dot"
              style={{ background: "var(--bt-success)" }} />
            {m.summary_net_income()}
          </span>
          <span className="bt-year-chart__legend-item">
            <span className="bt-year-chart__legend-dot"
              style={{ background: "var(--bt-nl)" }} />
            🇳🇱 {m.summary_dutch_tax()}
          </span>
          {showBE && (
            <span className="bt-year-chart__legend-item">
              <span className="bt-year-chart__legend-dot"
                style={{ background: "var(--bt-be)" }} />
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

        {/* ── Detail table ─────────────────────────────────────────── */}
        <TableSection
          data={data}
          currentIdx={currentIdx}
          optimalIdx={optimalIdx}
          showBE={showBE}
          nlbeDays={nlbeDays}
        />
      </div>
    </div>
  );
}

// ─── Table sub-component ────────────────────────────────────────────────────

interface TableRow {
  idx: number;
  isThreshold?: "90-norm" | "hybrid";
  isCurrent?: boolean;
  isOptimal?: boolean;
}

interface TableSectionProps {
  data: DataPoint[];
  currentIdx: number;
  optimalIdx: number;
  showBE: boolean;
  nlbeDays: number;
}

function TableSection({ data, currentIdx, optimalIdx, showBE, nlbeDays }: TableSectionProps) {
  if (data.length === 0) return null;

  // Build ordered unique rows: fixed breakpoints + current + optimal
  const seen = new Set<number>();
  const rows: TableRow[] = [];

  function addRow(idx: number, extra: Partial<TableRow> = {}) {
    if (seen.has(idx)) {
      // Merge labels onto existing row
      const existing = rows.find((r) => r.idx === idx);
      if (existing) Object.assign(existing, extra);
      return;
    }
    seen.add(idx);
    rows.push({ idx, ...extra });
  }

  addRow(0);
  addRow(Math.round(THRESHOLD_90_NORM * (STEPS - 1)), { isThreshold: "90-norm" });
  addRow(Math.round(THRESHOLD_HYBRID * (STEPS - 1)), { isThreshold: "hybrid" });
  addRow(currentIdx, { isCurrent: true });
  addRow(optimalIdx, { isOptimal: true });
  addRow(Math.round(0.5 * (STEPS - 1)));
  addRow(Math.round(0.75 * (STEPS - 1)));
  addRow(STEPS - 1);

  rows.sort((a, b) => a.idx - b.idx);

  return (
    <Table bordered hover responsive className="mt-3">
      <thead>
        <tr>
          <th>🏠 BE %</th>
          <th className="text-end">{m.years_nl_tax()}</th>
          {showBE && <th className="text-end">{m.years_be_tax()}</th>}
          <th className="text-end">{m.years_total_tax()}</th>
          <th className="text-end">{m.years_net_income()}</th>
          <th className="text-end">{m.years_effective_rate()}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ idx, isThreshold, isCurrent, isOptimal }) => {
          const d = data[idx];
          if (!d) return null;
          const bePct = Math.round(d.beRatio * 100);
          const nlDays = nlbeDays - d.beDays;
          const totalTax = d.nlTax + d.beTax;
          const grossIncome = d.netIncome + totalTax;
          const effectiveRate = grossIncome > 0 ? totalTax / grossIncome : 0;

          const rowClass = isCurrent
            ? "table-primary"
            : isOptimal
              ? "table-success"
              : undefined;

          return (
            <tr key={idx} className={rowClass}>
              <td>
                <span className="bt-wfh-table-ratio">
                  {bePct}%
                  <span className="text-muted ms-1 small">
                    ({nlDays}d&nbsp;NL / {d.beDays}d&nbsp;BE)
                  </span>
                </span>
                {isCurrent && (
                  <Badge bg="primary" className="ms-1">{m.years_active()}</Badge>
                )}
                {isOptimal && !isCurrent && (
                  <Badge bg="success" className="ms-1">{m.wfh_optimal()}</Badge>
                )}
                {isThreshold === "90-norm" && (
                  <Badge className="ms-1 bt-wfh-badge-10">{m.wfh_threshold_10_label()}</Badge>
                )}
                {isThreshold === "hybrid" && (
                  <Badge className="ms-1 bt-wfh-badge-25">{m.wfh_threshold_25_label()}</Badge>
                )}
              </td>
              <td className="text-end text-danger">−{fmt(d.nlTax)}</td>
              {showBE && (
                <td className="text-end text-danger">−{fmt(d.beTax)}</td>
              )}
              <td className="text-end text-danger fw-semibold">−{fmt(totalTax)}</td>
              <td className="text-end text-success fw-semibold">{fmt(d.netIncome)}</td>
              <td className="text-end">{pct(effectiveRate)}</td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
