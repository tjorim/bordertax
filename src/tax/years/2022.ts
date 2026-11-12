import { defineYear } from "./define";
import {
  BE_TABLES_SOURCES,
  EIGENWONINGFORFAIT_VERIFIED,
  MORTGAGE_CAP_VERIFIED,
  MORTGAGE_CAP_POLICY_INFORMATION_SOURCE,
  NL_TABLES_SOURCE,
  eigenwoningforfaitSource,
} from "./shared";

/** Income year 2022 (Belgian assessment year 2023). */
export const year2022 = defineYear({
  year: 2022,
  nl: {
    mortgageDeductionRateCap: 0.4,
    // Combined schijf 1: 37.07% − 27.65% = 9.42%
    incomeTaxBrackets: [
      { from: 0, to: 35472, rate: 0.0942 },
      { from: 35472, to: 69398, rate: 0.3707 },
      { from: 69398, to: Infinity, rate: 0.495 },
    ],
    under: {
      ahkMax: 2888,
      ahkPhaseOutStart: 21316,
      ahkPhaseOutRate: 0.06007,
      ahkPhaseOutEnd: 69398,
      akStages: [
        { from: 0, to: 10350, baseAmount: 0, rate: 0.04541 },
        { from: 10350, to: 22356, baseAmount: 470, rate: 0.28461 },
        { from: 22356, to: 36649, baseAmount: 3887, rate: 0.0261 },
        { from: 36649, to: 109346, baseAmount: 4260, rate: -0.0586 },
        { from: 109346, to: Infinity, baseAmount: 0, rate: 0 },
      ],
    },
    over: {
      ahkMax: 1444,
      ahkPhaseOutStart: 21316,
      ahkPhaseOutRate: 0.03004,
      ahkPhaseOutEnd: 69398,
      akStages: [
        { from: 0, to: 10350, baseAmount: 0, rate: 0.02271 },
        { from: 10350, to: 22356, baseAmount: 235, rate: 0.14231 },
        { from: 22356, to: 36649, baseAmount: 1944, rate: 0.01305 },
        { from: 36649, to: 109346, baseAmount: 2130, rate: -0.0293 },
        { from: 109346, to: Infinity, baseAmount: 0, rate: 0 },
      ],
    },
  },
  be: {
    brackets: [
      { from: 0, to: 13870, rate: 0.25 },
      { from: 13870, to: 24480, rate: 0.4 },
      { from: 24480, to: 42370, rate: 0.45 },
      { from: 42370, to: Infinity, rate: 0.5 },
    ],
    baseBelastingvrijeSom: 9270,
    childExtraAmounts: [0, 1690, 4340, 9730, 15740],
    extraPerChildAbove4: null,
    forfaitMax: 5040,
  },
  home: {
    rates: [0, 0.0015, 0.0025, 0.0035, 0.0045],
    threshold: 1130000,
    base: 5085,
  },
  sources: {
    nl: { sources: [NL_TABLES_SOURCE] },
    mortgageDeductionRateCap: {
      sources: [MORTGAGE_CAP_POLICY_INFORMATION_SOURCE],
      verified: MORTGAGE_CAP_VERIFIED,
    },
    be: { sources: BE_TABLES_SOURCES },
    home: { sources: [eigenwoningforfaitSource(2022)], verified: EIGENWONINGFORFAIT_VERIFIED },
  },
});
