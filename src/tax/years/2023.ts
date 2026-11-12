import { defineYear } from "./define";
import {
  BE_TABLES_SOURCES,
  EIGENWONINGFORFAIT_VERIFIED,
  MORTGAGE_CAP_VERIFIED,
  MORTGAGE_CAP_POLICY_INFORMATION_SOURCE,
  NL_TABLES_SOURCE,
  eigenwoningforfaitSource,
} from "./shared";

/** Income year 2023 (Belgian assessment year 2024). */
export const year2023 = defineYear({
  year: 2023,
  nl: {
    mortgageDeductionRateCap: 0.3693,
    // Combined schijf 1: 36.93% − 27.65% = 9.28%
    incomeTaxBrackets: [
      { from: 0, to: 37149, rate: 0.0928 },
      { from: 37149, to: 73031, rate: 0.3693 },
      { from: 73031, to: Infinity, rate: 0.495 },
    ],
    under: {
      ahkMax: 3070,
      ahkPhaseOutStart: 22661,
      ahkPhaseOutRate: 0.06095,
      ahkPhaseOutEnd: 73031,
      akStages: [
        { from: 0, to: 10741, baseAmount: 0, rate: 0.08231 },
        { from: 10741, to: 23201, baseAmount: 884, rate: 0.29861 },
        { from: 23201, to: 37691, baseAmount: 4605, rate: 0.03085 },
        { from: 37691, to: 115295, baseAmount: 5052, rate: -0.0651 },
        { from: 115295, to: Infinity, baseAmount: 0, rate: 0 },
      ],
    },
    // Over-AOW: same income-tax brackets, social premium = 9.75%; AK ≈ half of under-AOW
    over: {
      ahkMax: 1535,
      ahkPhaseOutStart: 22661,
      ahkPhaseOutRate: 0.03048,
      ahkPhaseOutEnd: 73031,
      akStages: [
        { from: 0, to: 10741, baseAmount: 0, rate: 0.04116 },
        { from: 10741, to: 23201, baseAmount: 442, rate: 0.14931 },
        { from: 23201, to: 37691, baseAmount: 2302, rate: 0.01543 },
        { from: 37691, to: 115295, baseAmount: 2526, rate: -0.03255 },
        { from: 115295, to: Infinity, baseAmount: 0, rate: 0 },
      ],
    },
  },
  be: {
    brackets: [
      { from: 0, to: 15200, rate: 0.25 },
      { from: 15200, to: 26830, rate: 0.4 },
      { from: 26830, to: 46440, rate: 0.45 },
      { from: 46440, to: Infinity, rate: 0.5 },
    ],
    baseBelastingvrijeSom: 10160,
    childExtraAmounts: [0, 1850, 4760, 10660, 17250],
    extraPerChildAbove4: 6580,
    forfaitMax: 5520,
  },
  home: {
    rates: [0, 0.001, 0.002, 0.0025, 0.0035],
    threshold: 1200000,
    base: 4200,
  },
  sources: {
    nl: { sources: [NL_TABLES_SOURCE] },
    mortgageDeductionRateCap: {
      sources: [MORTGAGE_CAP_POLICY_INFORMATION_SOURCE],
      verified: MORTGAGE_CAP_VERIFIED,
    },
    be: { sources: BE_TABLES_SOURCES },
    home: { sources: [eigenwoningforfaitSource(2023)], verified: EIGENWONINGFORFAIT_VERIFIED },
  },
});
