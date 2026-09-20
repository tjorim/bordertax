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
export const NL_THIRTY_PERCENT_RULING_TAXABLE_RESIDUAL = 0.7;

/**
 * The app's Belgian-resident cross-border profile does not support the expatregeling:
 * Belgian residents normally fail its 150 km recruitment-residence condition. A future
 * NL-resident flow may expose this only for users with a valid Belastingdienst beschikking.
 */
export function isThirtyPercentRulingSupportedResident(residentCountry: string): boolean {
  return residentCountry === "NL";
}

export type TaxYear = (typeof VALID_YEARS)[number];
export type ResidentCountry = (typeof VALID_RESIDENT_COUNTRIES)[number];
export type CivilStatus = (typeof VALID_CIVIL_STATUSES)[number];
export type BelgianRegion = (typeof VALID_BELGIAN_REGIONS)[number];
