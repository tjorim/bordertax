import { Badge, Table } from "react-bootstrap";
import { VALID_YEARS } from "../tax/constants";
import type { TaxResult, TaxYear } from "../tax/types";
import * as m from "../paraglide/messages.js";
import { formatPercent, formatRoundedCurrency } from "./format";

interface ComparisonRow {
  year: (typeof VALID_YEARS)[number];
  result: TaxResult;
}

interface Props {
  rows: ComparisonRow[];
  activeYear: TaxYear;
}

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
            <tr key={year} className={year === activeYear ? "table-primary" : undefined}>
              <td>
                {year} {year === activeYear && <Badge bg="primary">{m.years_active()}</Badge>}
              </td>
              <td className="text-end">{formatRoundedCurrency(result.grossIncome)}</td>
              <td className="text-end text-danger">-{formatRoundedCurrency(result.nl.netTaxNL)}</td>
              <td className="text-end text-danger">
                -{formatRoundedCurrency(result.be?.netTaxBE ?? 0)}
              </td>
              <td className="text-end text-danger fw-semibold">
                -{formatRoundedCurrency(result.totalTax)}
              </td>
              <td className="text-end text-success fw-semibold">
                {formatRoundedCurrency(result.netIncome)}
              </td>
              <td className="text-end">{formatPercent(result.effectiveRateTotal, 1)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <p className="text-muted small mb-0">{m.years_description()}</p>
    </div>
  );
}
