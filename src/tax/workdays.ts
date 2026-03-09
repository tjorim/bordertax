import type { TaxInputs } from "./types";

export const MAX_WORKDAYS_IN_YEAR = 366;

export function getTotalWorkdays(inputs: TaxInputs): number {
  return inputs.daysWorkedNL + inputs.daysWorkedBE + (inputs.daysWorkedOther ?? 0);
}
