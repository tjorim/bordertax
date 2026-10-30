import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import type { MortgageResult as MortgageCalculation } from "@/tax/mortgage";
import * as m from "@/paraglide/messages.js";
import { fmt } from "../format";

export default function MortgageResult({ result }: { result: MortgageCalculation }) {
  const reasons = {
    no_nl_income: m.mortgage_no_nl_income,
    threshold_met: m.mortgage_threshold_met,
    threshold_not_met: m.mortgage_threshold_not_met,
    income_outside_nl_missing: m.mortgage_income_outside_nl_missing,
    no_interest: m.mortgage_no_interest,
    forfait_exceeds_interest: m.mortgage_forfait_exceeds_interest,
  };
  const assumptions = {
    income_statement_required: m.mortgage_income_statement_required,
    qualifying_debt: m.mortgage_qualifying_debt,
    home_value_missing: m.mortgage_no_eigenwoningforfait,
    full_year_main_home: m.mortgage_forfait_full_year,
    premium_base_unchanged: m.mortgage_premium_base_unchanged,
    no_belgian_home_benefit: m.mortgage_no_belgian_home_benefit,
  };
  const status = {
    eligible: m.mortgage_eligible,
    ineligible: m.mortgage_ineligible,
    unknown: m.mortgage_unknown,
  };
  const rows = [
    [m.mortgage_forfait_share(), result.eigenwoningforfait],
    [m.mortgage_forfait_net_deduction(), result.netDeduction],
    [m.mortgage_annual(), result.realised.netBenefit],
    [m.mortgage_monthly(), result.realised.netBenefit / 12],
    [m.mortgage_nl_saving(), result.realised.nlTaxSaving],
    [m.mortgage_be_increase(), result.realised.beTaxIncrease],
    ...(!result.applied ? [[m.mortgage_potential(), result.potential.netBenefit] as const] : []),
  ] as const;
  return (
    <Card>
      <CardContent>
        <CardTitle>{m.mortgage_title()}</CardTitle>
        <Badge variant={result.status === "eligible" ? "thresholdInfo" : "thresholdWarning"}>
          {status[result.status]()}
        </Badge>
        <ul className="my-3 list-disc ps-5">
          {result.reasons.map((reason) => (
            <li key={reason}>{reasons[reason]()}</li>
          ))}
        </ul>
        <p className="mb-3">
          {result.nlTaxedPercentIsUpperBound
            ? m.mortgage_percent_upper({ percent: result.nlTaxedPercent })
            : m.mortgage_percent({ percent: result.nlTaxedPercent })}
        </p>
        <Table bordered>
          <TableBody>
            {rows.map(([label, amount]) => (
              <TableRow key={label}>
                <TableCell>{label}</TableCell>
                <TableCell className="text-end">{fmt(amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <h3 className="mt-4 font-semibold">{m.mortgage_assumptions()}</h3>
        <ul className="my-3 list-disc ps-5 text-sm text-text-muted">
          {result.assumptions.map((assumption) => (
            <li key={assumption}>{assumptions[assumption]()}</li>
          ))}
        </ul>
        <p className="text-sm text-text-muted">{m.mortgage_note()}</p>
        <Button
          variant="link"
          nativeButton={false}
          className="h-auto whitespace-normal px-0 text-start text-text underline"
          render={
            <a href="https://www.belastingdienst.nl/wps/wcm/connect/nl/buitenland/content/kwalificerend-buitenlands-belastingplichtige-hypotheekrente-aftrekken" />
          }
        >
          {m.mortgage_source()}
        </Button>
      </CardContent>
    </Card>
  );
}
