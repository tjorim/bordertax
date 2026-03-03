import { Badge, Table } from 'react-bootstrap';
import { VALID_YEARS } from '../tax/constants';
import type { TaxResult, TaxYear } from '../tax/types';
import * as m from '../paraglide/messages.js';
import { getLocale } from '../paraglide/runtime.js';

interface ComparisonRow {
  year: (typeof VALID_YEARS)[number];
  result: TaxResult;
}

interface Props {
  rows: ComparisonRow[];
  activeYear: TaxYear;
}

const fmt = (n: number) =>
  n.toLocaleString(getLocale(), { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export default function MultiYearComparison({ rows, activeYear }: Props) {
  return (
    <div>
      <h6 className="text-muted mb-3">{m.years_title()}</h6>
      <Table bordered hover responsive>
        <thead>
          <tr>
            <th>{m.years_year()}</th>
            <th className="text-end">{m.years_gross()}</th>
            <th className="text-end">{m.years_nl_tax()}</th>
            <th className="text-end">{m.years_be_tax()}</th>
            <th className="text-end">{m.years_total_tax()}</th>
            <th className="text-end">{m.years_net_income()}</th>
            <th className="text-end">{m.years_effective_rate()}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ year, result }) => (
            <tr key={year} className={year === activeYear ? 'table-primary' : undefined}>
              <td>
                {year} {year === activeYear && <Badge bg="primary">{m.years_active()}</Badge>}
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
        {m.years_description()}
      </p>
    </div>
  );
}
