import { defineYear } from "./define";
import {
  BE_TABLES_SOURCES,
  EIGENWONINGFORFAIT_VERIFIED,
  MORTGAGE_CAP_VERIFIED,
  NL_TABLES_SOURCE,
  eigenwoningforfaitSource,
} from "./shared";

/** Income year 2025 (Belgian assessment year 2026). */
export const year2025 = defineYear({
  year: 2025,
  nl: {
    mortgageDeductionRateCap: 0.3748,
    // Combined schijf 1: 35.82% − 27.65% = 8.17%
    incomeTaxBrackets: [
      { from: 0, to: 38441, rate: 0.0817 },
      { from: 38441, to: 76817, rate: 0.3748 },
      { from: 76817, to: Infinity, rate: 0.495 },
    ],
    under: {
      ahkMax: 3068,
      ahkPhaseOutStart: 28406,
      ahkPhaseOutRate: 0.06337,
      ahkPhaseOutEnd: 76817,
      akStages: [
        { from: 0, to: 12169, baseAmount: 0, rate: 0.08053 },
        { from: 12169, to: 26288, baseAmount: 980, rate: 0.3003 },
        { from: 26288, to: 43071, baseAmount: 5220, rate: 0.02258 },
        { from: 43071, to: 129078, baseAmount: 5599, rate: -0.0651 },
        { from: 129078, to: Infinity, baseAmount: 0, rate: 0 },
      ],
    },
    over: {
      ahkMax: 1536,
      ahkPhaseOutStart: 28406,
      ahkPhaseOutRate: 0.0317,
      ahkPhaseOutEnd: 76817,
      akStages: [
        { from: 0, to: 12169, baseAmount: 0, rate: 0.04029 },
        { from: 12169, to: 26288, baseAmount: 491, rate: 0.15023 },
        { from: 26288, to: 43071, baseAmount: 2612, rate: 0.0113 },
        { from: 43071, to: 129078, baseAmount: 2802, rate: -0.03257 },
        { from: 129078, to: Infinity, baseAmount: 0, rate: 0 },
      ],
    },
  },
  be: {
    brackets: [
      { from: 0, to: 16320, rate: 0.25 },
      { from: 16320, to: 28800, rate: 0.4 },
      { from: 28800, to: 49840, rate: 0.45 },
      { from: 49840, to: Infinity, rate: 0.5 },
    ],
    baseBelastingvrijeSom: 10910,
    childExtraAmounts: [0, 1980, 5110, 11440, 18510],
    extraPerChildAbove4: 7070,
    forfaitMax: 5930,
    // Dienstencheques regional reduction abolished for cheques bought from 1 January 2025.
    serviceVoucherReductionRate: 0,
  },
  home: {
    rates: [0, 0.001, 0.002, 0.0025, 0.0035],
    threshold: 1330000,
    base: 4655,
  },
  sources: {
    nl: { sources: [NL_TABLES_SOURCE] },
    mortgageDeductionRateCap: {
      sources: [
        {
          name: "Belastingdienst, tariefsaanpassing eigen woning (explicit 2025 figure)",
          url: "https://www.belastingdienst.nl/wps/wcm/connect/nl/koopwoning/content/tariefsaanpassing-eigen-woning",
        },
      ],
      verified: MORTGAGE_CAP_VERIFIED,
    },
    be: { sources: BE_TABLES_SOURCES },
    home: { sources: [eigenwoningforfaitSource(2025)], verified: EIGENWONINGFORFAIT_VERIFIED },
  },
});
