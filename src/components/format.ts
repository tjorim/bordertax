import { getLocale } from "../paraglide/runtime.js";

/** `formatRange` is in the runtime (Intl.NumberFormat v3) but not in the configured TypeScript lib. */
type RangeFormat = Intl.NumberFormat & { formatRange(from: number, to: number): string };
const rangeFormat = (options: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(getLocale(), options) as RangeFormat;

export const fmt = (n: number) =>
  n.toLocaleString(getLocale(), { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export const fmtExact = (n: number) =>
  n.toLocaleString(getLocale(), { style: "currency", currency: "EUR", maximumFractionDigits: 2 });

/** A bracket's bounds in the active locale: "€0 – €38,441", or "> €76,817" for the open top bracket. */
export const fmtBracket = (from: number, to: number | null) =>
  to === null ? `> ${fmt(from)}` : `${fmt(from)} – ${fmt(to)}`;

export const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export const pctExact = (n: number) => `${(n * 100).toFixed(2)}%`;

export const fmtSigned = (n: number) => {
  const abs = Math.abs(n).toLocaleString(getLocale(), {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
  return n >= 0 ? `+${abs}` : `−${abs}`;
};

/** Euro amount without trailing zeros for whole amounts: €1,147 but €1,637.57. */
export const fmtAmount = (n: number) =>
  n.toLocaleString(getLocale(), {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });

/** Locale-aware percentage of a fraction (0.0475 → 4.75% / 4,75%). `fixed` keeps trailing zeros (8.10%). */
export const fmtPercent = (n: number, { digits = 2, fixed = false } = {}) =>
  n.toLocaleString(getLocale(), {
    style: "percent",
    minimumFractionDigits: fixed ? digits : 0,
    maximumFractionDigits: digits,
  });

/** "0.5%–2%" / "0,5%–2%" from two fractions. */
export const fmtPercentRange = (from: number, to: number) =>
  `${fmtPercent(from)}–${fmtPercent(to)}`;

export const fmtNumber = (n: number, digits = 0) =>
  n.toLocaleString(getLocale(), { minimumFractionDigits: digits, maximumFractionDigits: digits });

/**
 * Long calendar date from an ISO `YYYY-MM-DD` string, independent of the viewer's time zone.
 * English uses the day-month order of its Belgian and Dutch readers ("24 March 2026").
 */
export const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(getLocale() === "en" ? "en-GB" : getLocale(), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

const unitFormat = (unit: "year" | "month") =>
  rangeFormat({ style: "unit", unit, unitDisplay: "long" });

/** "67 years + 3 months"; a month range ([2, 3]) renders as "2–3 months". */
export function fmtAge(age: {
  years: number;
  months?: number | readonly [number, number];
}): string {
  const parts = [unitFormat("year").format(age.years)];
  if (typeof age.months === "number") parts.push(unitFormat("month").format(age.months));
  else if (age.months) parts.push(unitFormat("month").formatRange(age.months[0], age.months[1]));
  return parts.join(" + ");
}

/** Drops the trailing colon from a label that is also used as a "label: value" prefix. */
export function stripColon(label: string): string {
  return label.replace(/:\s*$/, "");
}
