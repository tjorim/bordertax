/**
 * Dutch income tax (Box 1) calculation.
 *
 * Data sourced from Belastingdienst official tables.
 * TODO: Verify and extend with user-provided spreadsheet data for each year.
 */
import type { TaxInputs, NLTaxResult, BracketLine } from './types';

interface Bracket {
  from: number;
  to: number;
  rate: number;
}

interface AKStage {
  from: number;
  to: number;
  baseAmount: number;
  /** Rate applied to (income - from). Negative for phase-out. */
  rate: number;
}

interface YearParams {
  brackets: Bracket[];
  ahkMax: number;
  ahkPhaseOutStart: number;
  ahkPhaseOutRate: number;
  ahkPhaseOutEnd: number;
  akStages: AKStage[];
}

/**
 * Tax parameters per year, split by below/above AOW age.
 * Sources:
 *   2025 brackets: https://www.inbalansbv.nl/tarieven-heffingskortingen-en-bedragen-inkomstenbelasting-2025/
 *   2025 AHK: https://www.belastingdienst.nl (tabel-algemene-heffingskorting-2025)
 *   2025 AK:  https://www.belastingdienst.nl (tabel-arbeidskorting-2025)
 */
const PARAMS: Record<number, { under: YearParams; over: YearParams }> = {
  2024: {
    // TODO: Replace with exact 2024 values from user spreadsheets
    under: {
      brackets: [
        { from: 0, to: 75624, rate: 0.3697 },
        { from: 75624, to: Infinity, rate: 0.495 },
      ],
      ahkMax: 3068,
      ahkPhaseOutStart: 22660,
      ahkPhaseOutRate: 0.06095,
      ahkPhaseOutEnd: 73_031,
      akStages: [
        { from: 0, to: 11491, baseAmount: 0, rate: 0.08231 },
        { from: 11491, to: 24821, baseAmount: 945, rate: 0.29861 },
        { from: 24821, to: 39957, baseAmount: 4927, rate: 0.02471 },
        { from: 39957, to: 124935, baseAmount: 5532, rate: -0.0651 },
        { from: 124935, to: Infinity, baseAmount: 0, rate: 0 },
      ],
    },
    over: {
      brackets: [
        { from: 0, to: 75624, rate: 0.1950 },
        { from: 75624, to: Infinity, rate: 0.495 },
      ],
      ahkMax: 1537,
      ahkPhaseOutStart: 22660,
      ahkPhaseOutRate: 0.03048,
      ahkPhaseOutEnd: 73_031,
      akStages: [
        { from: 0, to: 11491, baseAmount: 0, rate: 0.04118 },
        { from: 11491, to: 24821, baseAmount: 473, rate: 0.14938 },
        { from: 24821, to: 39957, baseAmount: 2465, rate: 0.01237 },
        { from: 39957, to: 124935, baseAmount: 2762, rate: -0.03257 },
        { from: 124935, to: Infinity, baseAmount: 0, rate: 0 },
      ],
    },
  },
  2025: {
    under: {
      brackets: [
        { from: 0, to: 38441, rate: 0.3582 },
        { from: 38441, to: 76817, rate: 0.3748 },
        { from: 76817, to: Infinity, rate: 0.495 },
      ],
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
      brackets: [
        { from: 0, to: 38441, rate: 0.1792 },
        { from: 38441, to: 76817, rate: 0.3748 },
        { from: 76817, to: Infinity, rate: 0.495 },
      ],
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
  2026: {
    // TODO: Verify 2026 bracket rates and AK stages with official Belastingdienst tables when published.
    // Bracket rates below are provisional (based on 2025) — update once official tables are released.
    under: {
      brackets: [
        { from: 0, to: 38883, rate: 0.3582 },
        { from: 38883, to: 78426, rate: 0.3756 },
        { from: 78426, to: Infinity, rate: 0.495 },
      ],
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
      brackets: [
        { from: 0, to: 38883, rate: 0.1792 },
        { from: 38883, to: 78426, rate: 0.3756 },
        { from: 78426, to: Infinity, rate: 0.495 },
      ],
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
};

function applyBrackets(income: number, brackets: Bracket[]): { lines: BracketLine[]; total: number } {
  let remaining = income;
  let total = 0;
  const lines: BracketLine[] = [];

  for (const b of brackets) {
    if (remaining <= 0) break;
    const size = b.to === Infinity ? remaining : Math.min(remaining, b.to - b.from);
    const tax = size * b.rate;
    lines.push({
      label:
        b.to === Infinity
          ? `> €${b.from.toLocaleString('nl-NL')}`
          : `€${b.from.toLocaleString('nl-NL')} – €${b.to.toLocaleString('nl-NL')}`,
      rate: b.rate,
      taxableAmount: size,
      tax,
    });
    total += tax;
    remaining -= size;
  }

  return { lines, total };
}

function calcAHK(income: number, p: YearParams): number {
  if (income <= p.ahkPhaseOutStart) return p.ahkMax;
  if (income >= p.ahkPhaseOutEnd) return 0;
  return Math.max(0, p.ahkMax - (income - p.ahkPhaseOutStart) * p.ahkPhaseOutRate);
}

function calcAK(income: number, p: YearParams): number {
  for (const stage of p.akStages) {
    if (income >= stage.from && income < stage.to) {
      return Math.max(0, stage.baseAmount + (income - stage.from) * stage.rate);
    }
  }
  return 0;
}

export function calculateNLTax(inputs: TaxInputs): NLTaxResult {
  const yearData = PARAMS[inputs.year] ?? PARAMS[2025];
  const p = inputs.belowAOWAge ? yearData.under : yearData.over;

  const totalDays = inputs.daysWorkedNL + inputs.daysWorkedBE;
  const nlFraction = totalDays > 0 ? inputs.daysWorkedNL / totalDays : 0;

  let nlTaxableIncome = inputs.grossSalary * nlFraction;

  if (inputs.thirtyPercentRuling) {
    // 30% of the income is tax-free; only 70% is taxed
    nlTaxableIncome *= 0.7;
  }

  const { lines: brackets, total: taxBeforeCredits } = applyBrackets(nlTaxableIncome, p.brackets);

  const ahk = calcAHK(nlTaxableIncome, p);
  const ak = calcAK(nlTaxableIncome, p);
  const totalCredits = Math.min(ahk + ak, taxBeforeCredits);
  const netTaxNL = Math.max(0, taxBeforeCredits - totalCredits);

  return {
    nlTaxableIncome,
    taxBeforeCredits,
    brackets,
    algemeneHeffingskorting: ahk,
    arbeidskorting: ak,
    totalCredits,
    netTaxNL,
    effectiveRateNL: inputs.grossSalary > 0 ? netTaxNL / inputs.grossSalary : 0,
  };
}
