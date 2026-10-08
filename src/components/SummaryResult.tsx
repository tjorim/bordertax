import { DistributionSegment } from "@/components/ui/distribution-segment";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CircleArrowDown, CircleArrowUp, Clipboard, RotateCcw } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import type { TaxResult } from "../tax/types";
import { getNLFractions, getTotalWorkdays } from "../tax/workdays";
import * as m from "../paraglide/messages.js";
import { fmt, fmtSigned, pct } from "./format.js";
import FilingChecklist from "./FilingChecklist";

interface Props {
  result: TaxResult;
  onResetInputs: () => void;
}

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
    const pad = (label: string, value: string) => `  ${label.padEnd(28, ".")} ${value}`;

    const lines = [
      `━━━ Bordertax · ${result.inputs.year} ━━━`,
      "",
      pad(m.summary_gross_income(), fmt(grossIncome)),
      pad(`🇳🇱 ${m.summary_dutch_tax()}`, `−${fmt(nl.netTaxNL)}`),
      ...(be && be.netTaxBE > 0
        ? [pad(`🇧🇪 ${m.summary_belgian_tax()}`, `−${fmt(be.netTaxBE)}`)]
        : []),
      pad(m.summary_total_tax(), `−${fmt(totalTax)}`),
      "  " + "─".repeat(38),
      pad(m.summary_net_income(), fmt(netIncome)),
      pad(m.summary_effective_rate_total(), pct(effectiveRateTotal)),
      pad(m.summary_net_monthly(), fmt(netIncome / 12)),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(lines);
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <div>
      {/* Actions */}
      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:mb-4">
        <Button variant="outline-primary" size="sm" onClick={() => void copySummary()}>
          <Clipboard
            aria-hidden="true"
            className="tw:inline tw:size-4 tw:shrink-0 tw:align-text-bottom tw:me-1"
          />
          {m.summary_copy()}
        </Button>
        <Button variant="outline-secondary" size="sm" onClick={onResetInputs}>
          <RotateCcw
            aria-hidden="true"
            className="tw:inline tw:size-4 tw:shrink-0 tw:align-text-bottom tw:me-1"
          />
          {m.summary_reset()}
        </Button>
      </div>

      {copyStatus === "success" && (
        <Alert variant="success" className="tw:py-2 tw:mb-4">
          {m.summary_copy_success()}
        </Alert>
      )}
      {copyStatus === "error" && (
        <Alert variant="warning" className="tw:py-2 tw:mb-4">
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
          <DistributionSegment
            className="bt-alloc__seg bt-alloc__seg--net"
            percent={netPct}
            title={`${m.summary_net_label()} ${pct(netPct / 100)}`}
          >
            {netPct > 18 && <span className="bt-alloc__seg-label">{pct(netPct / 100)}</span>}
          </DistributionSegment>
          <DistributionSegment
            className="bt-alloc__seg bt-alloc__seg--nl"
            percent={nlPct}
            title={`🇳🇱 ${m.summary_dutch_tax()} ${pct(nlPct / 100)}`}
          >
            {nlPct > 10 && <span className="bt-alloc__seg-label">{pct(nlPct / 100)}</span>}
          </DistributionSegment>
          {bePct > 0 && (
            <DistributionSegment
              className="bt-alloc__seg bt-alloc__seg--be"
              percent={bePct}
              title={`🇧🇪 ${m.summary_belgian_tax()} ${pct(bePct / 100)}`}
            >
              {bePct > 8 && <span className="bt-alloc__seg-label">{pct(bePct / 100)}</span>}
            </DistributionSegment>
          )}
        </div>

        <div className="bt-alloc__legend">
          <div className="bt-alloc__legend-item">
            <span className="bt-alloc__legend-dot bt-alloc__legend-dot--net" />
            <span className="bt-alloc__legend-label">{m.summary_net_label()}</span>
            <span className="bt-alloc__legend-value tw:text-success">{fmt(netIncome)}</span>
          </div>
          <div className="bt-alloc__legend-item">
            <span className="bt-alloc__legend-dot bt-alloc__legend-dot--nl" />
            <span className="bt-alloc__legend-label">🇳🇱 {m.summary_dutch_tax()}</span>
            <span className="bt-alloc__legend-value tw:text-danger">−{fmt(nl.netTaxNL)}</span>
          </div>
          {be && be.netTaxBE > 0 && (
            <div className="bt-alloc__legend-item">
              <span className="bt-alloc__legend-dot bt-alloc__legend-dot--be" />
              <span className="bt-alloc__legend-label">🇧🇪 {m.summary_belgian_tax()}</span>
              <span className="bt-alloc__legend-value tw:text-danger">−{fmt(be.netTaxBE)}</span>
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
          <span className="bt-breakdown__value tw:text-danger">−{fmt(nl.netTaxNL)}</span>
        </div>
        {be && be.netTaxBE > 0 && (
          <div className="bt-breakdown__row">
            <span className="bt-breakdown__label">🇧🇪 {m.summary_belgian_tax()}</span>
            <span className="bt-breakdown__value tw:text-danger">−{fmt(be.netTaxBE)}</span>
          </div>
        )}
        <div className="bt-breakdown__row bt-breakdown__row--total">
          <span className="bt-breakdown__label bt-breakdown__label--strong">
            {m.summary_total_tax()}
          </span>
          <span className="bt-breakdown__value tw:text-danger bt-breakdown__label--strong">
            −{fmt(totalTax)}
          </span>
        </div>
        <div className="bt-breakdown__row bt-breakdown__row--muted">
          <span className="bt-breakdown__label">{m.summary_effective_rate_total()}</span>
          <span className="bt-breakdown__value">{pct(effectiveRateTotal)}</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="tw:grid tw:grid-cols-12 tw:mt-4 tw:text-center tw:gap-4">
        <div className="tw:col-span-4">
          <div className="bt-stat-card">
            <div className="tw:text-text-muted tw:text-label tw:font-medium tw:uppercase tw:tracking-wide">
              {m.summary_net_monthly()}
            </div>
            <div className="tw:font-mono tw:text-stat tw:tracking-tight tw:font-bold tw:text-success">
              {fmt(netIncome / 12)}
            </div>
          </div>
        </div>
        <div className="tw:col-span-4">
          <div className="bt-stat-card">
            <div className="tw:text-text-muted tw:text-label tw:font-medium tw:uppercase tw:tracking-wide">
              {m.summary_effective_rate()}
            </div>
            <div className="tw:font-mono tw:text-stat tw:tracking-tight tw:font-bold">
              {pct(effectiveRateTotal)}
            </div>
          </div>
        </div>
        <div className="tw:col-span-4">
          <div className="bt-stat-card">
            <div className="tw:text-text-muted tw:text-label tw:font-medium tw:uppercase tw:tracking-wide">
              {m.summary_net_daily()}
            </div>
            <div className="tw:font-mono tw:text-stat tw:tracking-tight tw:font-bold tw:text-success">
              {totalWorkdays > 0 ? fmt(netIncome / totalWorkdays) : "—"}
            </div>
          </div>
        </div>
      </div>

      <FilingChecklist result={result} />

      {/* Income sourcing ratio (4 percentages) */}
      {(() => {
        const { totalWithSick, totalNoSick, sickDays, daysBE } = getNLFractions(result.inputs);
        const showOverlapNote = sickDays > 0 && daysBE > 0;
        return (
          <div className="tw:mt-6">
            <h6 className="tw:mb-2">{m.summary_sourcing_title()}</h6>
            <Table bordered className="tw:mb-1 tw:text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">{m.summary_sourcing_method_col()}</TableHead>
                  <TableHead scope="col" className="tw:text-center">
                    {m.summary_sourcing_nl_fraction()}
                  </TableHead>
                  <TableHead scope="col" className="tw:text-center">
                    {m.summary_sourcing_be_fraction()}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>🇳🇱 {m.summary_sourcing_nl_method()}</TableCell>
                  <TableCell className="tw:text-center">
                    {totalWithSick > 0 ? pct(result.nlFractionDutchMethod) : "—"}
                  </TableCell>
                  <TableCell className="tw:text-center">
                    {totalWithSick > 0 ? pct(1 - result.nlFractionDutchMethod) : "—"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>🇧🇪 {m.summary_sourcing_be_method()}</TableCell>
                  <TableCell className="tw:text-center">
                    {totalNoSick > 0 ? pct(result.nlFractionBelgianMethod) : "—"}
                  </TableCell>
                  <TableCell className="tw:text-center">
                    {totalNoSick > 0 ? pct(1 - result.nlFractionBelgianMethod) : "—"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <p className="tw:text-text-muted tw:text-sm tw:mb-0">
              {m.summary_sourcing_nl_formula()}
            </p>
            <p className="tw:text-text-muted tw:text-sm tw:mb-0">
              {m.summary_sourcing_be_formula()}
            </p>
            {showOverlapNote && (
              <p className="tw:text-warning tw:text-sm tw:mb-0 tw:mt-1">
                {m.summary_sourcing_overlap_note()}
              </p>
            )}
          </div>
        );
      })()}

      {/* Fiscal balance (if NL tax was withheld) */}
      {withheldTaxNL > 0 && (
        <div className="tw:mt-6">
          <h6 className="tw:mb-4">{m.summary_eindafrekening()}</h6>

          <div className="bt-breakdown">
            <div className="bt-breakdown__row">
              <span className="bt-breakdown__label">🇳🇱 {m.summary_withheld_nl()}</span>
              <span className="bt-breakdown__value">{fmt(withheldTaxNL)}</span>
            </div>
            <div className="bt-breakdown__row">
              <span className="bt-breakdown__label">🇳🇱 {m.summary_nl_owed()}</span>
              <span className="bt-breakdown__value tw:text-danger">−{fmt(nl.netTaxNL)}</span>
            </div>
            <div
              className={cn(
                "bt-breakdown__row",
                nlBalance >= 0 ? "bt-breakdown__row--ok" : "bt-breakdown__row--warn",
              )}
            >
              <span className="bt-breakdown__label bt-breakdown__label--strong">
                🇳🇱 {m.summary_nl_balance()}
              </span>
              <span
                className={cn(
                  "bt-breakdown__value",
                  "bt-breakdown__label--strong",
                  nlBalance >= 0 ? "tw:text-success" : "tw:text-danger",
                )}
              >
                {fmtSigned(nlBalance)}
              </span>
            </div>
            {be && be.netTaxBE > 0 && (
              <div className="bt-breakdown__row">
                <span className="bt-breakdown__label">🇧🇪 {m.summary_be_owed()}</span>
                <span className="bt-breakdown__value tw:text-danger">−{fmt(be.netTaxBE)}</span>
              </div>
            )}
          </div>

          <div
            className={cn("bt-balance", netResult >= 0 ? "bt-balance--refund" : "bt-balance--owe")}
          >
            <div className="bt-balance__label">
              {netResult >= 0 ? (
                <CircleArrowDown aria-hidden="true" className="tw:size-4 tw:me-2" />
              ) : (
                <CircleArrowUp aria-hidden="true" className="tw:size-4 tw:me-2" />
              )}
              {m.summary_net_result()}
            </div>
            <div className="bt-balance__amount">{fmtSigned(netResult)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
