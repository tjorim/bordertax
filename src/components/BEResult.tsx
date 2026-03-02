import { Alert, Table } from 'react-bootstrap';
import type { BETaxResult, TaxInputs } from '../tax/types';

interface Props {
  result: BETaxResult | null;
  residentCountry: TaxInputs['residentCountry'];
}

const fmt = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

export default function BEResult({ result, residentCountry }: Props) {
  if (residentCountry !== 'BE') {
    return (
      <Alert variant="info" className="mb-0">
        <i className="bi bi-info-circle me-2" />
        Belgian tax only applies to residents of Belgium.
      </Alert>
    );
  }

  if (!result) return null;

  const hasBeIncome = result.beIncome > 0;

  return (
    <div>
      <h6 className="text-muted mb-3">🇧🇪 Belgian personal income tax</h6>

      {!hasBeIncome && (
        <Alert variant="success" className="mb-3">
          <i className="bi bi-check-circle me-2" />
          No home-working days in Belgium → no Belgian tax due on salary.
        </Alert>
      )}

      <p className="mb-1 fw-semibold small">Income split</p>
      <Table bordered size="sm" className="mb-3">
        <tbody>
          <tr>
            <td>🇳🇱 Exempt NL income</td>
            <td className="text-end">{fmt(result.nlExemptIncome)}</td>
            <td className="text-end text-muted small">{pct(1 - result.beFraction)}</td>
          </tr>
          <tr>
            <td>🇧🇪 Taxable BE income</td>
            <td className="text-end">{fmt(result.beIncome)}</td>
            <td className="text-end text-muted small">{pct(result.beFraction)}</td>
          </tr>
        </tbody>
      </Table>

      <p className="mb-1 fw-semibold small">
        Exemption with progression{' '}
        <span className="text-muted fw-normal">
          (calculated on total worldwide income)
        </span>
      </p>
      <Table bordered size="sm" className="mb-3">
        <tbody>
          <tr>
            <td>Total gross income</td>
            <td className="text-end">{fmt(result.nlExemptIncome + result.beIncome)}</td>
          </tr>
          <tr>
            <td>Lump-sum professional expenses (−)</td>
            <td className="text-end text-success">−{fmt(result.professionalExpenses)}</td>
          </tr>
          <tr className="fw-semibold">
            <td>Net taxable total income</td>
            <td className="text-end">{fmt(result.netTotalIncome)}</td>
          </tr>
          <tr>
            <td>Tax on total income (brackets)</td>
            <td className="text-end">{fmt(result.taxOnTotalIncome)}</td>
          </tr>
          <tr>
            <td>Personal allowance (−)</td>
            <td className="text-end text-success">−{fmt(result.belastingvrijeSomReduction)}</td>
          </tr>
          <tr className="fw-semibold">
            <td>Tax after allowance</td>
            <td className="text-end">{fmt(result.taxAfterPersonalExemption)}</td>
          </tr>
          <tr>
            <td>× Belgian fraction ({pct(result.beFraction)})</td>
            <td className="text-end">{fmt(result.federalTax)}</td>
          </tr>
        </tbody>
      </Table>

      <p className="mb-1 fw-semibold small">Final calculation</p>
      <Table bordered size="sm">
        <tbody>
          <tr>
            <td>Federal personal income tax</td>
            <td className="text-end">{fmt(result.federalTax)}</td>
          </tr>
          <tr>
            <td>Municipal tax</td>
            <td className="text-end">{fmt(result.communalTax)}</td>
          </tr>
          <tr className="table-primary fw-bold">
            <td>BE tax payable</td>
            <td className="text-end">{fmt(result.netTaxBE)}</td>
          </tr>
          <tr>
            <td className="text-muted small">Effective rate (on gross salary)</td>
            <td className="text-end text-muted small">{pct(result.effectiveRateBE)}</td>
          </tr>
        </tbody>
      </Table>

      <Alert variant="warning" className="mt-3 small mb-0">
        <i className="bi bi-exclamation-triangle me-2" />
        <strong>Note:</strong> This is a simplified estimate. Your final return may differ due to
        spouse income splitting, special social security contributions, regional taxes and other
        personal deductions. Consult a tax advisor for your final tax return.
      </Alert>
    </div>
  );
}
