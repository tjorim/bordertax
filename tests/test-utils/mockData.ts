import type { BETaxResult, NLTaxResult, TaxInputs, TaxResult } from "@/tax/types";

export const mockInputs: TaxInputs = {
  year: 2025,
  residentCountry: "BE",
  civilStatus: "single",
  dependentChildren: 0,
  belowAOWAge: true,
  belgianRegion: "flemish",
  communalTaxRate: 7,
  grossSalary: 60000,
  daysWorkedNL: 200,
  daysWorkedBE: 20,
  thirtyPercentRuling: false,
  socialContributions: 0,
  aanvullendPensioen: 0,
  dienstencheques: 0,
  roerendeVoorheffing: 0,
};

export const mockNLResult: NLTaxResult = {
  nlTaxableIncome: 54545.45,
  taxBeforeCredits: 19807.51,
  brackets: [
    { label: "€0 – €38.441", rate: 0.3582, taxableAmount: 38441, tax: 13773.56 },
    { label: "€38.441 – €76.817", rate: 0.3748, taxableAmount: 16104.45, tax: 6033.95 },
  ],
  algemeneHeffingskorting: 0,
  arbeidskorting: 4500,
  totalCredits: 4500,
  volksverzekeringen: 10000,
  netTaxNL: 15307.51,
  effectiveRateNL: 0.2806,
};

export const mockBEResult: BETaxResult = {
  declaredIncome: 44692.49,
  socialContributionsDeducted: 0,
  beIncome: 5454.55,
  nlExemptIncome: 54545.45,
  vrijgesteld: 53057.85,
  volTarief: 5305.79,
  professionalExpenses: 1636.36,
  netProfessionalIncome: 43056.13,
  basisbelasting: 20000,
  belastingvrijeSomReduction: 2727.5,
  omTeSlane: 17272.5,
  vrijstellingReduction: 15702.4,
  hoofdsom: 1570.1,
  gereduceerde: 1178,
  gewestelijke: 392.1,
  saldoFederaal: 1178,
  saldoGewestelijk: 392.1,
  totaleBelasting: 1570.1,
  beFraction: 0.0909,
  federalTax: 1570.1,
  communalTax: 109.91,
  communalTaxOnVrijgesteld: 1099.17,
  netTaxBE: 2779.18,
  effectiveRateBE: 0.0463,
};

export const mockTaxResult: TaxResult = {
  inputs: mockInputs,
  nl: mockNLResult,
  be: mockBEResult,
  grossIncome: 60000,
  totalTax: 18086.69,
  netIncome: 41913.31,
  effectiveRateTotal: 0.3014,
};

export const mockTaxResultNLResident: TaxResult = {
  inputs: { ...mockInputs, residentCountry: "NL" },
  nl: mockNLResult,
  be: null,
  grossIncome: 60000,
  totalTax: 15307.51,
  netIncome: 44692.49,
  effectiveRateTotal: 0.2551,
};
