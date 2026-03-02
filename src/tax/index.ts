import type { TaxInputs, TaxResult } from './types';
import { calculateNLTax } from './nl';
import { calculateBETax } from './be';

export function calculate(inputs: TaxInputs): TaxResult {
  const nl = calculateNLTax(inputs);
  const be = calculateBETax(inputs);

  const totalTax = nl.netTaxNL + (be?.netTaxBE ?? 0);
  const netIncome = inputs.grossSalary - totalTax;

  return {
    inputs,
    nl,
    be,
    grossIncome: inputs.grossSalary,
    totalTax,
    netIncome,
    effectiveRateTotal: inputs.grossSalary > 0 ? totalTax / inputs.grossSalary : 0,
  };
}

export type { TaxInputs, TaxResult, NLTaxResult, BETaxResult, BracketLine } from './types';
