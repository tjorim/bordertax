export type TaxYear = 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026;
export type ResidentCountry = "NL" | "BE";
export type CivilStatus = "single" | "married";
export type BelgianRegion = "flemish" | "walloon" | "brussels";

export interface TaxInputs {
  year: TaxYear;
  residentCountry: ResidentCountry;
  civilStatus: CivilStatus;
  dependentChildren: number;
  belowAOWAge: boolean;
  belgianRegion: BelgianRegion;
  /** Municipal tax rate as a percentage, e.g. 7 for 7%. Typical Belgian range: 0–9%. */
  communalTaxRate: number;
  grossSalary: number;
  daysWorkedNL: number;
  daysWorkedBE: number;
  /** Days worked in a third country (e.g. customer installation in France).
   *  Belgium treats these identically to Belgian days (vol tarief) since the NL-BE treaty
   *  only covers NL-sourced income. Default 0. */
  daysWorkedOther?: number;
  thirtyPercentRuling: boolean;
  /** Belgian social contributions (eigen bijdragen) — deductible from Belgian declared income. Default 0. */
  socialContributions?: number;
  /** Supplementary pension contributions (code 1285) — 30% reduction applies. Default 0. */
  aanvullendPensioen?: number;
  /** Diensten-cheques amount (code 3364) — 20% reduction applies. Default 0. */
  dienstencheques?: number;
  /** Roerende voorheffing / withholding tax already paid (code 1437). Default 0. */
  roerendeVoorheffing?: number;
  /** NL wage tax withheld by employer (ingehouden loonheffing from jaaropgave).
   *  Used to compute NL refund/payment and net eindafrekening. Default 0. */
  withheldTaxNL?: number;
}

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
  /** Belgian-sourced income (days in BE fraction of grossSalary) */
  beIncome: number;
  /** NL-sourced gross income (days in NL fraction of grossSalary), for display purposes. */
  nlExemptIncome: number;
  /** Exempt income (with progression): vrijgesteld portion of netProfessionalIncome */
  vrijgesteld: number;
  /** Belgian-taxable portion of netProfessionalIncome */
  volTarief: number;
  /** Fraction of days worked in BE */
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
  /** Federal + regional saldo combined */
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
}
