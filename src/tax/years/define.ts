import {
  BE_FORFAIT_RATE,
  BE_GEREDUCEERD_RATE,
  BE_GEWESTELIJKE_RATE,
  BE_SERVICE_VOUCHER_REDUCTION_RATE,
  EIGENWONINGFORFAIT_EXCESS_RATE,
  NL_SOCIAL_PREMIUM_RATE_OVER_AOW,
  NL_SOCIAL_PREMIUM_RATE_UNDER_AOW,
} from "./shared";
import type { NLBracket, NLRegimeInput, NLYearParams, YearInput, YearModule } from "./types";

function expandNLRegime(
  regime: NLRegimeInput,
  incomeTaxBrackets: readonly NLBracket[],
  defaultPremiumRate: number,
): NLYearParams {
  return {
    // Copy so the two regimes never share (and could never mutate) the same objects.
    incomeTaxBrackets: incomeTaxBrackets.map((bracket) => ({ ...bracket })),
    socialPremiumRate: regime.socialPremiumRate ?? defaultPremiumRate,
    // The social premium ceiling is the first bracket ceiling.
    socialPremiumMax: incomeTaxBrackets[0]!.to,
    ahkMax: regime.ahkMax,
    ahkPhaseOutStart: regime.ahkPhaseOutStart,
    ahkPhaseOutRate: regime.ahkPhaseOutRate,
    ahkPhaseOutEnd: regime.ahkPhaseOutEnd,
    akStages: regime.akStages.map((stage) => ({ ...stage })),
  };
}

/**
 * Expand a year module's compact input into the full parameters the engines read: derive what
 * repeats (over-AOW brackets and premium ceiling, unchanged rates) and keep the year's own values.
 */
export function defineYear<const Y extends number>(input: YearInput<Y>): YearModule<Y> {
  const { nl, be, home } = input;
  return {
    year: input.year,
    params: {
      nl: {
        mortgageDeductionRateCap: nl.mortgageDeductionRateCap,
        under: expandNLRegime(nl.under, nl.incomeTaxBrackets, NL_SOCIAL_PREMIUM_RATE_UNDER_AOW),
        over: expandNLRegime(nl.over, nl.incomeTaxBrackets, NL_SOCIAL_PREMIUM_RATE_OVER_AOW),
      },
      be: {
        brackets: be.brackets.map((bracket) => ({ ...bracket })),
        baseBelastingvrijeSom: be.baseBelastingvrijeSom,
        childExtraAmounts: [...be.childExtraAmounts],
        extraPerChildAbove4: be.extraPerChildAbove4,
        forfaitRate: be.forfaitRate ?? BE_FORFAIT_RATE,
        forfaitMax: be.forfaitMax,
        gereduceerdRate: be.gereduceerdRate ?? BE_GEREDUCEERD_RATE,
        gewestelijkeRate: be.gewestelijkeRate ?? BE_GEWESTELIJKE_RATE,
        serviceVoucherReductionRate:
          be.serviceVoucherReductionRate ?? BE_SERVICE_VOUCHER_REDUCTION_RATE,
        ...(be.commutingExemptionMax === undefined
          ? {}
          : { commutingExemptionMax: be.commutingExemptionMax }),
      },
    },
    home: {
      rates: [...home.rates],
      threshold: home.threshold,
      base: home.base,
      excessRate: home.excessRate ?? EIGENWONINGFORFAIT_EXCESS_RATE,
    },
    sources: input.sources,
  };
}
