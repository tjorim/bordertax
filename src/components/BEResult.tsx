import { Alert, Table } from "react-bootstrap";
import type { BETaxResult, TaxInputs } from "../tax/types";
import * as m from "../paraglide/messages.js";
import { fmtExact as fmt, pctExact as pct } from "./format.js";

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
      <Table bordered size="sm" className="mb-3">
        <tbody>
          <tr>
            <td>🇳🇱 {m.be_exempt_nl_income()}</td>
            <td className="text-end">{fmt(result.nlExemptIncome)}</td>
            <td className="text-end text-muted small">{pct(1 - result.beFraction)}</td>
          </tr>
          <tr>
            <td>🇧🇪 {m.be_taxable_be_income()}</td>
            <td className="text-end">{fmt(result.beIncome)}</td>
            <td className="text-end text-muted small">{pct(result.beFraction)}</td>
          </tr>
        </tbody>
      </Table>

      <p className="mb-1 fw-semibold small">
        {m.be_exemption_with_progression()}{" "}
        <span className="text-muted fw-normal">({m.be_progression_hint()})</span>
      </p>
      <Table bordered size="sm" className="mb-3">
        <tbody>
          <tr>
            <td>{m.be_total_gross_income()}</td>
            <td className="text-end">{fmt(result.nlExemptIncome + result.beIncome)}</td>
          </tr>
          <tr>
            <td>{m.be_professional_expenses()}</td>
            <td className="text-end text-success">−{fmt(result.professionalExpenses)}</td>
          </tr>
          <tr className="fw-semibold">
            <td>{m.be_net_taxable_income()}</td>
            <td className="text-end">{fmt(result.netProfessionalIncome)}</td>
          </tr>
          <tr>
            <td>{m.be_tax_on_total()}</td>
            <td className="text-end">{fmt(result.basisbelasting)}</td>
          </tr>
          <tr>
            <td>{m.be_personal_allowance()}</td>
            <td className="text-end text-success">−{fmt(result.belastingvrijeSomReduction)}</td>
          </tr>
          <tr className="fw-semibold">
            <td>{m.be_tax_after_allowance()}</td>
            <td className="text-end">{fmt(result.omTeSlane)}</td>
          </tr>
          <tr>
            <td>{m.be_exemption_reduction()}</td>
            <td className="text-end text-success">−{fmt(result.vrijstellingReduction)}</td>
          </tr>
          <tr className="fw-semibold">
            <td>{m.be_tax_before_split()}</td>
            <td className="text-end">{fmt(result.hoofdsom)}</td>
          </tr>
          <tr>
            <td>{m.be_federal_part()}</td>
            <td className="text-end">{fmt(result.gereduceerde)}</td>
          </tr>
          <tr>
            <td>{m.be_regional_part()}</td>
            <td className="text-end">{fmt(result.gewestelijke)}</td>
          </tr>
        </tbody>
      </Table>

      <p className="mb-1 fw-semibold small">{m.be_final_calculation()}</p>
      <Table bordered size="sm" className="bt-table-result">
        <tbody>
          <tr>
            <td>{m.be_federal_tax()}</td>
            <td className="text-end">{fmt(result.saldoFederaal)}</td>
          </tr>
          <tr>
            <td>{m.be_regional_tax()}</td>
            <td className="text-end">{fmt(result.saldoGewestelijk)}</td>
          </tr>
          <tr>
            <td>{m.be_municipal_tax()}</td>
            <td className="text-end">{fmt(result.communalTax)}</td>
          </tr>
          <tr>
            <td>{m.be_municipal_tax_on_exempt()}</td>
            <td className="text-end">{fmt(result.communalTaxOnVrijgesteld)}</td>
          </tr>
          <tr className="table-primary fw-bold">
            <td>{m.be_tax_payable()}</td>
            <td className="text-end">{fmt(result.netTaxBE)}</td>
          </tr>
          <tr>
            <td className="text-muted small">{m.be_effective_rate()}</td>
            <td className="text-end text-muted small">{pct(result.effectiveRateBE)}</td>
          </tr>
        </tbody>
      </Table>

      <Alert variant="warning" className="mt-3 small mb-0">
        <i className="bi bi-exclamation-triangle me-2" />
        <strong>{m.be_warning_note()}</strong> {m.be_warning_text()}
      </Alert>
    </div>
  );
}
