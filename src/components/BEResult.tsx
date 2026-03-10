import { Alert, Table } from "react-bootstrap";
import type { BETaxResult } from "../tax/types";
import * as m from "../paraglide/messages.js";
import { formatCurrency, formatPercent } from "./format";

interface Props {
  result: BETaxResult | null;
}

export default function BEResult({ result }: Props) {
  if (!result) {
    return (
      <Alert variant="warning" className="mb-0">
        <i className="bi bi-exclamation-triangle me-2" />
        {m.be_result_unavailable()}
      </Alert>
    );
  }

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
            <td className="text-end">{formatCurrency(result.nlExemptIncome)}</td>
            <td className="text-end text-muted small">{formatPercent(1 - result.beFraction)}</td>
          </tr>
          <tr>
            <td>🇧🇪 {m.be_taxable_be_income()}</td>
            <td className="text-end">{formatCurrency(result.beIncome)}</td>
            <td className="text-end text-muted small">{formatPercent(result.beFraction)}</td>
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
            <td className="text-end">{formatCurrency(result.nlExemptIncome + result.beIncome)}</td>
          </tr>
          <tr>
            <td>{m.be_professional_expenses()}</td>
            <td className="text-end text-success">
              −{formatCurrency(result.professionalExpenses)}
            </td>
          </tr>
          <tr className="fw-semibold">
            <td>{m.be_net_taxable_income()}</td>
            <td className="text-end">{formatCurrency(result.netProfessionalIncome)}</td>
          </tr>
          <tr>
            <td>{m.be_tax_on_total()}</td>
            <td className="text-end">{formatCurrency(result.basisbelasting)}</td>
          </tr>
          <tr>
            <td>{m.be_personal_allowance()}</td>
            <td className="text-end text-success">
              −{formatCurrency(result.belastingvrijeSomReduction)}
            </td>
          </tr>
          <tr className="fw-semibold">
            <td>{m.be_tax_after_allowance()}</td>
            <td className="text-end">{formatCurrency(result.omTeSlane)}</td>
          </tr>
          <tr>
            <td>
              × {m.be_belgian_fraction()} ({formatPercent(result.beFraction)})
            </td>
            <td className="text-end">{formatCurrency(result.totaleBelasting)}</td>
          </tr>
        </tbody>
      </Table>

      <p className="mb-1 fw-semibold small">{m.be_final_calculation()}</p>
      <Table bordered size="sm">
        <tbody>
          <tr>
            <td>{m.be_federal_tax()}</td>
            <td className="text-end">{formatCurrency(result.federalTax)}</td>
          </tr>
          <tr>
            <td>{m.be_municipal_tax()}</td>
            <td className="text-end">{formatCurrency(result.communalTax)}</td>
          </tr>
          <tr className="table-primary fw-bold">
            <td>{m.be_tax_payable()}</td>
            <td className="text-end">{formatCurrency(result.netTaxBE)}</td>
          </tr>
          <tr>
            <td className="text-muted small">{m.be_effective_rate()}</td>
            <td className="text-end text-muted small">{formatPercent(result.effectiveRateBE)}</td>
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
