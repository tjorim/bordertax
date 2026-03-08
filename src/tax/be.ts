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
 * Sources:
 *   Brackets: https://fin.belgium.be/en/private-individuals/tax-return/income/tax-rates
 *   2024 gereduceerdRate / gewestelijkeRate: verified from official BE aanslagbiljet 2025 (income 2024)
 *
 * TODO: Verify gereduceerdRate / gewestelijkeRate for 2025 and 2026 once official billets are available.
 */
import type { TaxInputs, BETaxResult, NLTaxResult, TaxYear } from "./types";

interface BEBracket {
  from: number;
  to: number;
  rate: number;
}

interface BEYearParams {
  brackets: BEBracket[];
  baseBelastingvrijeSom: number;
  childExtraAmounts: number[]; // [0 children, 1, 2, 3, 4] – index = number of dependent children
  extraPerChildAbove4: number;
  forfaitRate: number;
  forfaitMax: number;
  /** Federal reduction rate: portion of hoofdsom that is federal (verified per year). */
  gereduceerdRate: number;
  /** Regional supplement rate applied to gereduceerde (verified per year). */
  gewestelijkeRate: number;
}

const BE_PARAMS: Record<TaxYear, BEYearParams> = {
  2024: {
    brackets: [
      { from: 0, to: 15820, rate: 0.25 },
      { from: 15820, to: 27920, rate: 0.4 },
      { from: 27920, to: 46740, rate: 0.45 },
      { from: 46740, to: Infinity, rate: 0.5 },
    ],
    baseBelastingvrijeSom: 10570,
    childExtraAmounts: [0, 1690, 4340, 9730, 15740],
    extraPerChildAbove4: 5990,
    forfaitRate: 0.3,
    forfaitMax: 5750,
    // Verified from official BE aanslagbiljet personenbelasting 2025 (income 2024)
    gereduceerdRate: 0.75043,
    gewestelijkeRate: 0.33257,
  },
  2025: {
    brackets: [
      { from: 0, to: 16320, rate: 0.25 },
      { from: 16320, to: 28800, rate: 0.4 },
      { from: 28800, to: 48320, rate: 0.45 },
      { from: 48320, to: Infinity, rate: 0.5 },
    ],
    baseBelastingvrijeSom: 10910,
    childExtraAmounts: [0, 1740, 4490, 10070, 16270],
    extraPerChildAbove4: 6190,
    forfaitRate: 0.3,
    forfaitMax: 5930,
    // TODO: Verify with official 2025 aanslagbiljet when available
    gereduceerdRate: 0.75043,
    gewestelijkeRate: 0.33257,
  },
  2026: {
    // TODO: Update with official 2026 figures when published
    brackets: [
      { from: 0, to: 16320, rate: 0.25 },
      { from: 16320, to: 28800, rate: 0.35 }, // proposed reform: 40→35
      { from: 28800, to: 48320, rate: 0.45 },
      { from: 48320, to: Infinity, rate: 0.5 },
    ],
    baseBelastingvrijeSom: 11200,
    childExtraAmounts: [0, 1790, 4620, 10360, 16740],
    extraPerChildAbove4: 6370,
    forfaitRate: 0.3,
    forfaitMax: 6100,
    // TODO: Verify with official 2026 aanslagbiljet when available
    gereduceerdRate: 0.75043,
    gewestelijkeRate: 0.33257,
  },
};

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
  const childAmount =
    n === 0
      ? 0
      : n <= 4
        ? (p.childExtraAmounts[n] ?? 0)
        : (p.childExtraAmounts[4] ?? 0) + (n - 4) * p.extraPerChildAbove4;

  return (baseAmount + childAmount) * 0.25;
}

export function calculateBETax(inputs: TaxInputs, nl: NLTaxResult): BETaxResult | null {
  if (inputs.residentCountry !== "BE") return null;

  const p = BE_PARAMS[inputs.year] ?? BE_PARAMS[2025];

  const totalDays = inputs.daysWorkedNL + inputs.daysWorkedBE;
  const beFraction = totalDays > 0 ? inputs.daysWorkedBE / totalDays : 0;

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

  // NL exempt net income = nlTaxableIncome − netTaxNL (the NL after-tax earnings)
  const nlNetIncome = Math.max(0, nl.nlTaxableIncome - nl.netTaxNL);

  // Vrijgesteld fraction: what share of declaredIncome is NL-sourced net income
  const vrijgesteldFrac =
    declaredIncome > 0 ? Math.min(1, nlNetIncome / declaredIncome) : 0;

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

  // federalTax = combined saldo (saldoFederaal + saldoGewestelijk)
  const federalTax = totaleBelasting;

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
