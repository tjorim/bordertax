/**
 * Belgian personal income tax (personenbelasting / impôt des personnes physiques).
 *
 * For Belgian residents who work (partly) in the Netherlands under the BE-NL tax treaty.
 * Method used: Exemption with progression (vrijstelling met progressievoorbehoud).
 *   - NL-sourced income is exempt from Belgian tax.
 *   - Belgian federal tax is calculated on TOTAL world income, then scaled by the BE fraction.
 *   - Communal tax (gemeentebelasting) is levied on the Belgian federal tax portion.
 *
 * Sources:
 *   Brackets: https://fin.belgium.be/en/private-individuals/tax-return/income/tax-rates
 *   Sample calc: https://taxsummaries.pwc.com/belgium/individual/sample-personal-income-tax-calculation
 *   Forfait 2025: 30% up to €5,930  (AJ 2026)
 *
 * TODO: Refine regional supplements and special social security contribution
 *       once user spreadsheets are available.
 */
import type { TaxInputs, BETaxResult } from './types';

interface BEBracket {
  from: number;
  to: number;
  rate: number;
}

interface BEYearParams {
  brackets: BEBracket[];
  baseBelastingvrijeSom: number;
  childExtraAmounts: number[]; // [0 children, 1, 2, 3, 4] – index = number of dependent children
  extraPerChildAbove4: number;
  forfaitRate: number;
  forfaitMax: number;
}

const BE_PARAMS: Record<number, BEYearParams> = {
  2024: {
    // TODO: Verify 2024 values with user spreadsheets
    brackets: [
      { from: 0, to: 15820, rate: 0.25 },
      { from: 15820, to: 27920, rate: 0.40 },
      { from: 27920, to: 46740, rate: 0.45 },
      { from: 46740, to: Infinity, rate: 0.50 },
    ],
    baseBelastingvrijeSom: 10570,
    childExtraAmounts: [0, 1690, 4340, 9730, 15740],
    extraPerChildAbove4: 5990,
    forfaitRate: 0.30,
    forfaitMax: 5750,
  },
  2025: {
    brackets: [
      { from: 0, to: 16320, rate: 0.25 },
      { from: 16320, to: 28800, rate: 0.40 },
      { from: 28800, to: 48320, rate: 0.45 },
      { from: 48320, to: Infinity, rate: 0.50 },
    ],
    baseBelastingvrijeSom: 10910,
    childExtraAmounts: [0, 1740, 4490, 10070, 16270],
    extraPerChildAbove4: 6190,
    forfaitRate: 0.30,
    forfaitMax: 5930,
  },
  2026: {
    // TODO: Update with official 2026 figures when published
    brackets: [
      { from: 0, to: 16320, rate: 0.25 },
      { from: 16320, to: 28800, rate: 0.35 }, // proposed reform: 40→35
      { from: 28800, to: 48320, rate: 0.45 },
      { from: 48320, to: Infinity, rate: 0.50 },
    ],
    baseBelastingvrijeSom: 11200,
    childExtraAmounts: [0, 1790, 4620, 10360, 16740],
    extraPerChildAbove4: 6370,
    forfaitRate: 0.30,
    forfaitMax: 6100,
  },
};

function applyBEBrackets(income: number, brackets: BEBracket[]): number {
  let remaining = income;
  let tax = 0;
  for (const b of brackets) {
    if (remaining <= 0) break;
    const size = b.to === Infinity ? remaining : Math.min(remaining, b.to - b.from);
    tax += size * b.rate;
    remaining -= size;
  }
  return tax;
}

/**
 * Belgian belastingvrije som (tax-free allowance).
 * The actual tax reduction = 25% of the allowance amount.
 */
function belastingvrijeSomReduction(inputs: TaxInputs, p: BEYearParams): number {
  const n = Math.max(0, inputs.dependentChildren);
  const baseAmount = p.baseBelastingvrijeSom;
  const childAmount =
    n === 0
      ? 0
      : n <= 4
        ? p.childExtraAmounts[n]
        : p.childExtraAmounts[4] + (n - 4) * p.extraPerChildAbove4;

  return (baseAmount + childAmount) * 0.25;
}

export function calculateBETax(inputs: TaxInputs): BETaxResult | null {
  if (inputs.residentCountry !== 'BE') return null;

  const p = BE_PARAMS[inputs.year] ?? BE_PARAMS[2025];

  const totalDays = inputs.daysWorkedNL + inputs.daysWorkedBE;
  const beFraction = totalDays > 0 ? inputs.daysWorkedBE / totalDays : 0;

  const beIncome = inputs.grossSalary * beFraction;
  const nlExemptIncome = inputs.grossSalary - beIncome;

  // Professional expenses: forfait applied to Belgian-sourced income only
  const professionalExpenses = Math.min(beIncome * p.forfaitRate, p.forfaitMax);

  // Net total income (for the progression calculation over world income)
  const netTotalIncome = Math.max(0, inputs.grossSalary - professionalExpenses);

  // Federal tax calculated on total net world income (for progression)
  const taxOnTotalIncome = applyBEBrackets(netTotalIncome, p.brackets);

  // Personal exemption (belastingvrije som reduction)
  const bvReduction = belastingvrijeSomReduction(inputs, p);

  // Tax after personal exemption on total income
  const taxAfterPersonalExemption = Math.max(0, taxOnTotalIncome - bvReduction);

  // Scale to Belgian portion only (exemption with progression)
  const federalTax = taxAfterPersonalExemption * beFraction;

  // Communal (municipal) tax on top of federal tax
  const communalTax = federalTax * (inputs.communalTaxRate / 100);

  const netTaxBE = federalTax + communalTax;

  return {
    beIncome,
    nlExemptIncome,
    professionalExpenses,
    netTotalIncome,
    taxOnTotalIncome,
    belastingvrijeSomReduction: bvReduction,
    taxAfterPersonalExemption,
    beFraction,
    federalTax,
    communalTax,
    netTaxBE,
    effectiveRateBE: inputs.grossSalary > 0 ? netTaxBE / inputs.grossSalary : 0,
  };
}
