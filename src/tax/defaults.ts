import { SINGLE_VALUE_DEFAULTS, type AnnualStatement, type TaxInputs } from "./schema";

/** A fresh annual statement, added by "Add another annual statement". */
export const EMPTY_ANNUAL_STATEMENT: AnnualStatement = { taxableWage: 0, wageTaxWithheld: 0 };

export const DEFAULT_INPUTS: TaxInputs = {
  year: 2025,
  ...SINGLE_VALUE_DEFAULTS,
  dependentChildren: 0,
  belowAOWAge: true,
  communalTaxRate: 7,
  annualStatements: [{ taxableWage: 60000, wageTaxWithheld: 0 }],
  daysWorkedNL: 200,
  daysWorkedBE: 20,
  daysWorkedOther: 0,
  sickDaysNL: 0,
  sickDaysOutsideNL: 0,
  healthInsurancePremium: 0,
  supplementaryPension: 0,
  exchangedGrossWage: 0,
  commutingAllowance: 0,
  serviceVouchers: 0,
  reclaimableWithholdingTax: 0,
  mortgageEnabled: false,
};
