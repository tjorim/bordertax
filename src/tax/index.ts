import type { TaxInputs, TaxResult } from "./types";
import { calculateNLTax } from "./nl";
import { calculateBETax } from "./be";
import { getNLFractions } from "./workdays";

export function calculate(inputs: TaxInputs): TaxResult {
  const nl = calculateNLTax(inputs);
  const be = calculateBETax(inputs, nl);

  const totalTax = nl.netTaxNL + (be?.netTaxBE ?? 0);
  const netIncome = inputs.grossSalary - totalTax;

  const { nlFractionDutchMethod, nlFractionBelgianMethod } = getNLFractions(inputs);

  return {
    inputs,
    nl,
    be,
    grossIncome: inputs.grossSalary,
    totalTax,
    netIncome,
    effectiveRateTotal: inputs.grossSalary > 0 ? totalTax / inputs.grossSalary : 0,
    nlFractionDutchMethod,
    nlFractionBelgianMethod,
  };
}

export type { TaxInputs, TaxResult, NLTaxResult, BETaxResult, BracketLine } from "./types";
