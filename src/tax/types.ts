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
  /** Net tax as fraction of total gross salary */
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
  /** Declared income (code 1250): grossSalary − Dutch income tax and premiums due (nlCharge) */
  declaredIncome: number;
  /** Social contributions deducted */
  socialContributionsDeducted: number;
  /** Professional expenses (forfait) */
  professionalExpenses: number;
  /** Net professional income: declaredIncome − socialContributions − forfait */
  netProfessionalIncome: number;
  /** Belgian-taxable part of the wage (box IV O.1): (grossSalary − premiums due) × fraction of days outside NL. */
  beIncome: number;
  /** NL-sourced gross income (days in NL fraction of grossSalary), for display purposes. */
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
  /** Federal saldo after pension and roerende voorheffing reductions */
  saldoFederaal: number;
  /** Part of the federal reductions (aanvullend pensioen × 30% plus roerende voorheffing, code
   *  1437) that exceeds the reduced federal portion. The saldo is clamped at zero and this part
   *  is not used or carried over by the estimate; 0 when the reductions are fully used. */
  federalReductionsUnused: number;
  /** Regional saldo after dienstencheques reduction */
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
  /** Net tax as fraction of total gross salary */
  effectiveRateBE: number;
}

export interface TaxResult {
  inputs: TaxInputs;
  /** The app's own Dutch estimate, unaffected by any assessment figures entered. */
  nl: NLTaxResult;
  /** The Dutch charge used for the Belgian calculation, total tax and net income. */
  nlCharge: DutchCharge;
  be: BETaxResult | null;
  grossIncome: number;
  totalTax: number;
  netIncome: number;
  effectiveRateTotal: number;
  /** True when the entered workdays (NL, Belgium, other and sick days) add up to zero. There is
   *  then no basis to source the wage to either country, so the Dutch figures are all zero (no
   *  taxable income, premiums or credits) instead of presenting premiums and credits on no income;
   *  the figures only turn meaningful once workdays are entered. */
  noWorkdays: boolean;
  /** NL income fraction according to the Dutch (NL) method: sick days count as NL workdays
   *  (added to both numerator and denominator).
   *  Formula: (NL days + sick days) / (NL days + other days + sick days) */
  nlFractionDutchMethod: number;
  /** NL income fraction according to the Belgian (BE) method: sick days excluded entirely from
   *  both numerator and denominator, typically yielding a lower NL fraction than the NL method
   *  (because sick days are not counted as NL workdays here).
   *  Formula: NL days / (NL days + other days) */
  nlFractionBelgianMethod: number;
  /** Home/mortgage scenario outcome; null when the scenario is not enabled. */
  mortgage: MortgageResult | null;
}
