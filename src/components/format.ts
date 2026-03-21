import { getLocale } from "../paraglide/runtime.js";

export const fmt = (n: number) =>
  n.toLocaleString(getLocale(), { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export const fmtExact = (n: number) =>
  n.toLocaleString(getLocale(), { style: "currency", currency: "EUR", maximumFractionDigits: 2 });

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
