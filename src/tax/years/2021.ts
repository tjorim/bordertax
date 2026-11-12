import { defineYear } from "./define";
import {
  BE_TABLES_SOURCES,
  EIGENWONINGFORFAIT_VERIFIED,
  MORTGAGE_CAP_VERIFIED,
  MORTGAGE_CAP_POLICY_INFORMATION_SOURCE,
  NL_TABLES_SOURCE,
  eigenwoningforfaitSource,
} from "./shared";

/** Income year 2021 (Belgian assessment year 2022). */
export const year2021 = defineYear({
  year: 2021,
  nl: {
    mortgageDeductionRateCap: 0.43,
    // Combined schijf 1: 37.1% − 27.65% = 9.45%
    incomeTaxBrackets: [
      { from: 0, to: 35129, rate: 0.0945 },
      { from: 35129, to: 68507, rate: 0.371 },
      { from: 68507, to: Infinity, rate: 0.495 },
    ],
    under: {
      ahkMax: 2837,
      ahkPhaseOutStart: 21043,
      ahkPhaseOutRate: 0.05977,
      ahkPhaseOutEnd: 68507,
      akStages: [
        { from: 0, to: 10108, baseAmount: 0, rate: 0.04581 },
        { from: 10108, to: 21835, baseAmount: 463, rate: 0.28771 },
        { from: 21835, to: 35652, baseAmount: 3837, rate: 0.02663 },
        { from: 35652, to: 105735, baseAmount: 4205, rate: -0.06 },
        { from: 105735, to: Infinity, baseAmount: 0, rate: 0 },
      ],
    },
    over: {
      ahkMax: 1419,
      ahkPhaseOutStart: 21043,
      ahkPhaseOutRate: 0.02989,
      ahkPhaseOutEnd: 68507,
      akStages: [
        { from: 0, to: 10108, baseAmount: 0, rate: 0.02291 },
        { from: 10108, to: 21835, baseAmount: 232, rate: 0.14386 },
        { from: 21835, to: 35652, baseAmount: 1919, rate: 0.01332 },
        { from: 35652, to: 105735, baseAmount: 2103, rate: -0.03 },
        { from: 105735, to: Infinity, baseAmount: 0, rate: 0 },
      ],
    },
  },
  be: {
    brackets: [
      { from: 0, to: 13540, rate: 0.25 },
      { from: 13540, to: 23900, rate: 0.4 },
      { from: 23900, to: 41360, rate: 0.45 },
      { from: 41360, to: Infinity, rate: 0.5 },
    ],
    baseBelastingvrijeSom: 9050,
    childExtraAmounts: [0, 1650, 4240, 9500, 15360],
    extraPerChildAbove4: null,
    forfaitMax: 4920,
  },
  home: {
    rates: [0, 0.002, 0.003, 0.004, 0.005],
    threshold: 1110000,
    base: 5550,
  },
  sources: {
    nl: { sources: [NL_TABLES_SOURCE] },
    mortgageDeductionRateCap: {
      sources: [MORTGAGE_CAP_POLICY_INFORMATION_SOURCE],
      verified: MORTGAGE_CAP_VERIFIED,
    },
    be: { sources: BE_TABLES_SOURCES },
    home: { sources: [eigenwoningforfaitSource(2021)], verified: EIGENWONINGFORFAIT_VERIFIED },
  },
});
