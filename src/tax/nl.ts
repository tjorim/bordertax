/**
 * Dutch income tax (Box 1) calculation.
 *
 * Volksverzekeringen (social premiums) are calculated separately on worldwide Box 1 income,
 * approximated here by gross salary less the mortgage deduction.
 *
 * Income-tax-only bracket rates are derived from the combined rates by subtracting
 * the social premium rate (27.65% for under-AOW, 9.75% for over-AOW).
 *
 * For Belgian residents, algemeneHeffingskorting (AHK) is 0 per Belastingdienst
 * policy for buitenlandse belastingplichtigen.
 *
 * Year-specific rates are in params.ts — that is the only file that needs updating each year.
 */
import type { TaxInputs, NLTaxResult, BracketLine } from "./types";
import {
  isThirtyPercentRulingSupportedResident,
  NL_THIRTY_PERCENT_RULING_TAXABLE_RESIDUAL,
} from "./constants";
import { TAX_PARAMS } from "./params";
import type { NLBracket, NLYearParams } from "./params";
import { getNLFractions } from "./workdays";

function applyBrackets(
  income: number,
  brackets: NLBracket[],
): { lines: BracketLine[]; total: number } {
  let remaining = income;
  let total = 0;
  const lines: BracketLine[] = [];

  for (const b of brackets) {
    if (remaining <= 0) break;
    const size = b.to === Infinity ? remaining : Math.min(remaining, b.to - b.from);
    const tax = Math.floor(size * b.rate);
    lines.push({
      label:
        b.to === Infinity
          ? `> €${b.from.toLocaleString("nl-NL")}`
          : `€${b.from.toLocaleString("nl-NL")} – €${b.to.toLocaleString("nl-NL")}`,
      rate: b.rate,
      taxableAmount: size,
      tax,
    });
    total += tax;
    remaining -= size;
  }

  return { lines, total };
}

function calcAHK(income: number, p: NLYearParams): number {
  if (income <= p.ahkPhaseOutStart) return p.ahkMax;
  if (income >= p.ahkPhaseOutEnd) return 0;
  return Math.ceil(Math.max(0, p.ahkMax - (income - p.ahkPhaseOutStart) * p.ahkPhaseOutRate));
}

function calcAK(income: number, p: NLYearParams): number {
  for (const stage of p.akStages) {
    if (income >= stage.from && income < stage.to) {
      return Math.ceil(Math.max(0, stage.baseAmount + (income - stage.from) * stage.rate));
    }
  }
  return 0;
}

/**
 * Extra tax from capping the rate at which a deduction is relieved (aftrekbeperking).
 * The deduction removes the top `deduction` euros of income; any part of it that sat in a
 * bracket taxed above `rateCap` only gets relief at `rateCap`, so the difference is added back.
 */
function rateCapSurcharge(
  incomeBeforeDeduction: number,
  deduction: number,
  brackets: NLBracket[],
  rateCap: number,
): number {
  const low = incomeBeforeDeduction - deduction;
  let surcharge = 0;
  for (const b of brackets) {
    if (b.rate <= rateCap) continue;
    const overlap = Math.min(incomeBeforeDeduction, b.to) - Math.max(low, b.from);
    if (overlap > 0) surcharge += overlap * (b.rate - rateCap);
  }
  return Math.round(surcharge);
}

/**
 * @param mortgageDeduction Eigen-woning interest to deduct from NL taxable income (hypotheekrenteaftrek).
 *   Callers decide eligibility; this applies the deduction to income tax and premium income.
 *   Labour credits remain based on employment income.
 */
export function calculateNLTax(inputs: TaxInputs, mortgageDeduction = 0): NLTaxResult {
  const yearData = TAX_PARAMS[inputs.year]?.nl ?? TAX_PARAMS[2025].nl;
  const p = inputs.belowAOWAge ? yearData.under : yearData.over;

  const { nlFractionDutchMethod: nlFraction } = getNLFractions(inputs);

  // "Deel niet in NL belast": entered as its own field on the NL aangifte, separate from Loon.
  // Computed independently of the 30% ruling, which is a distinct exemption on the form.
  const nlTaxableIncomeBeforeRuling = Math.round(inputs.grossSalary * nlFraction);
  const deelNietInNLBelast = inputs.grossSalary - nlTaxableIncomeBeforeRuling;

  let nlTaxableIncome = nlTaxableIncomeBeforeRuling;

  if (
    isThirtyPercentRulingSupportedResident(inputs.residentCountry) &&
    inputs.thirtyPercentRuling
  ) {
    // 30% of the income is tax-free; only 70% is taxed
    nlTaxableIncome = Math.round(nlTaxableIncome * NL_THIRTY_PERCENT_RULING_TAXABLE_RESIDUAL);
  }

  // Hypotheekrenteaftrek: cannot take taxable income below zero.
  const incomeBeforeMortgage = nlTaxableIncome;
  const appliedMortgageDeduction = Math.min(Math.max(0, mortgageDeduction), incomeBeforeMortgage);
  nlTaxableIncome -= appliedMortgageDeduction;
  const mortgageRateCapSurcharge = rateCapSurcharge(
    incomeBeforeMortgage,
    appliedMortgageDeduction,
    p.incomeTaxBrackets,
    yearData.mortgageDeductionRateCap,
  );

  // Income tax only — applied to NL-fraction income
  const { lines: brackets, total: bracketTax } = applyBrackets(
    nlTaxableIncome,
    p.incomeTaxBrackets,
  );
  const taxBeforeCredits = bracketTax + mortgageRateCapSurcharge;

  // Premium income is worldwide Box 1 income after deductions, not the NL workday fraction.
  // Belastingdienst Fiscale informatie 2020–2025, "U woont buiten Nederland", Gevolgen premieplicht.
  const premiumIncome = Math.max(0, inputs.grossSalary - Math.max(0, mortgageDeduction));
  const volksverzekeringen = Math.floor(
    Math.min(premiumIncome, p.socialPremiumMax) * p.socialPremiumRate,
  );

  // AHK: 0 for Belgian residents (buitenlandse belastingplichtige policy)
  const ahk = inputs.residentCountry === "BE" ? 0 : calcAHK(inputs.grossSalary, p);

  // AK: always calculated on full gross salary (verified from Belastingdienst aanslag)
  const ak = calcAK(inputs.grossSalary, p);

  const totalCredits = Math.min(ahk + ak, taxBeforeCredits + volksverzekeringen);
  const netTaxNL = Math.max(0, taxBeforeCredits + volksverzekeringen - totalCredits);

  return {
    nlTaxableIncome,
    mortgageDeduction: appliedMortgageDeduction,
    mortgageRateCapSurcharge,
    deelNietInNLBelast,
    taxBeforeCredits,
    brackets,
    algemeneHeffingskorting: ahk,
    arbeidskorting: ak,
    totalCredits,
    volksverzekeringen,
    netTaxNL,
    effectiveRateNL: inputs.grossSalary > 0 ? netTaxNL / inputs.grossSalary : 0,
  };
}
