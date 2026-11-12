import type { TaxInputs } from "./schema";
import type { MortgageResult } from "./mortgage";
export type { TaxInputs };

export interface BracketLine {
  /** Lower bound of the bracket in euros (inclusive). */
  from: number;
  /** Upper bound in euros, or `null` for the open-ended top bracket (JSON has no Infinity). */
  to: number | null;
  rate: number;
  taxableAmount: number;
  tax: number;
}

export interface NLTaxResult {
  /** NL taxable income after any hypotheekrenteaftrek. */
  nlTaxableIncome: number;
  /** Net home deduction after eigenwoningforfait, capped at NL taxable income (0 when not applied). */
  mortgageDeduction: number;
  /** Tax added back because the deduction is relieved at a capped rate (aftrekbeperking). */
  mortgageRateCapSurcharge: number;
  /** "Deel niet in NL belast" — the aangifte field for the portion of Loon not taxed in NL,
   *  entered separately from Loon. Independent of the 30% ruling exemption. */
  deelNietInNLBelast: number;
  taxBeforeCredits: number;
  brackets: BracketLine[];
  algemeneHeffingskorting: number;
  arbeidskorting: number;
  totalCredits: number;
  volksverzekeringen: number;
  /** Income tax actually due, after the tax part of the heffingskortingen. */
  incomeTaxDue: number;
  /** Premies volksverzekeringen actually due, after the premium part of the heffingskortingen. */
  premiumsDue: number;
  netTaxNL: number;
  /** Net tax as fraction of the taxable wage */
  effectiveRateNL: number;
}

/**
 * The Dutch charge the rest of the calculation builds on: the app's estimate, or the figures on
 * the user's Dutch assessment. `TaxResult.nl` always stays the estimate.
 */
export interface DutchCharge {
  source: "estimate" | "assessment";
  /** Income tax due after the tax part of the heffingskortingen. */
  incomeTaxDue: number;
  /** Premies volksverzekeringen due after the premium part of the heffingskortingen. */
  premiumsDue: number;
  /** incomeTaxDue + premiumsDue; feeds code 1250, total tax and net income. */
  netTaxNL: number;
  /** Charge minus the app's estimate; always 0 for the estimate. */
  incomeTaxDifference: number;
  premiumsDifference: number;
  netTaxDifference: number;
}

/**
 * Money figures are rounded to whole cents when the result is built (full precision is kept
 * between calculation steps); no Belgian tax-rounding rule is claimed. Fractions (`beFraction`,
 * `effectiveRateBE`) are not rounded.
 */
export interface BETaxResult {
  /** Declared income (code 1250): taxable wage − Dutch income tax and premiums due (nlCharge) */
  declaredIncome: number;
  /** Dutch health-insurance premium deducted (code 1257) */
  healthInsurancePremiumDeducted: number;
  /** Professional expenses (forfait) */
  professionalExpenses: number;
  /** Net professional income: declaredIncome − healthInsurancePremium − forfait */
  netProfessionalIncome: number;
  /** Belgian-taxable part of the wage (box IV O.1): (taxable wage − premiums due) × fraction of days outside NL. */
  beIncome: number;
  /** NL-sourced wage (days in NL fraction of the taxable wage), for display purposes. */
  nlExemptIncome: number;
  /** Exempt income (with progression): vrijgesteld portion of netProfessionalIncome */
  vrijgesteld: number;
  /** Belgian-taxable portion of netProfessionalIncome */
  volTarief: number;
  /** Fraction of days worked outside NL (BE + third-country days). */
  beFraction: number;
  /** Belgian progressive tax on total netProfessionalIncome */
  basisbelasting: number;
  /** Personal allowance reduction */
  belastingvrijeSomReduction: number;
  /** Tax after personal exemption (omTeSlane) */
  omTeSlane: number;
  /** Reduction for exempt NL income */
  vrijstellingReduction: number;
  /** Net Belgian tax before federal/regional split */
  hoofdsom: number;
  /** Reduced federal portion (hoofdsom × gereduceerdRate) */
  gereduceerde: number;
  /** Regional portion (gereduceerde × gewestelijkeRate) */
  gewestelijke: number;
  /** Federal saldo after the supplementary-pension and withholding-tax reductions */
  saldoFederaal: number;
  /** Part of the federal reductions (supplementaryPension × 30% plus reclaimableWithholdingTax,
   *  code 1437) that exceeds the reduced federal portion. The saldo is clamped at zero and this part
   *  is not used or carried over by the estimate; 0 when the reductions are fully used. */
  federalReductionsUnused: number;
  /** Regional saldo after the service-voucher reduction */
  saldoGewestelijk: number;
  /** Total Belgian tax (saldoFederaal + saldoGewestelijk) */
  totaleBelasting: number;
  /** Communal tax on taxable portion */
  communalTax: number;
  /** Communal tax levied on the exempt (vrijgesteld) portion */
  communalTaxOnVrijgesteld: number;
  /** Federal saldo after reductions (saldoFederaal). */
  federalTax: number;
  netTaxBE: number;
  /** Net tax as fraction of the taxable wage */
  effectiveRateBE: number;
}

export interface TaxResult {
  inputs: TaxInputs;
  /** The app's own Dutch estimate, unaffected by any assessment figures entered. */
  nl: NLTaxResult;
  /** The Dutch charge used for the Belgian calculation, total tax and net income. */
  nlCharge: DutchCharge;
  be: BETaxResult | null;
  /** Taxable wage summed over all annual statements. */
  taxableWage: number;
  /** Dutch wage tax withheld, summed over all annual statements. */
  wageTaxWithheld: number;
  totalTax: number;
  netIncome: number;
  effectiveRateTotal: number;
  /** True when the entered workdays (NL, Belgium, other and sick days) add up to zero. There is
   *  then no basis to source the wage to either country, so the Dutch figures are all zero (no
   *  taxable income, premiums or credits) instead of presenting premiums and credits on no income;
   *  the figures only turn meaningful once workdays are entered. */
  noWorkdays: boolean;
  /** NL income fraction according to the Dutch (NL) method: a sick day counts for the country it
   *  was scheduled in, so sick days scheduled in NL are NL workdays and all sick days are in the
   *  denominator.
   *  Formula: (NL days + sick days in NL) / (NL + BE + other days + all sick days) */
  nlFractionDutchMethod: number;
  /** NL income fraction according to the Belgian (BE) method: all sick days excluded from both
   *  numerator and denominator, wherever they were scheduled.
   *  Formula: NL days / (NL + BE + other days) */
  nlFractionBelgianMethod: number;
  /** Home/mortgage scenario outcome; null when the scenario is not enabled. */
  mortgage: MortgageResult | null;
}
