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
  extraPerChildAbove4: number;
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
        ahkMax: 3068,
        ahkPhaseOutStart: 22660,
        ahkPhaseOutRate: 0.06095,
        ahkPhaseOutEnd: 73031,
        akStages: [
          { from: 0, to: 11491, baseAmount: 0, rate: 0.08231 },
          { from: 11491, to: 24821, baseAmount: 945, rate: 0.29861 },
          { from: 24821, to: 39957, baseAmount: 4927, rate: 0.02471 },
          { from: 39957, to: 124935, baseAmount: 5532, rate: -0.0651 },
          { from: 124935, to: Infinity, baseAmount: 0, rate: 0 },
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
