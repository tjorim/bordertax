import { defineYear } from "./define";
import {
  BE_TABLES_SOURCES,
  EIGENWONINGFORFAIT_VERIFIED,
  MORTGAGE_CAP_VERIFIED,
  MORTGAGE_CAP_POLICY_INFORMATION_SOURCE,
  NL_TABLES_SOURCE,
  eigenwoningforfaitSource,
} from "./shared";

/** Income year 2020 (Belgian assessment year 2021). */
export const year2020 = defineYear({
  year: 2020,
  nl: {
    mortgageDeductionRateCap: 0.46,
    // Combined schijf 1: 37.35% − 27.65% = 9.7%
    incomeTaxBrackets: [
      { from: 0, to: 34712, rate: 0.097 },
      { from: 34712, to: 68507, rate: 0.3735 },
      { from: 68507, to: Infinity, rate: 0.495 },
    ],
    under: {
      ahkMax: 2711,
      ahkPhaseOutStart: 20711,
      ahkPhaseOutRate: 0.05672,
      ahkPhaseOutEnd: 68507,
      akStages: [
        { from: 0, to: 9921, baseAmount: 0, rate: 0.02812 },
        { from: 9921, to: 21430, baseAmount: 279, rate: 0.28812 },
        { from: 21430, to: 34954, baseAmount: 3595, rate: 0.01656 },
        { from: 34954, to: 98604, baseAmount: 3819, rate: -0.06 },
        { from: 98604, to: Infinity, baseAmount: 0, rate: 0 },
      ],
    },
    over: {
      ahkMax: 1356,
      ahkPhaseOutStart: 20711,
      ahkPhaseOutRate: 0.02836,
      ahkPhaseOutEnd: 68507,
      akStages: [
        { from: 0, to: 9921, baseAmount: 0, rate: 0.01406 },
        { from: 9921, to: 21430, baseAmount: 140, rate: 0.14406 },
        { from: 21430, to: 34954, baseAmount: 1798, rate: 0.00828 },
        { from: 34954, to: 98604, baseAmount: 1910, rate: -0.03 },
        { from: 98604, to: Infinity, baseAmount: 0, rate: 0 },
      ],
    },
  },
  be: {
    brackets: [
      { from: 0, to: 13440, rate: 0.25 },
      { from: 13440, to: 23720, rate: 0.4 },
      { from: 23720, to: 41060, rate: 0.45 },
      { from: 41060, to: Infinity, rate: 0.5 },
    ],
    baseBelastingvrijeSom: 8990,
    childExtraAmounts: [0, 1630, 4210, 9430, 15250],
    extraPerChildAbove4: null,
    forfaitMax: 4880,
  },
  home: {
    rates: [0, 0.002, 0.0035, 0.0045, 0.006],
    threshold: 1090000,
    base: 6540,
  },
  sources: {
    nl: { sources: [NL_TABLES_SOURCE] },
    mortgageDeductionRateCap: {
      sources: [MORTGAGE_CAP_POLICY_INFORMATION_SOURCE],
      verified: MORTGAGE_CAP_VERIFIED,
    },
    be: { sources: BE_TABLES_SOURCES },
    home: { sources: [eigenwoningforfaitSource(2020)], verified: EIGENWONINGFORFAIT_VERIFIED },
  },
});
