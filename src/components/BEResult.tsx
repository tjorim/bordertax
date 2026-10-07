import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Alert } from "react-bootstrap";
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
      <Alert variant="info" className="mb-0">
        <i className="bi bi-info-circle me-2" />
        {m.be_only_residents()}
      </Alert>
    );
  }

  if (!result) return null;

  const hasBeIncome = result.beIncome > 0;

  return (
    <div>
      <h6 className="text-muted mb-3">🇧🇪 {m.be_title()}</h6>

      {!hasBeIncome && (
        <Alert variant="success" className="mb-3">
          <i className="bi bi-check-circle me-2" />
          {m.be_no_home_working()}
        </Alert>
      )}

      <p className="mb-1 fw-semibold small">{m.be_income_split()}</p>
      <Table bordered className="tw:mb-3">
        <TableBody>
          <TableRow>
            <TableCell>🇳🇱 {m.be_exempt_nl_income()}</TableCell>
            <TableCell className="tw:text-end">{fmt(result.nlExemptIncome)}</TableCell>
            <TableCell className="tw:text-end text-muted small">
              {pct(1 - result.beFraction)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>🇧🇪 {m.be_taxable_be_income()}</TableCell>
            <TableCell className="tw:text-end">{fmt(result.beIncome)}</TableCell>
            <TableCell className="tw:text-end text-muted small">{pct(result.beFraction)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <p className="mb-1 fw-semibold small">
        {m.be_exemption_with_progression()}{" "}
        <span className="text-muted fw-normal">({m.be_progression_hint()})</span>
      </p>
      <Table bordered className="tw:mb-3">
        <TableBody>
          <TableRow>
            <TableCell>{m.be_total_gross_income()}</TableCell>
            <TableCell className="tw:text-end">
              {fmt(result.nlExemptIncome + result.beIncome)}
            </TableCell>
          </TableRow>
          <TableRow className="fw-semibold">
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
          <TableRow className="fw-semibold">
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
          <TableRow className="fw-semibold">
            <TableCell>{m.be_tax_after_allowance()}</TableCell>
            <TableCell className="tw:text-end">{fmt(result.omTeSlane)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{m.be_exemption_reduction()}</TableCell>
            <TableCell className="tw:text-end tw:text-success">
              −{fmt(result.vrijstellingReduction)}
            </TableCell>
          </TableRow>
          <TableRow className="fw-semibold">
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

      <p className="mb-1 fw-semibold small">{m.be_final_calculation()}</p>
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
          <TableRow variant="be" className="fw-bold">
            <TableCell>{m.be_tax_payable()}</TableCell>
            <TableCell className="tw:text-end">{fmt(result.netTaxBE)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-muted small">{m.be_effective_rate()}</TableCell>
            <TableCell className="tw:text-end text-muted small">
              {pct(result.effectiveRateBE)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Alert variant="warning" className="mt-3 small mb-0">
        <i className="bi bi-exclamation-triangle me-2" />
        <strong>{m.be_warning_note()}</strong> {m.be_warning_text()}
      </Alert>
    </div>
  );
}
