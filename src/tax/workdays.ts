import type { TaxInputs } from "./types";

export const getMaxDaysInYear = (year: number): number =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;

export interface WorkdayTotals {
  daysNL: number;
  daysBE: number;
  daysOther: number;
  /** Sick days on days scheduled to be worked in the Netherlands. */
  sickDaysNL: number;
  /** Sick days on days scheduled to be worked in Belgium or a third country. */
  sickDaysOutsideNL: number;
  /** All sick days, wherever they were scheduled. */
  sickDays: number;
  daysOutsideNL: number;
  totalNoSick: number;
  totalWithSick: number;
}

export interface WorkdayFractions extends WorkdayTotals {
  nlFractionDutchMethod: number;
  nlFractionBelgianMethod: number;
  beFraction: number;
  /** No workdays at all (sick days included): there is nothing to source the wage to. */
  noWorkdays: boolean;
}

/** The workday fields only; the fractions do not depend on anything else. */
export type WorkdayInputs = Pick<
  TaxInputs,
  "daysWorkedNL" | "daysWorkedBE" | "daysWorkedOther" | "sickDaysNL" | "sickDaysOutsideNL"
>;

const nonNegative = (value: number | undefined): number => Math.max(0, value ?? 0);

/**
 * Total workdays used for daily summaries and Belgian-method sourcing.
 * Sick days are intentionally excluded; the Dutch method includes them separately.
 */
export function getTotalWorkdays(inputs: WorkdayInputs): number {
  return getWorkdayTotals(inputs).totalNoSick;
}

/**
 * Normalized workday totals used by both tax engines.
 * `totalNoSick` is the Belgian-method denominator; `totalWithSick` is the Dutch-method denominator.
 */
export function getWorkdayTotals(inputs: WorkdayInputs): WorkdayTotals {
  const daysNL = nonNegative(inputs.daysWorkedNL);
  const daysBE = nonNegative(inputs.daysWorkedBE);
  const daysOther = nonNegative(inputs.daysWorkedOther);
  const sickDaysNL = nonNegative(inputs.sickDaysNL);
  const sickDaysOutsideNL = nonNegative(inputs.sickDaysOutsideNL);
  const sickDays = sickDaysNL + sickDaysOutsideNL;
  const daysOutsideNL = daysBE + daysOther;
  const totalNoSick = daysNL + daysOutsideNL;
  const totalWithSick = totalNoSick + sickDays;

  return {
    daysNL,
    daysBE,
    daysOther,
    sickDaysNL,
    sickDaysOutsideNL,
    sickDays,
    daysOutsideNL,
    totalNoSick,
    totalWithSick,
  };
}

/**
 * Workday sourcing fractions:
 * - Dutch method: a sick day counts for the country where it was scheduled to be worked. Sick days
 *   scheduled in the Netherlands are NL workdays; sick days scheduled in Belgium or a third country
 *   are days outside the Netherlands and so part of "deel niet in NL belast". All sick days are in
 *   the denominator.
 * - Belgian method (ACV/FOD material): every sick day is excluded from both numerator and
 *   denominator, wherever it was scheduled.
 */
export function getNLFractions(inputs: WorkdayInputs): WorkdayFractions {
  const totals = getWorkdayTotals(inputs);
  const nlFractionDutchMethod =
    totals.totalWithSick > 0 ? (totals.daysNL + totals.sickDaysNL) / totals.totalWithSick : 0;
  const nlFractionBelgianMethod = totals.totalNoSick > 0 ? totals.daysNL / totals.totalNoSick : 0;
  const beFraction = totals.totalNoSick > 0 ? totals.daysOutsideNL / totals.totalNoSick : 0;

  return {
    ...totals,
    nlFractionDutchMethod,
    nlFractionBelgianMethod,
    beFraction,
    noWorkdays: totals.totalWithSick <= 0,
  };
}
