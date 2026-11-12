/**
 * Which income year the reference pages describe and where their figures come from. This is the
 * one place to change when a page moves to a new year (docs/adding-an-income-year.md). It is not
 * "the latest supported year": the ACV figures are a fixed document for one year, so adding a
 * newer year module must not silently relabel them.
 */
import { YEAR_MODULES } from "../years";

/** Income year the reference pages are written for. Must have a module in `src/tax/years`. */
export const REFERENCE_INCOME_YEAR = 2026;

/** The ACV information session (fixed document) that the worked example and pension tables follow. */
export const ACV_SESSION = {
  /** ISO date; render with `fmtDate`. */
  date: "2026-03-24",
  place: "Pelt",
} as const;

/**
 * The official page the Dutch tax figures of the reference year come from, taken from the year
 * module so it can not drift from the calculator's own provenance.
 */
export function referenceTaxSourceUrl(year: number = REFERENCE_INCOME_YEAR): string | undefined {
  const module = YEAR_MODULES.find((candidate) => candidate.year === year);
  return module?.sources.nl.sources.find((source) => source.url)?.url;
}
