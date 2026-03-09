/**
 * Tax parameters by income year (inkomstenjaar / année de revenus).
 *
 * This is the ONLY file that needs updating when tax rates change.
 * To add a new year: add a new entry to TAX_PARAMS with both `nl` and `be`.
 *
 * NL sources: belastingdienst.nl — official bracket and heffingskorting tables per year.
 *   Income-tax-only rates = combined rate − social premium rate
 *   (27.65% under AOW / 9.75% over AOW).
 *   2024 verified from official NL aanslag inkomstenbelasting 2024.
 *   2026 NL AK stages are provisional — TODO: verify once official tables are published.
 *
 * BE sources: fin.belgium.be (AJ = inkomstenjaar + 1), fiwe.be, practicali.be.
 *   Flemish opcentiemen = 33.257%, stable since 2018.
 *   gereduceerdRate = 1 / (1 + 0.33257) = 0.75043, verified for 2024 from official aanslagbiljet.
 *   2026 note: proposed 40%→35% bracket reform was not enacted for income year 2026.
 */
import type { TaxYear } from "./types";

// ─── NL interfaces ────────────────────────────────────────────────────────────

export interface NLBracket {
  from: number;
  to: number;
  rate: number;
}

export interface AKStage {
  from: number;
  to: number;
  baseAmount: number;
  /** Rate applied to (income - from). Negative for phase-out. */
  rate: number;
}

export interface NLYearParams {
  /** Income-tax-only brackets (social premiums excluded). */
  incomeTaxBrackets: NLBracket[];
  /** Volksverzekeringen rate applied to min(grossSalary, socialPremiumMax). */
  socialPremiumRate: number;
  /** Maximum income subject to social premiums (equals bracket 1 ceiling). */
  socialPremiumMax: number;
  ahkMax: number;
  ahkPhaseOutStart: number;
  ahkPhaseOutRate: number;
  ahkPhaseOutEnd: number;
  akStages: AKStage[];
}

// ─── BE interfaces ────────────────────────────────────────────────────────────

export interface BEBracket {
  from: number;
  to: number;
  rate: number;
}

export interface BEYearParams {
  brackets: BEBracket[];
  baseBelastingvrijeSom: number;
  /** Cumulative extra allowance per number of dependent children; index = child count (0–4). */
  childExtraAmounts: number[];
  extraPerChildAbove4: number | null;
  forfaitRate: number;
  forfaitMax: number;
  /** Federal reduction rate: hoofdsom × gereduceerdRate = gereduceerde belasting staat. */
  gereduceerdRate: number;
  /** Regional supplement: gereduceerde × gewestelijkeRate = gewestelijke belasting. */
  gewestelijkeRate: number;
}

// ─── Combined params ──────────────────────────────────────────────────────────

interface YearParams {
  nl: { under: NLYearParams; over: NLYearParams };
  be: BEYearParams;
}

export const TAX_PARAMS: Record<TaxYear, YearParams> = {
  2020: {
    nl: {
      under: {
        // Combined schijf 1: 37.35% − 27.65% = 9.70%
        incomeTaxBrackets: [
          { from: 0, to: 34712, rate: 0.097 },
          { from: 34712, to: 68507, rate: 0.3735 },
          { from: 68507, to: Infinity, rate: 0.495 },
        ],
        socialPremiumRate: 0.2765,
        socialPremiumMax: 34712,
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
        incomeTaxBrackets: [
          { from: 0, to: 34712, rate: 0.097 },
          { from: 34712, to: 68507, rate: 0.3735 },
          { from: 68507, to: Infinity, rate: 0.495 },
        ],
        socialPremiumRate: 0.0975,
        socialPremiumMax: 34712,
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
      forfaitRate: 0.3,
      forfaitMax: 4880,
      gereduceerdRate: 0.75043,
      gewestelijkeRate: 0.33257,
    },
  },

  2021: {
    nl: {
      under: {
        // Combined schijf 1: 37.10% − 27.65% = 9.45%
        incomeTaxBrackets: [
          { from: 0, to: 35129, rate: 0.0945 },
          { from: 35129, to: 68507, rate: 0.371 },
          { from: 68507, to: Infinity, rate: 0.495 },
        ],
        socialPremiumRate: 0.2765,
        socialPremiumMax: 35129,
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
        incomeTaxBrackets: [
          { from: 0, to: 35129, rate: 0.0945 },
          { from: 35129, to: 68507, rate: 0.371 },
          { from: 68507, to: Infinity, rate: 0.495 },
        ],
        socialPremiumRate: 0.0975,
        socialPremiumMax: 35129,
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
      forfaitRate: 0.3,
      forfaitMax: 4920,
      gereduceerdRate: 0.75043,
      gewestelijkeRate: 0.33257,
    },
  },

  2022: {
    nl: {
      under: {
        // Combined schijf 1: 37.07% − 27.65% = 9.42%
        incomeTaxBrackets: [
          { from: 0, to: 35472, rate: 0.0942 },
          { from: 35472, to: 69398, rate: 0.3707 },
          { from: 69398, to: Infinity, rate: 0.495 },
        ],
        socialPremiumRate: 0.2765,
        socialPremiumMax: 35472,
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
        incomeTaxBrackets: [
          { from: 0, to: 35472, rate: 0.0942 },
          { from: 35472, to: 69398, rate: 0.3707 },
          { from: 69398, to: Infinity, rate: 0.495 },
        ],
        socialPremiumRate: 0.0975,
        socialPremiumMax: 35472,
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
      forfaitRate: 0.3,
      forfaitMax: 5040,
      gereduceerdRate: 0.75043,
      gewestelijkeRate: 0.33257,
    },
  },

  2023: {
    nl: {
      under: {
        // Combined schijf 1: 36.93% − 27.65% = 9.28%
        incomeTaxBrackets: [
          { from: 0, to: 37149, rate: 0.0928 },
          { from: 37149, to: 73031, rate: 0.3693 },
          { from: 73031, to: Infinity, rate: 0.495 },
        ],
        socialPremiumRate: 0.2765,
        socialPremiumMax: 37149,
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
      over: {
        // Over-AOW: same income-tax brackets, social premium = 9.75%; AK ≈ half of under-AOW
        incomeTaxBrackets: [
          { from: 0, to: 37149, rate: 0.0928 },
          { from: 37149, to: 73031, rate: 0.3693 },
          { from: 73031, to: Infinity, rate: 0.495 },
        ],
        socialPremiumRate: 0.0975,
        socialPremiumMax: 37149,
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
      forfaitRate: 0.3,
      forfaitMax: 5520,
      gereduceerdRate: 0.75043,
      gewestelijkeRate: 0.33257,
    },
  },

  2024: {
    nl: {
      under: {
        // Combined schijf 1: 36.97% − 27.65% = 9.32%
        incomeTaxBrackets: [
          { from: 0, to: 38098, rate: 0.0932 },
          { from: 38098, to: 75518, rate: 0.3697 },
          { from: 75518, to: Infinity, rate: 0.495 },
        ],
        socialPremiumRate: 0.2765,
        socialPremiumMax: 38098,
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
        incomeTaxBrackets: [
          { from: 0, to: 38098, rate: 0.0932 },
          { from: 38098, to: 75518, rate: 0.3697 },
          { from: 75518, to: Infinity, rate: 0.495 },
        ],
        socialPremiumRate: 0.0975,
        socialPremiumMax: 38098,
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
      // gereduceerdRate / gewestelijkeRate verified from official aanslagbiljet 2025 (income 2024)
      brackets: [
        { from: 0, to: 15820, rate: 0.25 },
        { from: 15820, to: 27920, rate: 0.4 },
        { from: 27920, to: 48320, rate: 0.45 },
        { from: 48320, to: Infinity, rate: 0.5 },
      ],
      baseBelastingvrijeSom: 10570,
      childExtraAmounts: [0, 1920, 4950, 11090, 17940],
      extraPerChildAbove4: 6850,
      forfaitRate: 0.3,
      forfaitMax: 5750,
      gereduceerdRate: 0.75043,
      gewestelijkeRate: 0.33257,
    },
  },

  2025: {
    nl: {
      under: {
        // Combined schijf 1: 35.82% − 27.65% = 8.17%
        incomeTaxBrackets: [
          { from: 0, to: 38441, rate: 0.0817 },
          { from: 38441, to: 76817, rate: 0.3748 },
          { from: 76817, to: Infinity, rate: 0.495 },
        ],
        socialPremiumRate: 0.2765,
        socialPremiumMax: 38441,
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
        incomeTaxBrackets: [
          { from: 0, to: 38441, rate: 0.0817 },
          { from: 38441, to: 76817, rate: 0.3748 },
          { from: 76817, to: Infinity, rate: 0.495 },
        ],
        socialPremiumRate: 0.0975,
        socialPremiumMax: 38441,
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
      forfaitRate: 0.3,
      forfaitMax: 5930,
      gereduceerdRate: 0.75043,
      gewestelijkeRate: 0.33257,
    },
  },

  2026: {
    nl: {
      under: {
        incomeTaxBrackets: [
          { from: 0, to: 38883, rate: 0.0817 },
          { from: 38883, to: 78426, rate: 0.3756 },
          { from: 78426, to: Infinity, rate: 0.495 },
        ],
        socialPremiumRate: 0.2765,
        socialPremiumMax: 38883,
        ahkMax: 3115,
        ahkPhaseOutStart: 28406,
        ahkPhaseOutRate: 0.06095,
        ahkPhaseOutEnd: 79812,
        akStages: [
          { from: 0, to: 12388, baseAmount: 0, rate: 0.0817 },
          { from: 12388, to: 26775, baseAmount: 1012, rate: 0.30516 },
          { from: 26775, to: 43852, baseAmount: 5404, rate: 0.01652 },
          { from: 43852, to: 130804, baseAmount: 5685, rate: -0.0651 },
          { from: 130804, to: Infinity, baseAmount: 0, rate: 0 },
        ],
      },
      over: {
        incomeTaxBrackets: [
          { from: 0, to: 38883, rate: 0.0817 },
          { from: 38883, to: 78426, rate: 0.3756 },
          { from: 78426, to: Infinity, rate: 0.495 },
        ],
        socialPremiumRate: 0.0975,
        socialPremiumMax: 38883,
        ahkMax: 1568,
        ahkPhaseOutStart: 28406,
        ahkPhaseOutRate: 0.0317,
        ahkPhaseOutEnd: 79812,
        akStages: [
          { from: 0, to: 12388, baseAmount: 0, rate: 0.04092 },
          { from: 12388, to: 26775, baseAmount: 507, rate: 0.15261 },
          { from: 26775, to: 43852, baseAmount: 2702, rate: 0.00826 },
          { from: 43852, to: 130804, baseAmount: 2843, rate: -0.03257 },
          { from: 130804, to: Infinity, baseAmount: 0, rate: 0 },
        ],
      },
    },
    be: {
      brackets: [
        { from: 0, to: 16720, rate: 0.25 },
        { from: 16720, to: 29510, rate: 0.4 },
        { from: 29510, to: 51070, rate: 0.45 },
        { from: 51070, to: Infinity, rate: 0.5 },
      ],
      baseBelastingvrijeSom: 11180,
      childExtraAmounts: [0, 2030, 5230, 11720, 18970],
      extraPerChildAbove4: 7240,
      forfaitRate: 0.3,
      forfaitMax: 6070,
      gereduceerdRate: 0.75043,
      gewestelijkeRate: 0.33257,
    },
  },
};
