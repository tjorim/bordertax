import type { BETaxResult, NLTaxResult, TaxInputs, TaxResult } from '../tax/types';

export const mockInputs: TaxInputs = {
  year: 2025,
  residentCountry: 'BE',
  civilStatus: 'single',
  dependentChildren: 0,
  belowAOWAge: true,
  belgianRegion: 'flemish',
  communalTaxRate: 7,
  grossSalary: 60000,
  daysWorkedNL: 200,
  daysWorkedBE: 20,
  thirtyPercentRuling: false,
};

export const mockNLResult: NLTaxResult = {
  nlTaxableIncome: 54545.45,
  taxBeforeCredits: 17000,
  brackets: [
    { label: '€0 – €38.441', rate: 0.3582, taxableAmount: 38441, tax: 13773.56 },
    { label: '€38.441 – €76.817', rate: 0.3748, taxableAmount: 16104.45, tax: 6033.95 },
  ],
  algemeneHeffingskorting: 0,
  arbeidskorting: 4500,
  totalCredits: 4500,
  netTaxNL: 12500,
  effectiveRateNL: 0.2083,
};

export const mockBEResult: BETaxResult = {
  beIncome: 5454.55,
  nlExemptIncome: 54545.45,
  professionalExpenses: 1636.36,
  netTotalIncome: 58363.64,
  taxOnTotalIncome: 20000,
  belastingvrijeSomReduction: 2727.5,
  taxAfterPersonalExemption: 17272.5,
  beFraction: 0.0909,
  federalTax: 1570.1,
  communalTax: 109.91,
  netTaxBE: 1680.01,
  effectiveRateBE: 0.028,
};

export const mockTaxResult: TaxResult = {
  inputs: mockInputs,
  nl: mockNLResult,
  be: mockBEResult,
  grossIncome: 60000,
  totalTax: 14180.01,
  netIncome: 45819.99,
  effectiveRateTotal: 0.2363,
};

export const mockTaxResultNLResident: TaxResult = {
  inputs: { ...mockInputs, residentCountry: 'NL' },
  nl: mockNLResult,
  be: null,
  grossIncome: 60000,
  totalTax: 12500,
  netIncome: 47500,
  effectiveRateTotal: 0.2083,
};
