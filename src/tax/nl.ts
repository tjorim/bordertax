/**
 * Dutch income tax (Box 1) calculation.
 *
 * Volksverzekeringen (social premiums) are calculated separately on worldwide Box 1 income,
 * approximated here by the taxable wage less the mortgage deduction.
 *
 * Income-tax-only bracket rates are derived from the combined rates by subtracting
 * the social premium rate (27.65% for under-AOW, 9.75% for over-AOW).
 *
 * Belgian residents who are insured in the Netherlands receive both heffingskortingen, each split
 * into a tax part and a premium part so that income tax due and premiums due can be reported apart.
 *
 * Year-specific rates live in one module per income year in src/tax/years, assembled by params.ts.
 */
import type { TaxInputs, NLTaxResult, BracketLine, DutchCharge } from "./types";
import {
  isThirtyPercentRulingSupportedResident,
  NL_THIRTY_PERCENT_RULING_TAXABLE_RESIDUAL,
} from "./constants";
import { getYearParams } from "./params";
import type { NLBracket, NLYearParams } from "./params";
import { sumAnnualStatements } from "./statements";
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
      from: b.from,
      to: b.to === Infinity ? null : b.to,
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
 * @param mortgageDeduction Net home deduction (interest share minus forfait share, floored at zero).
 *   Callers decide eligibility; this applies the deduction to income tax and premium income.
 *   Labour credits remain based on employment income.
 * @param grossInterest Gross deductible interest share, before subtracting the forfait, for the rate cap.
 */
export function calculateNLTax(
  inputs: TaxInputs,
  mortgageDeduction = 0,
  grossInterest = mortgageDeduction,
): NLTaxResult {
  const yearData = getYearParams(inputs.year).nl;
  const p = inputs.belowAOWAge ? yearData.under : yearData.over;

  const { nlFractionDutchMethod: nlFraction, noWorkdays } = getNLFractions(inputs);
  // All annual statements are taxed together: one wage, one set of credits and premiums.
  const { taxableWage } = sumAnnualStatements(inputs.annualStatements);

  // Without workdays nothing is sourced to the Netherlands: no taxable income, so also no
  // premiums and no credits (they would otherwise be charged and applied on income that is not
  // there). `TaxResult.noWorkdays` tells the caller; the figures only mean something once
  // workdays are entered.
  if (noWorkdays) {
    return {
      nlTaxableIncome: 0,
      mortgageDeduction: 0,
      mortgageRateCapSurcharge: 0,
      deelNietInNLBelast: taxableWage,
      taxBeforeCredits: 0,
      brackets: [],
      algemeneHeffingskorting: 0,
      arbeidskorting: 0,
      totalCredits: 0,
      volksverzekeringen: 0,
      incomeTaxDue: 0,
      premiumsDue: 0,
      netTaxNL: 0,
      effectiveRateNL: 0,
    };
  }

  // "Deel niet in NL belast": entered as its own field on the NL aangifte, separate from Loon.
  // Computed independently of the 30% ruling, which is a distinct exemption on the form.
  const nlTaxableIncomeBeforeRuling = Math.round(taxableWage * nlFraction);
  const deelNietInNLBelast = taxableWage - nlTaxableIncomeBeforeRuling;

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
    incomeBeforeMortgage + Math.max(0, grossInterest - mortgageDeduction),
    Math.max(0, grossInterest),
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
  const premiumIncome = Math.max(0, taxableWage - Math.max(0, mortgageDeduction));
  const volksverzekeringen = Math.floor(
    Math.min(premiumIncome, p.socialPremiumMax) * p.socialPremiumRate,
  );

  // Each credit has a tax part and a premium part (Belastingdienst, "Heffingskortingen"), in
  // proportion to the first-bracket rates (2025: 8.17 / 35.82 tax, 27.65 / 35.82 premiums). A
  // Belgian resident insured in the Netherlands receives both credits; the Belastingdienst lists
  // the algemene heffingskorting for residents of Belgium
  // (belastingdienst.nl, "Ik woon niet in Nederland: welke aftrekposten en kortingen heb ik?").
  //
  // The two parts use different incomes: the tax part the full wage (worldwide income of a
  // qualifying non-resident), the premium part only the income taxed in the Netherlands (the
  // workday fraction). Each part is rounded up. This reproduces the arbeidskorting of a
  // definitieve aanslag 2024 and the algemene heffingskorting of one for 2023 to the euro. The
  // arbeidskorting on that 2023 assessment (issued July 2026) still used the full wage for both
  // parts, so assessments issued before the Belastingdienst applied the Hoge Raad rulings on
  // heffingskortingen can come out lower than this estimate (docs/tax-model.md, Known gaps).
  const firstBracketRate = p.incomeTaxBrackets[0]?.rate ?? 0;
  const taxShare = firstBracketRate / (firstBracketRate + p.socialPremiumRate);
  const creditParts = (credit: (income: number, params: NLYearParams) => number) => {
    const onWage = credit(taxableWage, p);
    // Nothing is untaxed in the Netherlands: one basis, so the table value stands and is only split.
    if (incomeBeforeMortgage >= taxableWage) {
      const tax = Math.round(onWage * taxShare);
      return { tax, premium: onWage - tax };
    }
    return {
      tax: Math.ceil(onWage * taxShare),
      premium: Math.ceil(credit(incomeBeforeMortgage, p) * (1 - taxShare)),
    };
  };
  const akParts = creditParts(calcAK);
  const ahkParts = creditParts(calcAHK);
  const ak = akParts.tax + akParts.premium;
  const ahk = ahkParts.tax + ahkParts.premium;
  const taxPartOfCredits = akParts.tax + ahkParts.tax;
  const premiumPartOfCredits = akParts.premium + ahkParts.premium;

  // Credits are capped at income tax plus premiums; a capped credit shrinks both parts together.
  const totalCredits = Math.min(ahk + ak, taxBeforeCredits + volksverzekeringen);
  const netTaxNL = Math.max(0, taxBeforeCredits + volksverzekeringen - totalCredits);
  const scale = ahk + ak > 0 ? totalCredits / (ahk + ak) : 0;

  // A part that exceeds what it is set against is used against the other charge, so the two
  // charges always add up to netTaxNL.
  const taxCreditOverflow = Math.max(0, taxPartOfCredits * scale - taxBeforeCredits);
  const premiumCreditOverflow = Math.max(0, premiumPartOfCredits * scale - volksverzekeringen);
  const incomeTaxDue = Math.max(
    0,
    taxBeforeCredits - taxPartOfCredits * scale - premiumCreditOverflow,
  );
  const premiumsDue = Math.max(
    0,
    volksverzekeringen - premiumPartOfCredits * scale - taxCreditOverflow,
  );

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
    incomeTaxDue,
    premiumsDue,
    netTaxNL,
    effectiveRateNL: taxableWage > 0 ? netTaxNL / taxableWage : 0,
  };
}

/**
 * The single place where the Dutch assessment replaces the estimate. When both assessment figures
 * are present they stand in for `nl.incomeTaxDue`/`nl.premiumsDue` everywhere downstream (code
 * 1250, the O.1/O.2 split, total tax, net income); `nl` itself is left as the app's estimate. A
 * lone figure is ignored (the strict schema rejects it; the lenient form schema keeps it).
 */
export function resolveDutchCharge(inputs: TaxInputs, nl: NLTaxResult): DutchCharge {
  const { assessmentIncomeTaxDue, assessmentPremiumsDue } = inputs;
  if (assessmentIncomeTaxDue === undefined || assessmentPremiumsDue === undefined) {
    return {
      source: "estimate",
      incomeTaxDue: nl.incomeTaxDue,
      premiumsDue: nl.premiumsDue,
      netTaxNL: nl.netTaxNL,
      incomeTaxDifference: 0,
      premiumsDifference: 0,
      netTaxDifference: 0,
    };
  }
  const incomeTaxDue = Math.max(0, assessmentIncomeTaxDue);
  const premiumsDue = Math.max(0, assessmentPremiumsDue);
  const netTaxNL = incomeTaxDue + premiumsDue;
  return {
    source: "assessment",
    incomeTaxDue,
    premiumsDue,
    netTaxNL,
    incomeTaxDifference: incomeTaxDue - nl.incomeTaxDue,
    premiumsDifference: premiumsDue - nl.premiumsDue,
    netTaxDifference: netTaxNL - nl.netTaxNL,
  };
}
