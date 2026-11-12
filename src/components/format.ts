import { getLocale } from "../paraglide/runtime.js";

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

/** Drops the trailing colon from a label that is also used as a "label: value" prefix. */
export function stripColon(label: string): string {
  return label.replace(/:\s*$/, "");
}
