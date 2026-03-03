import { Table } from 'react-bootstrap';
import type { NLTaxResult } from '../tax/types';
import * as m from '../paraglide/messages.js';
import { getLocale } from '../paraglide/runtime.js';

interface Props {
  result: NLTaxResult;
}

const fmt = (n: number) =>
  n.toLocaleString(getLocale(), { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

export default function NLResult({ result }: Props) {
  return (
    <div>
      <h6 className="text-muted mb-3">🇳🇱 {m.nl_title()}</h6>

      <Table bordered size="sm" className="mb-3">
        <tbody>
          <tr>
            <td>{m.nl_taxable_income()}</td>
            <td className="text-end fw-semibold">{fmt(result.nlTaxableIncome)}</td>
          </tr>
        </tbody>
      </Table>

      <p className="mb-1 fw-semibold small">{m.nl_bracket_calculation()}</p>
      <Table bordered size="sm" className="mb-3">
        <thead className="table-light">
          <tr>
            <th>{m.nl_bracket()}</th>
            <th className="text-end">{m.nl_rate()}</th>
            <th className="text-end">{m.nl_amount()}</th>
            <th className="text-end">{m.nl_tax()}</th>
          </tr>
        </thead>
        <tbody>
          {result.brackets.map((b) => (
            <tr key={b.label}>
              <td className="small">{b.label}</td>
              <td className="text-end small">{pct(b.rate)}</td>
              <td className="text-end small">{fmt(b.taxableAmount)}</td>
              <td className="text-end small">{fmt(b.tax)}</td>
            </tr>
          ))}
          <tr className="table-secondary fw-semibold">
            <td colSpan={3}>{m.nl_tax_before_credits()}</td>
            <td className="text-end">{fmt(result.taxBeforeCredits)}</td>
          </tr>
        </tbody>
      </Table>

      <p className="mb-1 fw-semibold small">{m.nl_tax_credits()}</p>
      <Table bordered size="sm" className="mb-3">
        <tbody>
          <tr>
            <td>{m.nl_general_tax_credit()}</td>
            <td className="text-end text-success">−{fmt(result.algemeneHeffingskorting)}</td>
          </tr>
          <tr>
            <td>{m.nl_labour_tax_credit()}</td>
            <td className="text-end text-success">−{fmt(result.arbeidskorting)}</td>
          </tr>
          <tr className="table-secondary fw-semibold">
            <td>{m.nl_total_credits()}</td>
            <td className="text-end text-success">−{fmt(result.totalCredits)}</td>
          </tr>
        </tbody>
      </Table>

      <Table bordered size="sm">
        <tbody>
          <tr className="table-primary fw-bold">
            <td>{m.nl_tax_payable()}</td>
            <td className="text-end">{fmt(result.netTaxNL)}</td>
          </tr>
          <tr>
            <td className="text-muted small">{m.nl_effective_rate()}</td>
            <td className="text-end text-muted small">{pct(result.effectiveRateNL)}</td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}
