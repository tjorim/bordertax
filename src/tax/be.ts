/**
 * Belgian personal income tax (personenbelasting / impôt des personnes physiques).
 *
 * For Belgian residents who work (partly) in the Netherlands under the BE-NL tax treaty.
 * Method used: Exemption with progression (vrijstelling met progressievoorbehoud).
 *
 * The Belgian declared income (code 1250) = grossSalary − nl.netTaxNL.
 * NL-sourced income is exempt from Belgian tax but raises the progression rate.
 * Communal tax (gemeentebelasting) is levied on both the taxable AND the exempt portion.
 *
 * Year-specific rates are in params.ts — that is the only file that needs updating each year.
 */
import type { TaxInputs, BETaxResult, NLTaxResult } from "./types";
import { TAX_PARAMS } from "./params";
import type { BEBracket, BEYearParams } from "./params";

function applyBEBrackets(income: number, brackets: BEBracket[]): number {
  let remaining = income;
  let tax = 0;
  for (const b of brackets) {
    if (remaining <= 0) break;
    const size = b.to === Infinity ? remaining : Math.min(remaining, b.to - b.from);
    tax += size * b.rate;
    remaining -= size;
  }
  return tax;
}

/**
 * Belgian belastingvrije som (tax-free allowance).
 * The actual tax reduction = 25% of the allowance amount.
 */
function belastingvrijeSomReduction(inputs: TaxInputs, p: BEYearParams): number {
  const n = Math.max(0, inputs.dependentChildren);
  const baseAmount = p.baseBelastingvrijeSom;

  if (n > 4 && p.extraPerChildAbove4 == null) {
    throw new Error(`Unsupported dependent children count for tax year ${inputs.year}: ${n} (>4)`);
  }

  const childAmount =
    n === 0
      ? 0
      : n <= 4
        ? (p.childExtraAmounts[n] ?? 0)
        : (p.childExtraAmounts[4] ?? 0) + (n - 4) * (p.extraPerChildAbove4 ?? 0);

  return (baseAmount + childAmount) * 0.25;
}

export function calculateBETax(inputs: TaxInputs, nl: NLTaxResult): BETaxResult | null {
  if (inputs.residentCountry !== "BE") return null;

  const yearParams = TAX_PARAMS[inputs.year];
  if (!yearParams) {
    throw new Error(`Unsupported tax year: ${inputs.year}`);
  }
  const p = yearParams.be;

  const daysOutsideNL = inputs.daysWorkedBE + (inputs.daysWorkedOther ?? 0);
  const totalDays = inputs.daysWorkedNL + daysOutsideNL;
  const beFraction = totalDays > 0 ? daysOutsideNL / totalDays : 0;

  // Gross split for reference fields
  const beIncome = inputs.grossSalary * beFraction;

  // Optional deduction inputs (default to 0)
  const socialContributions = inputs.socialContributions ?? 0;
  const aanvullendPensioen = inputs.aanvullendPensioen ?? 0;
  const dienstencheques = inputs.dienstencheques ?? 0;
  const roerendeVoorheffing = inputs.roerendeVoorheffing ?? 0;

  // Declared income: code 1250 = grossSalary − netTaxNL (paid to NL, not seen by BE)
  const declaredIncome = inputs.grossSalary - nl.netTaxNL;

  // Professional expenses (forfait applied to declared income after social contributions)
  const forfaitBase = Math.max(0, declaredIncome - socialContributions);
  const forfait = Math.min(p.forfaitRate * forfaitBase, p.forfaitMax);

  // Net professional income
  const netProfessionalIncome = Math.max(0, declaredIncome - socialContributions - forfait);

  // NL-source after-tax amount on the same base as nlTaxableIncome.
  // nlTaxOnNLSource may be negative when credits exceed taxBeforeCredits; clamp at 0
  // so nlNetFromNLSource and vrijgesteldFrac stay within a valid [0,1] ratio basis.
  const nlTaxOnNLSource = nl.netTaxNL - nl.volksverzekeringen;
  const nlNetFromNLSource = Math.max(0, nl.nlTaxableIncome - Math.max(0, nlTaxOnNLSource));

  // Vrijgesteld fraction: what share of declaredIncome is NL-sourced net income
  const vrijgesteldFrac =
    declaredIncome > 0 ? Math.min(1, nlNetFromNLSource / declaredIncome) : 0;

  // Exempt and taxable portions of net professional income
  const vrijgesteld = vrijgesteldFrac * netProfessionalIncome;
  const volTarief = netProfessionalIncome - vrijgesteld;

  // nlExemptIncome for legacy/display: gross NL income (days-based)
  const nlExemptIncome = inputs.grossSalary - beIncome;

  // Belgian progressive tax on total net professional income
  const basisbelasting = applyBEBrackets(netProfessionalIncome, p.brackets);

  // Personal exemption (belastingvrije som reduction)
  const bvReduction = belastingvrijeSomReduction(inputs, p);

  // Om te slane = tax after personal exemption
  const omTeSlane = Math.max(0, basisbelasting - bvReduction);

  // Vrijstelling reduction: proportion of omTeSlane corresponding to exempt NL income
  const vrijstellingReduction =
    netProfessionalIncome > 0 ? (vrijgesteld / netProfessionalIncome) * omTeSlane : 0;

  // Net Belgian tax before federal/regional split
  const hoofdsom = omTeSlane - vrijstellingReduction;

  // Federal/regional split
  const gereduceerde = hoofdsom * p.gereduceerdRate;
  const gewestelijke = gereduceerde * p.gewestelijkeRate;

  // Optional deductions
  const pensioenRed = aanvullendPensioen * 0.3;
  const dienstchequesRed = dienstencheques * 0.2;

  // Saldi
  const saldoFederaal = Math.max(0, gereduceerde - pensioenRed - roerendeVoorheffing);
  const saldoGewestelijk = Math.max(0, gewestelijke - dienstchequesRed);
  const totaleBelasting = saldoFederaal + saldoGewestelijk;

  const federalTax = saldoFederaal;

  // Communal tax — levied on BOTH taxable and exempt income
  const communalRate = inputs.communalTaxRate / 100;
  const communalTax = totaleBelasting * communalRate;
  const communalTaxOnVrijgesteld = vrijstellingReduction * communalRate;

  const netTaxBE = saldoFederaal + saldoGewestelijk + communalTax + communalTaxOnVrijgesteld;

  return {
    declaredIncome,
    socialContributionsDeducted: socialContributions,
    professionalExpenses: forfait,
    netProfessionalIncome,
    beIncome,
    nlExemptIncome,
    vrijgesteld,
    volTarief,
    beFraction,
    basisbelasting,
    belastingvrijeSomReduction: bvReduction,
    omTeSlane,
    vrijstellingReduction,
    hoofdsom,
    gereduceerde,
    gewestelijke,
    saldoFederaal,
    saldoGewestelijk,
    totaleBelasting,
    communalTax,
    communalTaxOnVrijgesteld,
    federalTax,
    netTaxBE,
    effectiveRateBE: inputs.grossSalary > 0 ? netTaxBE / inputs.grossSalary : 0,
  };
}
