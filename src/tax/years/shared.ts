/**
 * Values that are the same in every supported income year. A year module overrides one only where
 * the law changed (for example `serviceVoucherReductionRate` in 2025). Keep this file free of imports
 * from `../constants`: `VALID_YEARS` is derived from the year modules.
 */
import type { Source } from "./types";

// ─── NL ───────────────────────────────────────────────────────────────────────

/** Volksverzekeringen (AOW, Anw, Wlz) rate for taxpayers below AOW age. */
export const NL_SOCIAL_PREMIUM_RATE_UNDER_AOW = 0.2765;
/** Volksverzekeringen rate from AOW age (no AOW premium). */
export const NL_SOCIAL_PREMIUM_RATE_OVER_AOW = 0.0975;

// ─── BE ───────────────────────────────────────────────────────────────────────

export const BE_FORFAIT_RATE = 0.3;
/**
 * Federal reduction rate = 1 / (1 + 0.33257), verified for 2024 from the official aanslagbiljet.
 * The Flemish opcentiemen (33.257%) are stable since 2018.
 */
export const BE_GEREDUCEERD_RATE = 0.75043;
export const BE_GEWESTELIJKE_RATE = 0.33257;
/** Dienstencheques regional reduction rate; abolished for cheques bought from 1 January 2025. */
export const BE_SERVICE_VOUCHER_REDUCTION_RATE = 0.2;

/** Share of the belastingvrije som that is deducted from the tax (tax reduction rate). */
export const BE_TAX_FREE_ALLOWANCE_REDUCTION_RATE = 0.25;
/** Supplementary pension savings: credit against the federal part. */
export const BE_PENSION_REDUCTION_RATE = 0.3;

// ─── Home ownership ───────────────────────────────────────────────────────────

/** Rate on the part of the home value above the threshold. */
export const EIGENWONINGFORFAIT_EXCESS_RATE = 0.0235;

/**
 * Upper limits (inclusive) of the first four eigenwoningforfait value bands; the fifth band is
 * everything above the last limit up to the year's threshold. A year's `rates` therefore has
 * `EIGENWONINGFORFAIT_BAND_LIMITS.length + 1` entries.
 */
export const EIGENWONINGFORFAIT_BAND_LIMITS: readonly number[] = [12500, 25000, 50000, 75000];

// ─── Sources shared by several years ──────────────────────────────────────────

export const NL_TABLES_SOURCE: Source = {
  name: "Belastingdienst (belastingdienst.nl): official bracket and heffingskorting tables per year",
};

export const BE_TABLES_SOURCES: readonly Source[] = [
  { name: "FOD Financiën (fin.belgium.be); assessment year is the income year + 1" },
  { name: "fiwe.be" },
  { name: "practicali.be" },
];

/** Section 10.3.1 of the yearly Belastingdienst home chapter. */
export function eigenwoningforfaitSource(year: number): Source {
  return {
    name: `Belastingdienst Fiscale informatie ${year}, eigen woning, section 10.3.1`,
    url: `https://www.belastingdienst.nl/wps/wcm/connect/fisin/fisin${year}/eigen_woning_en_restschuld_vroegere`,
  };
}

export const EIGENWONINGFORFAIT_VERIFIED =
  "Verified, high confidence, against section 10.3.1 of the yearly home chapter (docs/hypotheekrenteaftrek-rules.md, checked 30 October 2026 and re-fetched for every year 2020–2026 on 12 November 2026)";

export const MORTGAGE_CAP_VERIFIED =
  "Verified against the cited publication (docs/hypotheekrenteaftrek-rules.md, section 4; re-checked for 2020–2026 on 12 November 2026)";

export const MORTGAGE_CAP_POLICY_INFORMATION_SOURCE: Source = {
  name: "Ministry policy information 2023 (Beleidsinformatiekaart), historical maximum deduction rates",
  url: "https://www.rijksoverheid.nl/binaries/rijksoverheid/documenten/publicaties/2023/04/25/beleidsinformatiekaart-2023/Beleidsinformatiekaart%2B2023.pdf",
};
