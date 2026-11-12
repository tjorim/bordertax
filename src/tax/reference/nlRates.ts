/**
 * Dutch rate table of the salary-split reference page, derived from the same year module as the
 * calculator (`getYearParams`). Nothing here is typed a second time: change a figure in
 * `src/tax/years/<year>.ts` and the reference page follows.
 */
import { getYearParams } from "../params";

export interface NlRateRow {
  from: number;
  /** `null` for the open-ended top bracket. */
  to: number | null;
  /** Rate on the bracket including the volksverzekeringen premium part. */
  combinedRate: number;
  /** Income-tax-only part of the combined rate. */
  incomeTaxRate: number;
  /** Premium part (only inside the premium ceiling, i.e. the first bracket); 0 elsewhere. */
  premiumRate: number;
}

export interface NlReferenceRates {
  year: number;
  rows: NlRateRow[];
  /** Ceiling of the volksverzekeringen premium (first bracket's upper limit). */
  premiumCeiling: number;
  ahkMax: number;
  /** Income at which the algemene heffingskorting has phased out. */
  ahkPhaseOutEnd: number;
  /** Highest arbeidskorting reached over the stages. */
  arbeidskortingMax: number;
  /** Income from which the arbeidskorting is zero. */
  arbeidskortingZeroFrom: number;
}

const round4 = (value: number) => Math.round(value * 10000) / 10000;

export function nlReferenceRates(year: number): NlReferenceRates {
  const { under } = getYearParams(year).nl;
  const rows = under.incomeTaxBrackets.map((bracket, index): NlRateRow => {
    const premiumRate = index === 0 ? under.socialPremiumRate : 0;
    return {
      from: bracket.from,
      to: Number.isFinite(bracket.to) ? bracket.to : null,
      combinedRate: round4(bracket.rate + premiumRate),
      incomeTaxRate: bracket.rate,
      premiumRate,
    };
  });
  const arbeidskortingMax = Math.max(
    ...under.akStages
      .filter((stage) => Number.isFinite(stage.to))
      .map((stage) => Math.round(stage.baseAmount + stage.rate * (stage.to - stage.from))),
  );
  // The last stage is the open-ended zero stage: arbeidskorting is nil from its start.
  const arbeidskortingZeroFrom = under.akStages[under.akStages.length - 1]!.from;
  return {
    year,
    rows,
    premiumCeiling: under.socialPremiumMax,
    ahkMax: under.ahkMax,
    ahkPhaseOutEnd: under.ahkPhaseOutEnd,
    arbeidskortingMax,
    arbeidskortingZeroFrom,
  };
}
