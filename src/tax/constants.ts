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

export type TaxYear = (typeof VALID_YEARS)[number];
export type ResidentCountry = (typeof VALID_RESIDENT_COUNTRIES)[number];
export type CivilStatus = (typeof VALID_CIVIL_STATUSES)[number];
export type BelgianRegion = (typeof VALID_BELGIAN_REGIONS)[number];
