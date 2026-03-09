import type { TaxInputs } from "./types";

export const getMaxDaysInYear = (year: number): number =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;

export function getTotalWorkdays(inputs: TaxInputs): number {
  return inputs.daysWorkedNL + inputs.daysWorkedBE + (inputs.daysWorkedOther ?? 0);
}
