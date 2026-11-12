import { defineYear } from "./define";
import {
  BE_TABLES_SOURCES,
  EIGENWONINGFORFAIT_VERIFIED,
  MORTGAGE_CAP_VERIFIED,
  NL_TABLES_SOURCE,
  eigenwoningforfaitSource,
} from "./shared";

/** Income year 2024 (Belgian assessment year 2025). */
export const year2024 = defineYear({
  year: 2024,
  nl: {
    mortgageDeductionRateCap: 0.3697,
    // Combined schijf 1: 36.97% − 27.65% = 9.32%
    incomeTaxBrackets: [
      { from: 0, to: 38098, rate: 0.0932 },
      { from: 38098, to: 75518, rate: 0.3697 },
      { from: 75518, to: Infinity, rate: 0.495 },
    ],
    under: {
      ahkMax: 3362,
      ahkPhaseOutStart: 24812,
      ahkPhaseOutRate: 0.0663,
      ahkPhaseOutEnd: 75518,
      akStages: [
        { from: 0, to: 11490, baseAmount: 0, rate: 0.08425 },
        { from: 11490, to: 24820, baseAmount: 968, rate: 0.31433 },
        { from: 24820, to: 39957, baseAmount: 5158, rate: 0.02471 },
        { from: 39957, to: 124934, baseAmount: 5532, rate: -0.0651 },
        { from: 124934, to: Infinity, baseAmount: 0, rate: 0 },
      ],
    },
    over: {
      // Suspected copy error, unchanged here: the phase-out start (22,660) and end (73,031) look like
      // the 2023 values while the brackets are 2024. Tracked in the AHK follow-up to #435.
      ahkMax: 1537,
      ahkPhaseOutStart: 22660,
      ahkPhaseOutRate: 0.03048,
      ahkPhaseOutEnd: 73031,
      akStages: [
        { from: 0, to: 11491, baseAmount: 0, rate: 0.04118 },
        { from: 11491, to: 24821, baseAmount: 473, rate: 0.14938 },
        { from: 24821, to: 39957, baseAmount: 2465, rate: 0.01237 },
        { from: 39957, to: 124935, baseAmount: 2762, rate: -0.03257 },
        { from: 124935, to: Infinity, baseAmount: 0, rate: 0 },
      ],
    },
  },
  be: {
    brackets: [
      { from: 0, to: 15820, rate: 0.25 },
      { from: 15820, to: 27920, rate: 0.4 },
      { from: 27920, to: 48320, rate: 0.45 },
      { from: 48320, to: Infinity, rate: 0.5 },
    ],
    baseBelastingvrijeSom: 10570,
    childExtraAmounts: [0, 1920, 4950, 11090, 17940],
    extraPerChildAbove4: 6850,
    forfaitMax: 5750,
  },
  home: {
    rates: [0, 0.001, 0.002, 0.0025, 0.0035],
    threshold: 1310000,
    base: 4585,
  },
  sources: {
    nl: {
      sources: [NL_TABLES_SOURCE],
      verified: "Checked against the official Dutch aanslag inkomstenbelasting 2024",
    },
    mortgageDeductionRateCap: {
      sources: [
        {
          name: "State Secretary's explanation of the 2024 cap and its link to the second bracket",
          url: "https://zoek.officielebekendmakingen.nl/kst-36602-Z.html",
        },
      ],
      verified: MORTGAGE_CAP_VERIFIED,
    },
    be: {
      sources: BE_TABLES_SOURCES,
      verified:
        "gereduceerdRate and gewestelijkeRate verified from the official aanslagbiljet 2025 (income 2024)",
    },
    home: { sources: [eigenwoningforfaitSource(2024)], verified: EIGENWONINGFORFAIT_VERIFIED },
  },
});
