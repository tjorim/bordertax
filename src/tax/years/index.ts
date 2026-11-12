/**
 * Registry of supported income years. To add a year: create `src/tax/years/<year>.ts` (copy the
 * latest module) and add one import and one entry below, in ascending order. `VALID_YEARS`, the
 * `TaxYear` type, `TAX_PARAMS` and `EIGENWONINGFORFAIT` all derive from this list.
 *
 * Income year 2026 is deliberately absent: it needs the official tables (see #144).
 */
import { year2020 } from "./2020";
import { year2021 } from "./2021";
import { year2022 } from "./2022";
import { year2023 } from "./2023";
import { year2024 } from "./2024";
import { year2025 } from "./2025";

export const YEAR_MODULES = [year2020, year2021, year2022, year2023, year2024, year2025] as const;

export type SupportedYear = (typeof YEAR_MODULES)[number]["year"];

export const SUPPORTED_YEARS: readonly SupportedYear[] = YEAR_MODULES.map((module) => module.year);
