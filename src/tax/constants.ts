import { SUPPORTED_YEARS, type SupportedYear } from "./years";
import { BE_PENSION_REDUCTION_RATE, BE_TAX_FREE_ALLOWANCE_REDUCTION_RATE } from "./years/shared";

/** Supported income years, derived from the modules in `src/tax/years`. */
export const VALID_YEARS: readonly SupportedYear[] = SUPPORTED_YEARS;
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

// Policy rates used in the tax engines, declared in years/shared.ts next to the other shared
// parameters. Rates that vary by year live in the year modules.
export { BE_PENSION_REDUCTION_RATE, BE_TAX_FREE_ALLOWANCE_REDUCTION_RATE };
export const NL_THIRTY_PERCENT_RULING_TAXABLE_RESIDUAL = 0.7;

/**
 * The app's Belgian-resident cross-border profile does not support the expatregeling:
 * Belgian residents normally fail its 150 km recruitment-residence condition. A future
 * NL-resident flow may expose this only for users with a valid Belastingdienst beschikking.
 */
export function isThirtyPercentRulingSupportedResident(residentCountry: string): boolean {
  return residentCountry === "NL";
}

export type TaxYear = SupportedYear;
export type ResidentCountry = (typeof VALID_RESIDENT_COUNTRIES)[number];
export type CivilStatus = (typeof VALID_CIVIL_STATUSES)[number];
export type BelgianRegion = (typeof VALID_BELGIAN_REGIONS)[number];

/** Share of worldwide income that must be taxed in NL to be a kwalificerend buitenlands belastingplichtige. */
export const MORTGAGE_QUALIFYING_MIN_NL_PERCENT = 90;
