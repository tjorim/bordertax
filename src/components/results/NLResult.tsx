import { StarIcon } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DutchCharge, NLTaxResult } from "@/tax/types";
import * as m from "@/paraglide/messages.js";
import {
  fmt as fmtWhole,
  fmtBracket,
  fmtExact as fmt,
  fmtSigned,
  pctExact as pct,
} from "../format.js";
import { CodeBadge } from "../CodeBadge";

interface Props {
  result: NLTaxResult;
  /** The Dutch charge in use (estimate or assessment); defaults to the estimate in `result`. */
  charge?: DutchCharge;
  wageTaxWithheld?: number;
  thirtyPercentRuling?: boolean;
}

export default function NLResult({
  result,
  charge,
  wageTaxWithheld = 0,
  thirtyPercentRuling = false,
}: Props) {
  const used = charge ?? estimateCharge(result);
  const nlBalance = wageTaxWithheld - used.netTaxNL;
  return (
    <div>
      <h6 className="text-text-muted mb-4">
        🇳🇱 {m.nl_title()}
        {thirtyPercentRuling && (
          <Badge variant="warning" className="ms-2 font-mono align-middle">
            30%
          </Badge>
        )}
      </h6>

      {thirtyPercentRuling && (
        <div className="bt-ruling-notice mb-4">
          <StarIcon aria-hidden="true" className="inline size-4 shrink-0 align-text-bottom me-2" />
          {m.input_thirty_percent_ruling_hint()}
        </div>
      )}

      <Table bordered className="mb-3">
        <TableBody>
          <TableRow>
            <TableCell>
              {m.nl_not_taxed_income()}
              <CodeBadge
                code={m.nl_not_taxed_income()}
                description={m.code_desc_deel_niet_in_nl_belast()}
                system="nl"
              />
            </TableCell>
            <TableCell className="text-end">{fmt(result.deelNietInNLBelast)}</TableCell>
          </TableRow>
          {result.mortgageDeduction > 0 && (
            <>
              <TableRow>
                <TableCell>{m.mortgage_deduction()}</TableCell>
                <TableCell className="text-end">−{fmt(result.mortgageDeduction)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{m.mortgage_surcharge()}</TableCell>
                <TableCell className="text-end">{fmt(result.mortgageRateCapSurcharge)}</TableCell>
              </TableRow>
            </>
          )}
          <TableRow>
            <TableCell>{m.nl_taxable_income()}</TableCell>
            <TableCell className="text-end font-semibold">{fmt(result.nlTaxableIncome)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <p className="mb-1 font-semibold text-section-label uppercase tracking-table-heading">
        {m.nl_bracket_calculation()}
      </p>
      <Table
        bordered
        className="mb-3 [&_tbody_tr:not([data-variant=secondary])_td]:text-text-muted [&_tbody_tr:not([data-variant=secondary])_td]:text-table-number"
      >
        <TableHeader className="bg-surface-3">
          <TableRow>
            <TableHead>{m.nl_bracket()}</TableHead>
            <TableHead className="text-end">{m.nl_rate()}</TableHead>
            <TableHead className="text-end">{m.nl_amount()}</TableHead>
            <TableHead className="text-end">{m.nl_tax()}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.brackets.map((b) => (
            <TableRow key={b.from}>
              <TableCell className="text-sm">{fmtBracket(b.from, b.to)}</TableCell>
              <TableCell className="text-end text-sm">{pct(b.rate)}</TableCell>
              <TableCell className="text-end text-sm">{fmt(b.taxableAmount)}</TableCell>
              <TableCell className="text-end text-sm">{fmt(b.tax)}</TableCell>
            </TableRow>
          ))}
          <TableRow variant="secondary">
            <TableCell colSpan={3}>{m.nl_tax_before_credits()}</TableCell>
            <TableCell className="text-end">{fmt(result.taxBeforeCredits)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={3}>{m.nl_volksverzekeringen()}</TableCell>
            <TableCell className="text-end">{fmt(result.volksverzekeringen)}</TableCell>
          </TableRow>
          <TableRow variant="secondary" className="font-semibold">
            <TableCell colSpan={3}>{m.nl_subtotal_before_credits()}</TableCell>
            <TableCell className="text-end">
              {fmt(result.taxBeforeCredits + result.volksverzekeringen)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <p className="mb-1 font-semibold text-section-label uppercase tracking-table-heading">
        {m.nl_tax_credits()}
      </p>
      <Table bordered className="mb-3">
        <TableBody>
          <TableRow>
            <TableCell>{m.nl_general_tax_credit()}</TableCell>
            <TableCell className="text-end text-success">
              −{fmt(result.algemeneHeffingskorting)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{m.nl_labour_tax_credit()}</TableCell>
            <TableCell className="text-end text-success">−{fmt(result.arbeidskorting)}</TableCell>
          </TableRow>
          <TableRow variant="secondary" className="font-semibold">
            <TableCell>{m.nl_total_credits()}</TableCell>
            <TableCell className="text-end">−{fmt(result.totalCredits)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Table bordered className="mb-6">
        <TableBody>
          <TableRow variant="nl" className="font-bold">
            <TableCell>{m.nl_tax_payable()}</TableCell>
            <TableCell className="text-end">{fmt(result.netTaxNL)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-text-muted text-sm">{m.nl_effective_rate()}</TableCell>
            <TableCell className="text-end text-text-muted text-sm">
              {pct(result.effectiveRateNL)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <DutchChargeSection
        result={result}
        charge={used}
        wageTaxWithheld={wageTaxWithheld}
        nlBalance={nlBalance}
      />
    </div>
  );
}

/** The estimate as a charge, for callers that only have the Dutch result. */
function estimateCharge(result: NLTaxResult): DutchCharge {
  return {
    source: "estimate",
    incomeTaxDue: result.incomeTaxDue,
    premiumsDue: result.premiumsDue,
    netTaxNL: result.netTaxNL,
    incomeTaxDifference: 0,
    premiumsDifference: 0,
    netTaxDifference: 0,
  };
}

function DutchChargeSection({
  result,
  charge,
  wageTaxWithheld,
  nlBalance,
}: {
  result: NLTaxResult;
  charge: DutchCharge;
  wageTaxWithheld: number;
  nlBalance: number;
}) {
  const assessed = charge.source === "assessment";
  const rows = [
    {
      key: "income-tax",
      label: m.nl_charge_income_tax(),
      estimate: result.incomeTaxDue,
      used: charge.incomeTaxDue,
      difference: charge.incomeTaxDifference,
    },
    {
      key: "premiums",
      label: m.nl_charge_premiums(),
      estimate: result.premiumsDue,
      used: charge.premiumsDue,
      difference: charge.premiumsDifference,
    },
    {
      key: "total",
      label: m.nl_charge_total(),
      estimate: result.netTaxNL,
      used: charge.netTaxNL,
      difference: charge.netTaxDifference,
    },
  ];
  return (
    <section aria-labelledby="nl-charge-heading">
      <h6 id="nl-charge-heading" className="mb-1">
        {m.nl_charge_title()}
      </h6>
      <p className="mb-2 flex flex-wrap items-center gap-2 text-sm text-text-muted">
        {m.nl_charge_source()}
        <Badge variant="secondary">
          {assessed ? m.nl_charge_source_assessment() : m.nl_charge_source_estimate()}
        </Badge>
      </p>
      <Table bordered className="mb-2 text-sm">
        {assessed && (
          <TableHeader className="bg-surface-3">
            <TableRow>
              <TableHead>{m.nl_charge_col_item()}</TableHead>
              <TableHead className="text-end">{m.nl_charge_col_assessment()}</TableHead>
              <TableHead className="text-end">{m.nl_charge_col_difference()}</TableHead>
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.key}
              variant={row.key === "total" ? "secondary" : undefined}
              className={cn(row.key === "total" && "font-semibold")}
            >
              <TableCell>
                {row.label}
                {assessed && (
                  <span className="block font-normal text-text-muted">
                    {m.nl_charge_source_estimate()} {fmtWhole(row.estimate)}
                  </span>
                )}
              </TableCell>
              {assessed ? (
                <>
                  <TableCell className="text-end">{fmt(row.used)}</TableCell>
                  <TableCell className="text-end">{fmtSigned(row.difference)}</TableCell>
                </>
              ) : (
                <TableCell className="text-end">{fmt(row.used)}</TableCell>
              )}
            </TableRow>
          ))}
          {wageTaxWithheld > 0 && (
            <>
              <TableRow>
                <TableCell colSpan={assessed ? 2 : 1}>{m.nl_withheld()}</TableCell>
                <TableCell className="text-end">{fmt(wageTaxWithheld)}</TableCell>
              </TableRow>
              <TableRow variant={nlBalance >= 0 ? "success" : "danger"} className="font-bold">
                <TableCell colSpan={assessed ? 2 : 1}>
                  {nlBalance >= 0 ? m.nl_balance_refund() : m.nl_balance_due()}
                </TableCell>
                <TableCell
                  className={cn("text-end", nlBalance >= 0 ? "text-success" : "text-danger")}
                >
                  {nlBalance >= 0 ? "+" : "−"}
                  {fmt(Math.abs(nlBalance))}
                </TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
      <p className="mb-0 text-sm text-text-muted">
        {assessed ? m.nl_charge_hint_assessment() : m.nl_charge_hint_estimate()}
      </p>
    </section>
  );
}
