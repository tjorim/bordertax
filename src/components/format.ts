import { getLocale } from "../paraglide/runtime.js";

export function formatCurrency(value: number, maximumFractionDigits = 2): string {
  return value.toLocaleString(getLocale(), {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits,
  });
}

export function formatRoundedCurrency(value: number): string {
  return formatCurrency(value, 0);
}

export function formatPercent(value: number, fractionDigits = 2): string {
  return value.toLocaleString(getLocale(), {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatSignedCurrency(value: number, maximumFractionDigits = 0): string {
  const absoluteValue = formatCurrency(Math.abs(value), maximumFractionDigits);
  return value >= 0 ? `+${absoluteValue}` : `−${absoluteValue}`;
}
