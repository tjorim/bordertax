import { Table } from 'react-bootstrap';
import type { NLTaxResult } from '../tax/types';

interface Props {
  result: NLTaxResult;
}

const fmt = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

export default function NLResult({ result }: Props) {
  return (
    <div>
      <h6 className="text-muted mb-3">🇳🇱 Dutch income tax (Box 1)</h6>

      <Table bordered size="sm" className="mb-3">
        <tbody>
          <tr>
            <td>Taxable Box 1 income</td>
            <td className="text-end fw-semibold">{fmt(result.nlTaxableIncome)}</td>
          </tr>
        </tbody>
      </Table>

      <p className="mb-1 fw-semibold small">Bracket calculation</p>
      <Table bordered size="sm" className="mb-3">
        <thead className="table-light">
          <tr>
            <th>Bracket</th>
            <th className="text-end">Rate</th>
            <th className="text-end">Amount</th>
            <th className="text-end">Tax</th>
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
            <td colSpan={3}>Tax before credits</td>
            <td className="text-end">{fmt(result.taxBeforeCredits)}</td>
          </tr>
        </tbody>
      </Table>

      <p className="mb-1 fw-semibold small">Tax credits</p>
      <Table bordered size="sm" className="mb-3">
        <tbody>
          <tr>
            <td>General tax credit</td>
            <td className="text-end text-success">−{fmt(result.algemeneHeffingskorting)}</td>
          </tr>
          <tr>
            <td>Labour tax credit</td>
            <td className="text-end text-success">−{fmt(result.arbeidskorting)}</td>
          </tr>
          <tr className="table-secondary fw-semibold">
            <td>Total credits</td>
            <td className="text-end text-success">−{fmt(result.totalCredits)}</td>
          </tr>
        </tbody>
      </Table>

      <Table bordered size="sm">
        <tbody>
          <tr className="table-primary fw-bold">
            <td>NL tax payable</td>
            <td className="text-end">{fmt(result.netTaxNL)}</td>
          </tr>
          <tr>
            <td className="text-muted small">Effective rate (on gross salary)</td>
            <td className="text-end text-muted small">{pct(result.effectiveRateNL)}</td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}
