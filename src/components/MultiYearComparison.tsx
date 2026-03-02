import { Badge, Table } from 'react-bootstrap';
import { VALID_YEARS } from '../tax/constants';
import type { TaxResult, TaxYear } from '../tax/types';

interface ComparisonRow {
  year: (typeof VALID_YEARS)[number];
  result: TaxResult;
}

interface Props {
  rows: ComparisonRow[];
  activeYear: TaxYear;
}

const fmt = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export default function MultiYearComparison({ rows, activeYear }: Props) {
  return (
    <div>
      <h6 className="text-muted mb-3">Comparison by tax year</h6>
      <Table bordered hover responsive>
        <thead>
          <tr>
            <th>Year</th>
            <th className="text-end">Gross</th>
            <th className="text-end">NL tax</th>
            <th className="text-end">BE tax</th>
            <th className="text-end">Total tax</th>
            <th className="text-end">Net income</th>
            <th className="text-end">Effective rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ year, result }) => (
            <tr key={year} className={year === activeYear ? 'table-primary' : undefined}>
              <td>
                {year} {year === activeYear && <Badge bg="primary">active</Badge>}
              </td>
              <td className="text-end">{fmt(result.grossIncome)}</td>
              <td className="text-end text-danger">-{fmt(result.nl.netTaxNL)}</td>
              <td className="text-end text-danger">-{fmt(result.be?.netTaxBE ?? 0)}</td>
              <td className="text-end text-danger fw-semibold">-{fmt(result.totalTax)}</td>
              <td className="text-end text-success fw-semibold">{fmt(result.netIncome)}</td>
              <td className="text-end">{pct(result.effectiveRateTotal)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <p className="text-muted small mb-0">
        This comparison uses the exact same input values (salary, workdays, family status), only
        the selected tax year changes.
      </p>
    </div>
  );
}
