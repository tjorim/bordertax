import { Alert } from "@/components/ui/alert";
import { CircleCheck, Info, TriangleAlert } from "lucide-react";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";

import type { BETaxResult, TaxInputs } from "../tax/types";
import * as m from "../paraglide/messages.js";
import { fmtExact as fmt, pctExact as pct } from "./format.js";
import { CodeBadge } from "./CodeBadge";

interface Props {
  result: BETaxResult | null;
  residentCountry: TaxInputs["residentCountry"];
}

export default function BEResult({ result, residentCountry }: Props) {
  if (residentCountry !== "BE") {
    return (
      <Alert variant="info" className="tw:mb-0">
        <Info
          aria-hidden="true"
          className="tw:inline tw:size-4 tw:shrink-0 tw:align-text-bottom tw:me-2"
        />
        {m.be_only_residents()}
      </Alert>
    );
  }

  if (!result) return null;

  const hasBeIncome = result.beIncome > 0;

  return (
    <div>
      <h6 className="tw:text-text-muted tw:mb-4">🇧🇪 {m.be_title()}</h6>

      {!hasBeIncome && (
        <Alert variant="success" className="tw:mb-4">
          <CircleCheck
            aria-hidden="true"
            className="tw:inline tw:size-4 tw:shrink-0 tw:align-text-bottom tw:me-2"
          />
          {m.be_no_home_working()}
        </Alert>
      )}

      <p className="tw:mb-1 tw:font-semibold tw:text-section-label tw:uppercase tw:tracking-table-heading">
        {m.be_income_split()}
      </p>
      <Table bordered className="tw:mb-3">
        <TableBody>
          <TableRow>
            <TableCell>🇳🇱 {m.be_exempt_nl_income()}</TableCell>
            <TableCell className="tw:text-end">{fmt(result.nlExemptIncome)}</TableCell>
            <TableCell className="tw:text-end tw:text-text-muted tw:text-sm">
              {pct(1 - result.beFraction)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>🇧🇪 {m.be_taxable_be_income()}</TableCell>
            <TableCell className="tw:text-end">{fmt(result.beIncome)}</TableCell>
            <TableCell className="tw:text-end tw:text-text-muted tw:text-sm">
              {pct(result.beFraction)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <p className="tw:mb-1 tw:font-semibold tw:text-section-label tw:uppercase tw:tracking-table-heading">
        {m.be_exemption_with_progression()}{" "}
        <span className="tw:text-text-muted tw:font-normal">({m.be_progression_hint()})</span>
      </p>
      <Table bordered className="tw:mb-3">
        <TableBody>
          <TableRow>
            <TableCell>{m.be_total_gross_income()}</TableCell>
            <TableCell className="tw:text-end">
              {fmt(result.nlExemptIncome + result.beIncome)}
            </TableCell>
          </TableRow>
          <TableRow className="tw:font-semibold">
            <TableCell>
              {m.be_declared_income()}
              <CodeBadge code="1250" description={m.code_desc_1250()} />
            </TableCell>
            <TableCell className="tw:text-end">{fmt(result.declaredIncome)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{m.be_professional_expenses()}</TableCell>
            <TableCell className="tw:text-end tw:text-success">
              −{fmt(result.professionalExpenses)}
            </TableCell>
          </TableRow>
          <TableRow className="tw:font-semibold">
            <TableCell>{m.be_net_taxable_income()}</TableCell>
            <TableCell className="tw:text-end">{fmt(result.netProfessionalIncome)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{m.be_tax_on_total()}</TableCell>
            <TableCell className="tw:text-end">{fmt(result.basisbelasting)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{m.be_personal_allowance()}</TableCell>
            <TableCell className="tw:text-end tw:text-success">
              −{fmt(result.belastingvrijeSomReduction)}
            </TableCell>
          </TableRow>
          <TableRow className="tw:font-semibold">
            <TableCell>{m.be_tax_after_allowance()}</TableCell>
            <TableCell className="tw:text-end">{fmt(result.omTeSlane)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{m.be_exemption_reduction()}</TableCell>
            <TableCell className="tw:text-end tw:text-success">
              −{fmt(result.vrijstellingReduction)}
            </TableCell>
          </TableRow>
          <TableRow className="tw:font-semibold">
            <TableCell>{m.be_tax_before_split()}</TableCell>
            <TableCell className="tw:text-end">{fmt(result.hoofdsom)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{m.be_federal_part()}</TableCell>
            <TableCell className="tw:text-end">{fmt(result.gereduceerde)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{m.be_regional_part()}</TableCell>
            <TableCell className="tw:text-end">{fmt(result.gewestelijke)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <p className="tw:mb-1 tw:font-semibold tw:text-section-label tw:uppercase tw:tracking-table-heading">
        {m.be_final_calculation()}
      </p>
      <Table bordered>
        <TableBody>
          <TableRow>
            <TableCell>{m.be_federal_tax()}</TableCell>
            <TableCell className="tw:text-end">{fmt(result.saldoFederaal)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{m.be_regional_tax()}</TableCell>
            <TableCell className="tw:text-end">{fmt(result.saldoGewestelijk)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{m.be_municipal_tax()}</TableCell>
            <TableCell className="tw:text-end">{fmt(result.communalTax)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{m.be_municipal_tax_on_exempt()}</TableCell>
            <TableCell className="tw:text-end">{fmt(result.communalTaxOnVrijgesteld)}</TableCell>
          </TableRow>
          <TableRow variant="be" className="tw:font-bold">
            <TableCell>{m.be_tax_payable()}</TableCell>
            <TableCell className="tw:text-end">{fmt(result.netTaxBE)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="tw:text-text-muted tw:text-sm">{m.be_effective_rate()}</TableCell>
            <TableCell className="tw:text-end tw:text-text-muted tw:text-sm">
              {pct(result.effectiveRateBE)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Alert variant="warning" className="tw:mt-4 tw:text-sm tw:mb-0">
        <TriangleAlert
          aria-hidden="true"
          className="tw:inline tw:size-4 tw:shrink-0 tw:align-text-bottom tw:me-2"
        />
        <strong>{m.be_warning_note()}</strong> {m.be_warning_text()}
      </Alert>
    </div>
  );
}
