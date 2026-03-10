/**
 * Dutch income tax (Box 1) calculation.
 *
 * Volksverzekeringen (social premiums) are calculated separately on the full gross salary,
 * because social insurance applies to the full employment relationship.
 *
 * Income-tax-only bracket rates are derived from the combined rates by subtracting
 * the social premium rate (27.65% for under-AOW, 9.75% for over-AOW).
 *
 * For Belgian residents, algemeneHeffingskorting (AHK) is 0 per Belastingdienst
 * policy for buitenlandse belastingplichtigen.
 *
 * Year-specific rates are in params.ts — that is the only file that needs updating each year.
 */
import type { TaxInputs, NLTaxResult, BracketLine } from "./types";
import { getNLYearParams } from "./params";
import type { NLBracket, NLYearParams } from "./params";

function applyBrackets(
  income: number,
  brackets: NLBracket[],
): { lines: BracketLine[]; total: number } {
  let remaining = income;
  let total = 0;
  const lines: BracketLine[] = [];

  for (const b of brackets) {
    if (remaining <= 0) break;
    const size = b.to === Infinity ? remaining : Math.min(remaining, b.to - b.from);
    const tax = Math.floor(size * b.rate);
    lines.push({
      label:
        b.to === Infinity
          ? `> €${b.from.toLocaleString("nl-NL")}`
          : `€${b.from.toLocaleString("nl-NL")} – €${b.to.toLocaleString("nl-NL")}`,
      rate: b.rate,
      taxableAmount: size,
      tax,
    });
    total += tax;
    remaining -= size;
  }

  return { lines, total };
}

function calcAHK(income: number, p: NLYearParams): number {
  if (income <= p.ahkPhaseOutStart) return p.ahkMax;
  if (income >= p.ahkPhaseOutEnd) return 0;
  return Math.ceil(Math.max(0, p.ahkMax - (income - p.ahkPhaseOutStart) * p.ahkPhaseOutRate));
}

function calcAK(income: number, p: NLYearParams): number {
  for (const stage of p.akStages) {
    if (income >= stage.from && income < stage.to) {
      return Math.ceil(Math.max(0, stage.baseAmount + (income - stage.from) * stage.rate));
    }
  }
  return 0;
}

export function calculateNLTax(inputs: TaxInputs): NLTaxResult {
  const p = getNLYearParams(inputs.year, inputs.belowAOWAge);

  const totalDays = inputs.daysWorkedNL + inputs.daysWorkedBE + (inputs.daysWorkedOther ?? 0);
  const nlFraction = totalDays > 0 ? inputs.daysWorkedNL / totalDays : 0;

  let nlTaxableIncome = Math.round(inputs.grossSalary * nlFraction);

  if (inputs.thirtyPercentRuling) {
    // 30% of the income is tax-free; only 70% is taxed
    nlTaxableIncome = Math.round(nlTaxableIncome * 0.7);
  }

  // Income tax only — applied to NL-fraction income
  const { lines: brackets, total: taxBeforeCredits } = applyBrackets(
    nlTaxableIncome,
    p.incomeTaxBrackets,
  );

  // Volksverzekeringen — social premiums on full gross salary (not the NL fraction)
  const volksverzekeringen = Math.floor(
    Math.min(inputs.grossSalary, p.socialPremiumMax) * p.socialPremiumRate,
  );

  // AHK: 0 for Belgian residents (buitenlandse belastingplichtige policy)
  const ahk = inputs.residentCountry === "BE" ? 0 : calcAHK(inputs.grossSalary, p);

  // AK: always calculated on full gross salary (verified from Belastingdienst aanslag)
  const ak = calcAK(inputs.grossSalary, p);

  const totalCredits = Math.min(ahk + ak, taxBeforeCredits + volksverzekeringen);
  const netTaxNL = Math.max(0, taxBeforeCredits + volksverzekeringen - totalCredits);

  return {
    nlTaxableIncome,
    taxBeforeCredits,
    brackets,
    algemeneHeffingskorting: ahk,
    arbeidskorting: ak,
    totalCredits,
    volksverzekeringen,
    netTaxNL,
    effectiveRateNL: inputs.grossSalary > 0 ? netTaxNL / inputs.grossSalary : 0,
  };
}
