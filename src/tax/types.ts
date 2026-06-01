import type { TaxInputs } from "./schema";
export type { TaxInputs };

export interface BracketLine {
  label: string;
  rate: number;
  taxableAmount: number;
  tax: number;
}

export interface NLTaxResult {
  nlTaxableIncome: number;
  taxBeforeCredits: number;
  brackets: BracketLine[];
  algemeneHeffingskorting: number;
  arbeidskorting: number;
  totalCredits: number;
  volksverzekeringen: number;
  netTaxNL: number;
  /** Net tax as fraction of total gross salary */
  effectiveRateNL: number;
}

export interface BETaxResult {
  /** Declared income (code 1250): grossSalary − nl.netTaxNL */
  declaredIncome: number;
  /** Social contributions deducted */
  socialContributionsDeducted: number;
  /** Professional expenses (forfait) */
  professionalExpenses: number;
  /** Net professional income: declaredIncome − socialContributions − forfait */
  netProfessionalIncome: number;
  /** Non-NL-sourced income (BE + third-country days fraction of grossSalary). */
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
  nl: NLTaxResult;
  be: BETaxResult | null;
  grossIncome: number;
  totalTax: number;
  netIncome: number;
  effectiveRateTotal: number;
  /** NL income fraction according to the Dutch (NL) method: sick days count as NL workdays
   *  (added to both numerator and denominator).
   *  Formula: (NL days + sick days) / (NL days + other days + sick days) */
  nlFractionDutchMethod: number;
  /** NL income fraction according to the Belgian (BE) method: sick days excluded entirely from
   *  both numerator and denominator, typically yielding a lower NL fraction than the NL method
   *  (because sick days are not counted as NL workdays here).
   *  Formula: NL days / (NL days + other days) */
  nlFractionBelgianMethod: number;
}
