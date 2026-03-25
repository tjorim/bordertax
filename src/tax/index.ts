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

  // NL method (Dutch Belastingdienst): sick days count as NL workdays, so they are added to
  // both the numerator and denominator. The denominator therefore includes sick days.
  // Formula: (NL days + sick days) / (NL days + other days + sick days)
  const totalDaysNL = daysNL + daysOther + sickDays;
  const nlFractionNL = totalDaysNL > 0 ? (daysNL + sickDays) / totalDaysNL : 0;

  // BE method (Belgian FOD Financiën): sick days are excluded entirely from both the numerator
  // and the denominator. Compared to the NL method (where sick days are treated as NL workdays),
  // this means sick days are not attributed to NL at all, so the resulting NL fraction can be lower.
  // Formula: NL days / (NL days + other days)
  const totalDaysBE = daysNL + daysOther;
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
