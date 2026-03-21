import { useEffect, useState } from "react";
import { Alert, Button, Col, Row, Stack } from "react-bootstrap";
import type { TaxResult } from "../tax/types";
import { getTotalWorkdays } from "../tax/workdays";
import * as m from "../paraglide/messages.js";
import { getLocale } from "../paraglide/runtime.js";

interface Props {
  result: TaxResult;
  onResetInputs: () => void;
}

const fmt = (n: number) =>
  n.toLocaleString(getLocale(), { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

const fmtSigned = (n: number) => {
  const abs = Math.abs(n).toLocaleString(getLocale(), {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
  return n >= 0 ? `+${abs}` : `−${abs}`;
};

export default function SummaryResult({ result, onResetInputs }: Props) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle");
  const { grossIncome, totalTax, netIncome, effectiveRateTotal, nl, be } = result;
  const withheldTaxNL = result.inputs.withheldTaxNL ?? 0;
  const nlBalance = withheldTaxNL - nl.netTaxNL;
  const netResult = nlBalance - (be?.netTaxBE ?? 0);
  const totalWorkdays = getTotalWorkdays(result.inputs);

  const nlPct = grossIncome > 0 ? (nl.netTaxNL / grossIncome) * 100 : 0;
  const bePct = grossIncome > 0 ? ((be?.netTaxBE ?? 0) / grossIncome) * 100 : 0;
  const netPct = 100 - nlPct - bePct;

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timer = window.setTimeout(() => setCopyStatus("idle"), 3000);
    return () => window.clearTimeout(timer);
  }, [copyStatus]);

  async function copySummary() {
    const lines = [
      `${m.app_title()} (${result.inputs.year})`,
      `${m.summary_gross_income()} ${fmt(grossIncome)}`,
      `${m.summary_dutch_tax()} ${fmt(nl.netTaxNL)}`,
      `${m.summary_belgian_tax()} ${fmt(be?.netTaxBE ?? 0)}`,
      `${m.summary_total_tax()} ${fmt(totalTax)}`,
      `${m.summary_net_income()} ${fmt(netIncome)}`,
      `${m.summary_effective_rate_total()} ${pct(effectiveRateTotal)}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(lines);
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <div className="bt-summary">
      {/* Actions */}
      <Stack direction="horizontal" gap={2} className="mb-3">
        <Button variant="outline-primary" size="sm" onClick={() => void copySummary()}>
          <i className="bi bi-clipboard me-1" />
          {m.summary_copy()}
        </Button>
        <Button variant="outline-secondary" size="sm" onClick={onResetInputs}>
          <i className="bi bi-arrow-counterclockwise me-1" />
          {m.summary_reset()}
        </Button>
      </Stack>

      {copyStatus === "success" && (
        <Alert variant="success" className="py-2 mb-3">
          {m.summary_copy_success()}
        </Alert>
      )}
      {copyStatus === "error" && (
        <Alert variant="warning" className="py-2 mb-3">
          {m.summary_copy_error()}
        </Alert>
      )}

      {/* Hero: net income */}
      <div className="bt-summary-hero">
        <div className="bt-summary-hero__eyebrow">
          {m.summary_net_income()} · {result.inputs.year}
        </div>
        {/* key={netIncome} remounts the element on change, re-triggering the CSS animation */}
        <div className="bt-summary-hero__amount" key={netIncome}>
          {fmt(netIncome)}
        </div>
        <div className="bt-summary-hero__sub">
          {pct(1 - effectiveRateTotal)} net &middot; {pct(effectiveRateTotal)} tax
        </div>
      </div>

      {/* Allocation bar */}
      <div className="bt-alloc">
        <div className="bt-alloc__bar" role="img" aria-label={m.summary_allocation()}>
          <div
            className="bt-alloc__seg bt-alloc__seg--net"
            style={{ width: `${netPct}%` }}
            title={`${m.summary_net_label()} ${pct(netPct / 100)}`}
          >
            {netPct > 18 && (
              <span className="bt-alloc__seg-label">{pct(netPct / 100)}</span>
            )}
          </div>
          <div
            className="bt-alloc__seg bt-alloc__seg--nl"
            style={{ width: `${nlPct}%` }}
            title={`🇳🇱 ${m.summary_dutch_tax()} ${pct(nlPct / 100)}`}
          >
            {nlPct > 10 && (
              <span className="bt-alloc__seg-label">{pct(nlPct / 100)}</span>
            )}
          </div>
          {bePct > 0 && (
            <div
              className="bt-alloc__seg bt-alloc__seg--be"
              style={{ width: `${bePct}%` }}
              title={`🇧🇪 ${m.summary_belgian_tax()} ${pct(bePct / 100)}`}
            >
              {bePct > 8 && (
                <span className="bt-alloc__seg-label">{pct(bePct / 100)}</span>
              )}
            </div>
          )}
        </div>

        <div className="bt-alloc__legend">
          <div className="bt-alloc__legend-item">
            <span className="bt-alloc__legend-dot bt-alloc__legend-dot--net" />
            <span className="bt-alloc__legend-label">{m.summary_net_label()}</span>
            <span className="bt-alloc__legend-value text-success">{fmt(netIncome)}</span>
          </div>
          <div className="bt-alloc__legend-item">
            <span className="bt-alloc__legend-dot bt-alloc__legend-dot--nl" />
            <span className="bt-alloc__legend-label">🇳🇱 {m.summary_dutch_tax()}</span>
            <span className="bt-alloc__legend-value text-danger">−{fmt(nl.netTaxNL)}</span>
          </div>
          {be && be.netTaxBE > 0 && (
            <div className="bt-alloc__legend-item">
              <span className="bt-alloc__legend-dot bt-alloc__legend-dot--be" />
              <span className="bt-alloc__legend-label">🇧🇪 {m.summary_belgian_tax()}</span>
              <span className="bt-alloc__legend-value text-danger">−{fmt(be.netTaxBE)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Compact tax breakdown */}
      <div className="bt-breakdown">
        <div className="bt-breakdown__row">
          <span className="bt-breakdown__label">{m.summary_gross_income()}</span>
          <span className="bt-breakdown__value">{fmt(grossIncome)}</span>
        </div>
        <div className="bt-breakdown__row">
          <span className="bt-breakdown__label">🇳🇱 {m.summary_dutch_tax()}</span>
          <span className="bt-breakdown__value text-danger">−{fmt(nl.netTaxNL)}</span>
        </div>
        {be && be.netTaxBE > 0 && (
          <div className="bt-breakdown__row">
            <span className="bt-breakdown__label">🇧🇪 {m.summary_belgian_tax()}</span>
            <span className="bt-breakdown__value text-danger">−{fmt(be.netTaxBE)}</span>
          </div>
        )}
        <div className="bt-breakdown__row bt-breakdown__row--total">
          <span className="bt-breakdown__label bt-breakdown__label--strong">
            {m.summary_total_tax()}
          </span>
          <span className="bt-breakdown__value text-danger bt-breakdown__label--strong">
            −{fmt(totalTax)}
          </span>
        </div>
        <div className="bt-breakdown__row bt-breakdown__row--muted">
          <span className="bt-breakdown__label">{m.summary_effective_rate_total()}</span>
          <span className="bt-breakdown__value">{pct(effectiveRateTotal)}</span>
        </div>
      </div>

      {/* Stat cards */}
      <Row className="mt-3 text-center g-3">
        <Col>
          <div className="bt-stat-card">
            <div className="text-muted small">{m.summary_net_monthly()}</div>
            <div className="fs-5 fw-bold text-success">{fmt(netIncome / 12)}</div>
          </div>
        </Col>
        <Col>
          <div className="bt-stat-card">
            <div className="text-muted small">{m.summary_effective_rate()}</div>
            <div className="fs-5 fw-bold">{pct(effectiveRateTotal)}</div>
          </div>
        </Col>
        <Col>
          <div className="bt-stat-card">
            <div className="text-muted small">{m.summary_net_daily()}</div>
            <div className="fs-5 fw-bold text-success">
              {totalWorkdays > 0 ? fmt(netIncome / totalWorkdays) : "—"}
            </div>
          </div>
        </Col>
      </Row>

      {/* Fiscal balance (if NL tax was withheld) */}
      {withheldTaxNL > 0 && (
        <div className="mt-4">
          <h6 className="mb-3">{m.summary_eindafrekening()}</h6>

          <div className="bt-breakdown">
            <div className="bt-breakdown__row">
              <span className="bt-breakdown__label">🇳🇱 {m.summary_withheld_nl()}</span>
              <span className="bt-breakdown__value">{fmt(withheldTaxNL)}</span>
            </div>
            <div className="bt-breakdown__row">
              <span className="bt-breakdown__label">🇳🇱 {m.summary_nl_owed()}</span>
              <span className="bt-breakdown__value text-danger">−{fmt(nl.netTaxNL)}</span>
            </div>
            <div
              className={`bt-breakdown__row ${nlBalance >= 0 ? "bt-breakdown__row--ok" : "bt-breakdown__row--warn"}`}
            >
              <span className="bt-breakdown__label bt-breakdown__label--strong">
                🇳🇱 {m.summary_nl_balance()}
              </span>
              <span
                className={`bt-breakdown__value bt-breakdown__label--strong ${nlBalance >= 0 ? "text-success" : "text-danger"}`}
              >
                {fmtSigned(nlBalance)}
              </span>
            </div>
            {be && be.netTaxBE > 0 && (
              <div className="bt-breakdown__row">
                <span className="bt-breakdown__label">🇧🇪 {m.summary_be_owed()}</span>
                <span className="bt-breakdown__value text-danger">−{fmt(be.netTaxBE)}</span>
              </div>
            )}
          </div>

          <div className={`bt-balance ${netResult >= 0 ? "bt-balance--refund" : "bt-balance--owe"}`}>
            <div className="bt-balance__label">
              <i
                className={`bi bi-${netResult >= 0 ? "arrow-down-circle-fill" : "arrow-up-circle-fill"} me-2`}
              />
              {m.summary_net_result()}
            </div>
            <div className="bt-balance__amount">{fmtSigned(netResult)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
