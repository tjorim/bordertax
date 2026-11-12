/**
 * Tax parameters by income year (inkomstenjaar / année de revenus), assembled from the modules in
 * `src/tax/years`. Adding a year means adding a module there, not editing this file; see
 * docs/adding-an-income-year.md.
 *
 * Dutch income-tax-only rates = combined rate − social premium rate (27.65% under AOW / 9.75% over).
 * Belgian assessment year (AJ) = income year + 1. Flemish opcentiemen = 33.257%, stable since 2018.
 * 2026 note: the proposed 40%→35% Belgian bracket reform was not enacted for income year 2026.
 * Sources and verification notes are recorded per year and per table in each module's `sources`.
 */
import type { TaxYear } from "./constants";
import { YEAR_MODULES } from "./years";
import type { EigenwoningforfaitParams, YearParams } from "./years/types";

export type {
  AKStage,
  BEBracket,
  BEYearParams,
  EigenwoningforfaitParams,
  NLBracket,
  NLYearParams,
  YearParams,
} from "./years/types";

export const TAX_PARAMS = Object.fromEntries(
  YEAR_MODULES.map((module) => [module.year, module.params]),
) as Record<TaxYear, YearParams>;

/**
 * Ordinary occupied main home, full year. Rates apply to the whole value, not marginal bands.
 * Above threshold: base + excess rate. Per-year sources are in each year module.
 */
export const EIGENWONINGFORFAIT = Object.fromEntries(
  YEAR_MODULES.map((module) => [module.year, module.home]),
) as Record<TaxYear, EigenwoningforfaitParams>;
