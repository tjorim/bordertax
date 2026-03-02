export type TaxYear = 2024 | 2025 | 2026;
export type ResidentCountry = 'NL' | 'BE';
export type CivilStatus = 'single' | 'married';
export type BelgianRegion = 'flemish' | 'walloon' | 'brussels';

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
  thirtyPercentRuling: boolean;
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
  netTaxNL: number;
  /** Net tax as fraction of total gross salary */
  effectiveRateNL: number;
}

export interface BETaxResult {
  beIncome: number;
  nlExemptIncome: number;
  professionalExpenses: number;
  netTotalIncome: number;
  taxOnTotalIncome: number;
  belastingvrijeSomReduction: number;
  taxAfterPersonalExemption: number;
  beFraction: number;
  federalTax: number;
  communalTax: number;
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
