export const VALID_YEARS = [2020, 2021, 2022, 2023, 2024, 2025] as const;
export const VALID_RESIDENT_COUNTRIES = [
  "BE",
  // "NL",
] as const;
export const VALID_CIVIL_STATUSES = [
  "single",
  // "married",
] as const;
export const VALID_BELGIAN_REGIONS = [
  "flemish",
  // "walloon",
  // "brussels",
] as const;

// Policy rates used in the tax engines. Keep year-scoping in params.ts for rates that vary by year.
export const BE_TAX_FREE_ALLOWANCE_REDUCTION_RATE = 0.25;
export const BE_PENSION_REDUCTION_RATE = 0.3;
export const BE_SERVICE_VOUCHER_REDUCTION_RATE = 0.2;
export const NL_THIRTY_PERCENT_RULING_TAXABLE_RESIDUAL = 0.7;

export type TaxYear = (typeof VALID_YEARS)[number];
export type ResidentCountry = (typeof VALID_RESIDENT_COUNTRIES)[number];
export type CivilStatus = (typeof VALID_CIVIL_STATUSES)[number];
export type BelgianRegion = (typeof VALID_BELGIAN_REGIONS)[number];
