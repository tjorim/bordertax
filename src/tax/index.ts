import type { TaxInputs, TaxResult } from "./types";
import { calculateNLTax } from "./nl";
import { calculateBETax } from "./be";

export function calculate(inputs: TaxInputs): TaxResult {
  const nl = calculateNLTax(inputs);
  const be = calculateBETax(inputs, nl);

  const totalTax = nl.netTaxNL + (be?.netTaxBE ?? 0);
  const netIncome = inputs.grossSalary - totalTax;

  const daysNL = Math.max(0, inputs.daysWorkedNL);
  const daysOther = Math.max(0, inputs.daysWorkedBE ?? 0) + Math.max(0, inputs.daysWorkedOther ?? 0);
  const sickDays = Math.max(0, inputs.sickDays ?? 0);

  // NL method: sick days are excluded from the denominator entirely
  const totalDaysNL = daysNL + daysOther;
  const nlFractionNL = totalDaysNL > 0 ? daysNL / totalDaysNL : 0;

  // BE method: sick days are added to the denominator, reducing the NL fraction
  const totalDaysBE = daysNL + daysOther + sickDays;
  const nlFractionBE = totalDaysBE > 0 ? daysNL / totalDaysBE : 0;

  return {
    inputs,
    nl,
    be,
    grossIncome: inputs.grossSalary,
    totalTax,
    netIncome,
    effectiveRateTotal: inputs.grossSalary > 0 ? totalTax / inputs.grossSalary : 0,
    nlFractionNL,
    nlFractionBE,
  };
}

export type { TaxInputs, TaxResult, NLTaxResult, BETaxResult, BracketLine } from "./types";
