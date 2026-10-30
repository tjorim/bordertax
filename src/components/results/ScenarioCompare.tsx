import { useMemo, useState } from "react";
import { NumberField, CurrencyField } from "@/components/fields/NumberField";
import { CheckboxField } from "@/components/fields/CheckboxField";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { compareScenarios } from "@/tax/compare";
import type { TaxInputs } from "@/tax/types";
import * as m from "@/paraglide/messages.js";
import { fmt, fmtSigned } from "../format";

type Overrides = Partial<
  Pick<
    TaxInputs,
    "daysWorkedNL" | "daysWorkedBE" | "grossSalary" | "mortgageEnabled" | "mortgageInterest"
  >
>;

export default function ScenarioCompare({ inputs }: { inputs: TaxInputs }) {
  const [overrides, setOverrides] = useState<Overrides>({});
  const alternative = useMemo(() => ({ ...inputs, ...overrides }), [inputs, overrides]);
  const comparison = useMemo(() => compareScenarios(inputs, alternative), [inputs, alternative]);
  const { a, b, delta, changed, attribution } = comparison;
  const update = (key: keyof Overrides, value: number | undefined) => {
    if (value === undefined || !Number.isFinite(value) || value < 0) return;
    setOverrides((previous) => ({ ...previous, [key]: value }));
  };
  const rows = [
    [m.compare_nl_tax(), a.nl.netTaxNL, b.nl.netTaxNL, delta.nlTax, true],
    [m.compare_be_tax(), a.be?.netTaxBE ?? 0, b.be?.netTaxBE ?? 0, delta.beTax, true],
    [m.compare_total_tax(), a.totalTax, b.totalTax, delta.totalTax, true],
    [m.compare_net_year(), a.netIncome, b.netIncome, delta.netIncome, false],
    [m.compare_net_month(), a.netIncome / 12, b.netIncome / 12, delta.netIncomeMonthly, false],
  ] as const;
  const groups = {
    workdays: m.compare_workdays(),
    income: m.compare_income(),
    mortgage: m.compare_mortgage(),
    other: m.compare_other(),
  };
  const statuses = {
    eligible: m.compare_eligible(),
    ineligible: m.compare_ineligible(),
    unknown: m.compare_unknown(),
    disabled: m.compare_disabled(),
  };
  const statusA = a.mortgage?.status ?? "disabled";
  const statusB = b.mortgage?.status ?? "disabled";

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-text-sub">{m.compare_intro()}</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <NumberField
          id="compare-days-nl"
          label={m.compare_days_nl()}
          min={0}
          step={1}
          value={alternative.daysWorkedNL}
          onChange={(value) => update("daysWorkedNL", value)}
        />
        <NumberField
          id="compare-days-be"
          label={m.compare_days_be()}
          min={0}
          step={1}
          value={alternative.daysWorkedBE}
          onChange={(value) => update("daysWorkedBE", value)}
        />
        <CurrencyField
          id="compare-salary"
          label={m.compare_salary()}
          min={0}
          value={alternative.grossSalary}
          onChange={(value) => update("grossSalary", value)}
        />
        {inputs.mortgageEnabled !== undefined && (
          <>
            <CheckboxField
              id="compare-mortgage-enabled"
              label={m.compare_mortgage_enabled()}
              checked={alternative.mortgageEnabled ?? false}
              onCheckedChange={(checked) =>
                setOverrides((previous) => ({ ...previous, mortgageEnabled: checked }))
              }
            />
            {alternative.mortgageEnabled && (
              <CurrencyField
                id="compare-interest"
                label={m.compare_interest()}
                min={0}
                value={alternative.mortgageInterest ?? 0}
                onChange={(value) => update("mortgageInterest", value)}
              />
            )}
          </>
        )}
      </div>
      <div>
        <Button variant="outline-secondary" onClick={() => setOverrides({})}>
          {m.compare_reset()}
        </Button>
      </div>
      {statusA !== statusB && (
        <Alert variant="warning">
          {m.compare_status_change({ a: statuses[statusA], b: statuses[statusB] })}
        </Alert>
      )}
      {(statusA === "unknown" || statusB === "unknown") && (
        <Alert variant="warning">{m.compare_incomplete()}</Alert>
      )}
      <Table responsive aria-label={m.tabs_compare()}>
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="whitespace-normal">
              {m.compare_metric()}
            </TableHead>
            <TableHead scope="col">{m.compare_a()}</TableHead>
            <TableHead scope="col">{m.compare_b()}</TableHead>
            <TableHead scope="col">{m.compare_difference()}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(([label, current, next, difference, tax]) => (
            <TableRow key={label}>
              <TableHead scope="row" className="whitespace-normal">
                {label}
              </TableHead>
              <TableCell>{fmt(current)}</TableCell>
              <TableCell>{fmt(next)}</TableCell>
              <TableCell
                className={cn(
                  difference !== 0 &&
                    ((tax ? difference < 0 : difference > 0) ? "text-success" : "text-warning"),
                )}
              >
                {fmtSigned(difference)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <section aria-labelledby="compare-causes">
        <h3 id="compare-causes" className="mb-3">
          {m.compare_causes()}
        </h3>
        {changed.length === 0 ? (
          <p>{m.compare_unchanged()}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {changed.map((group) => (
              <li key={group} className="flex flex-wrap justify-between gap-2">
                <span>{groups[group]}</span>
                <span className="font-mono tabular-nums">
                  {fmtSigned(attribution.netIncome[group] ?? 0)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
