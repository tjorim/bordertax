import { Badge, Table } from "react-bootstrap";
import { VALID_YEARS } from "../tax/constants";
import type { TaxYear } from "../tax/constants";
import type { TaxResult } from "../tax/types";
import * as m from "../paraglide/messages.js";
import { fmt, pct } from "./format.js";

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

      {/* Visual year chart */}
      <div className="bt-year-chart">
        {rows.map(({ year, result }) => {
          const gross = result.grossIncome;
          if (gross === 0) return null;
          const nlPct = (result.nl.netTaxNL / gross) * 100;
          const bePct = ((result.be?.netTaxBE ?? 0) / gross) * 100;
          const netPct = 100 - nlPct - bePct;
          const isActive = year === activeYear;

          return (
            <div
              key={year}
              className={`bt-year-chart__row${isActive ? " bt-year-chart__row--active" : ""}`}
            >
              <div className="bt-year-chart__label">
                {year}
                {isActive && <span className="bt-year-chart__active-dot" />}
              </div>
              <div className="bt-year-chart__bar">
                <div
                  className="bt-year-chart__seg bt-year-chart__seg--net"
                  style={{ width: `${netPct}%` }}
                />
                <div
                  className="bt-year-chart__seg bt-year-chart__seg--nl"
                  style={{ width: `${nlPct}%` }}
                />
                {bePct > 0 && (
                  <div
                    className="bt-year-chart__seg bt-year-chart__seg--be"
                    style={{ width: `${bePct}%` }}
                  />
                )}
              </div>
              <div className="bt-year-chart__value">{fmt(result.netIncome)}</div>
            </div>
          );
        })}
      </div>

      {/* Chart legend */}
      <div className="bt-year-chart__legend">
        <span className="bt-year-chart__legend-item">
          <span className="bt-year-chart__legend-dot bt-year-chart__seg--net" />
          {m.summary_net_label()}
        </span>
        <span className="bt-year-chart__legend-item">
          <span className="bt-year-chart__legend-dot bt-year-chart__seg--nl" />
          🇳🇱 {m.summary_dutch_tax()}
        </span>
        <span className="bt-year-chart__legend-item">
          <span className="bt-year-chart__legend-dot bt-year-chart__seg--be" />
          🇧🇪 {m.summary_belgian_tax()}
        </span>
      </div>

      {/* Detail table */}
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
      <p className="text-muted small mb-0">{m.years_description()}</p>
    </div>
  );
}
