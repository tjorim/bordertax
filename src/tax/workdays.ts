import type { TaxInputs } from "./types";

export const getMaxDaysInYear = (year: number): number =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;

export interface WorkdayTotals {
  daysNL: number;
  daysBE: number;
  daysOther: number;
  sickDays: number;
  daysOutsideNL: number;
  totalNoSick: number;
  totalWithSick: number;
}

export interface WorkdayFractions extends WorkdayTotals {
  nlFractionDutchMethod: number;
  nlFractionBelgianMethod: number;
  beFraction: number;
  vrijgesteldFrac: number;
}

const nonNegative = (value: number | undefined): number => Math.max(0, value ?? 0);

/**
 * Total workdays used for daily summaries and Belgian-method sourcing.
 * Sick days are intentionally excluded; the Dutch method includes them separately.
 */
export function getTotalWorkdays(inputs: TaxInputs): number {
  return getWorkdayTotals(inputs).totalNoSick;
}

/**
 * Normalized workday totals used by both tax engines.
 * `totalNoSick` is the Belgian-method denominator; `totalWithSick` is the Dutch-method denominator.
 */
export function getWorkdayTotals(inputs: TaxInputs): WorkdayTotals {
  const daysNL = nonNegative(inputs.daysWorkedNL);
  const daysBE = nonNegative(inputs.daysWorkedBE);
  const daysOther = nonNegative(inputs.daysWorkedOther);
  const sickDays = nonNegative(inputs.sickDays);
  const daysOutsideNL = daysBE + daysOther;
  const totalNoSick = daysNL + daysOutsideNL;
  const totalWithSick = totalNoSick + sickDays;

  return {
    daysNL,
    daysBE,
    daysOther,
    sickDays,
    daysOutsideNL,
    totalNoSick,
    totalWithSick,
  };
}

/**
 * Workday sourcing fractions:
 * - Dutch method: sick days count as NL workdays and are included in the denominator.
 * - Belgian method: sick days are excluded from both numerator and denominator.
 */
export function getNLFractions(inputs: TaxInputs): WorkdayFractions {
  const totals = getWorkdayTotals(inputs);
  const nlFractionDutchMethod =
    totals.totalWithSick > 0 ? (totals.daysNL + totals.sickDays) / totals.totalWithSick : 0;
  const nlFractionBelgianMethod =
    totals.totalNoSick > 0 ? totals.daysNL / totals.totalNoSick : 0;
  const beFraction = totals.totalNoSick > 0 ? totals.daysOutsideNL / totals.totalNoSick : 0;

  return {
    ...totals,
    nlFractionDutchMethod,
    nlFractionBelgianMethod,
    beFraction,
    vrijgesteldFrac: nlFractionBelgianMethod,
  };
}
