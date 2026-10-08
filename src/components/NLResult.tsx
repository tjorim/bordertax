import { Star } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import clsx from "clsx";
import type { NLTaxResult } from "../tax/types";
import * as m from "../paraglide/messages.js";
import { fmtExact as fmt, pctExact as pct } from "./format.js";
import { CodeBadge } from "./CodeBadge";

interface Props {
  result: NLTaxResult;
  withheldTaxNL?: number;
  thirtyPercentRuling?: boolean;
}

export default function NLResult({
  result,
  withheldTaxNL = 0,
  thirtyPercentRuling = false,
}: Props) {
  const nlBalance = withheldTaxNL - result.netTaxNL;
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
          <Star aria-hidden="true" className="inline size-4 shrink-0 align-text-bottom me-2" />
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
            <TableRow key={b.label}>
              <TableCell className="text-sm">{b.label}</TableCell>
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

      <Table bordered>
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
          {withheldTaxNL > 0 && (
            <>
              <TableRow>
                <TableCell>{m.nl_withheld()}</TableCell>
                <TableCell className="text-end">{fmt(withheldTaxNL)}</TableCell>
              </TableRow>
              <TableRow variant={nlBalance >= 0 ? "success" : "danger"} className="font-bold">
                <TableCell>{nlBalance >= 0 ? m.nl_balance_refund() : m.nl_balance_due()}</TableCell>
                <TableCell
                  className={clsx("text-end", nlBalance >= 0 ? "text-success" : "text-danger")}
                >
                  {nlBalance >= 0 ? "+" : "−"}
                  {fmt(Math.abs(nlBalance))}
                </TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
