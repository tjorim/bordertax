/**
 * Belgian personal income tax (personenbelasting / impôt des personnes physiques).
 *
 * For Belgian residents who work (partly) in the Netherlands under the BE-NL tax treaty.
 * Method used: Exemption with progression (vrijstelling met progressievoorbehoud).
 *
 * The Belgian declared income (code 1250) = taxable wage − Dutch income tax and premiums due, taken
 * from the Dutch assessment when the user entered it and from the engine's estimate otherwise.
 * NL-sourced income is exempt from Belgian tax but raises the progression rate.
 * Communal tax (gemeentebelasting) is levied on both the taxable AND the exempt portion.
 *
 * Calculation steps keep full precision; the returned result is rounded to whole cents once, at the
 * end (display and MCP boundary). No Belgian tax-rounding rule is claimed.
 *
 * Year-specific rates live in one module per income year in src/tax/years, assembled by params.ts.
 */
import type { TaxInputs, BETaxResult, DutchCharge } from "./types";
import { BE_PENSION_REDUCTION_RATE, BE_TAX_FREE_ALLOWANCE_REDUCTION_RATE } from "./constants";
import { getYearParams } from "./params";
import type { BEBracket, BEYearParams } from "./params";
import { roundToCents } from "./rounding";
import { sumAnnualStatements } from "./statements";
import { getNLFractions } from "./workdays";

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

  return (baseAmount + childAmount) * BE_TAX_FREE_ALLOWANCE_REDUCTION_RATE;
}

function noWorkdaysResult(): BETaxResult {
  return {
    declaredIncome: 0,
    healthInsurancePremiumDeducted: 0,
    professionalExpenses: 0,
    netProfessionalIncome: 0,
    beIncome: 0,
    commutingAllowance: 0,
    commutingExemption: 0,
    nlExemptIncome: 0,
    vrijgesteld: 0,
    volTarief: 0,
    beFraction: 0,
    basisbelasting: 0,
    belastingvrijeSomReduction: 0,
    omTeSlane: 0,
    vrijstellingReduction: 0,
    hoofdsom: 0,
    gereduceerde: 0,
    gewestelijke: 0,
    saldoFederaal: 0,
    federalReductionsUnused: 0,
    saldoGewestelijk: 0,
    totaleBelasting: 0,
    communalTax: 0,
    communalTaxOnVrijgesteld: 0,
    federalTax: 0,
    netTaxBE: 0,
    effectiveRateBE: 0,
  };
}

/** What the Belgian side needs from the Dutch side; `NLTaxResult` and `DutchCharge` both fit. */
export type DutchChargeForBE = Pick<DutchCharge, "incomeTaxDue" | "premiumsDue" | "netTaxNL">;

export function calculateBETax(inputs: TaxInputs, nl: DutchChargeForBE): BETaxResult | null {
  if (inputs.residentCountry !== "BE") return null;

  const p = getYearParams(inputs.year).be;

  const { beFraction, noWorkdays } = getNLFractions(inputs);
  const { taxableWage } = sumAnnualStatements(inputs.annualStatements);

  // Without workdays the wage is not sourced to either country, so there is no Belgian return to
  // estimate: every figure is zero rather than treating the whole wage as exempt Dutch income
  // (which would still levy communal tax on it). `TaxResult.noWorkdays` flags the state.
  if (noWorkdays) return noWorkdaysResult();

  const {
    healthInsurancePremium,
    supplementaryPension,
    exchangedGrossWage,
    commutingAllowance,
    serviceVouchers,
    reclaimableWithholdingTax,
  } = inputs;

  // Belgian wage base (ACV telework session, "bepaling Belgisch belastbaar loon"): the Dutch
  // fiscal wage is after the employee pension premium and after gross wage exchanged for
  // tax-free benefits; Belgium does not allow those reductions, so both are added back. The
  // premium is also entered at code 1285 (30% federal reduction).
  const wageBase = taxableWage + supplementaryPension + exchangedGrossWage;

  // FOD guideline (ACV telework session): W = wage − premiums actually due in the work state,
  // Y = W × (days outside NL ÷ total days) is taxable in Belgium (box IV O.1), and
  // Z = W − Y − income tax actually due in the work state is exempt (box IV O.2).
  const wageAfterPremiums = Math.max(0, wageBase - nl.premiumsDue);
  const beIncome = wageAfterPremiums * beFraction;

  // Declared income: code 1250 = wage base − netTaxNL (paid to NL, not seen by BE)
  const declaredIncome = wageBase - nl.netTaxNL;

  // Untaxed commuting allowance (code 1254) and its exemption (code 1255, forfait case). The
  // allowance is paid for commuting to the Netherlands, so it is entered in box IV O.2 as well
  // and counts as exempt income with progression; the taxable rest raises the net income.
  const commutingExemption = Math.min(commutingAllowance, p.commutingExemptionMax ?? 0);
  const commutingTaxable = commutingAllowance - commutingExemption;

  // Professional expenses (forfait applied to the income after the health-insurance premium)
  const incomeBeforeCosts = declaredIncome + commutingTaxable;
  const forfaitBase = Math.max(0, incomeBeforeCosts - healthInsurancePremium);
  const forfait = Math.min(p.forfaitRate * forfaitBase, p.forfaitMax);

  // Net professional income
  const netProfessionalIncome = Math.max(0, incomeBeforeCosts - healthInsurancePremium - forfait);

  // Code 1250 is Y + Z. Only the Dutch income tax is taken from the exempt side; the premiums are
  // deducted before the day fraction is applied, so they reduce Y and Z in proportion.
  const nlExemptDeclaredIncome = Math.max(0, declaredIncome - beIncome) + commutingTaxable;
  const nlExemptShare = incomeBeforeCosts > 0 ? nlExemptDeclaredIncome / incomeBeforeCosts : 0;

  // Exempt and taxable portions of net professional income
  const vrijgesteld = nlExemptShare * netProfessionalIncome;
  const volTarief = netProfessionalIncome - vrijgesteld;

  // nlExemptIncome for legacy/display: gross NL income (days-based)
  const nlExemptIncome = taxableWage * (1 - beFraction);

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
  const pensionReduction = supplementaryPension * BE_PENSION_REDUCTION_RATE;
  const serviceVoucherReduction = serviceVouchers * p.serviceVoucherReductionRate;

  // Saldi. The federal reductions are clamped at zero; what they exceed the federal part by is
  // reported rather than dropped silently.
  const federalReductions = pensionReduction + reclaimableWithholdingTax;
  const federalReductionsUnused = Math.max(0, federalReductions - gereduceerde);
  const saldoFederaal = Math.max(0, gereduceerde - federalReductions);
  const saldoGewestelijk = Math.max(0, gewestelijke - serviceVoucherReduction);
  const totaleBelasting = saldoFederaal + saldoGewestelijk;

  const federalTax = saldoFederaal;

  // Communal tax — levied on BOTH taxable and exempt income
  const communalRate = inputs.communalTaxRate / 100;
  const communalTax = totaleBelasting * communalRate;
  const communalTaxOnVrijgesteld = vrijstellingReduction * communalRate;

  const netTaxBE = saldoFederaal + saldoGewestelijk + communalTax + communalTaxOnVrijgesteld;

  const cents = roundToCents;
  return {
    declaredIncome: cents(declaredIncome),
    healthInsurancePremiumDeducted: cents(healthInsurancePremium),
    professionalExpenses: cents(forfait),
    netProfessionalIncome: cents(netProfessionalIncome),
    beIncome: cents(beIncome),
    commutingAllowance: cents(commutingAllowance),
    commutingExemption: cents(commutingExemption),
    nlExemptIncome: cents(nlExemptIncome),
    vrijgesteld: cents(vrijgesteld),
    volTarief: cents(volTarief),
    beFraction,
    basisbelasting: cents(basisbelasting),
    belastingvrijeSomReduction: cents(bvReduction),
    omTeSlane: cents(omTeSlane),
    vrijstellingReduction: cents(vrijstellingReduction),
    hoofdsom: cents(hoofdsom),
    gereduceerde: cents(gereduceerde),
    gewestelijke: cents(gewestelijke),
    saldoFederaal: cents(saldoFederaal),
    federalReductionsUnused: cents(federalReductionsUnused),
    saldoGewestelijk: cents(saldoGewestelijk),
    totaleBelasting: cents(totaleBelasting),
    communalTax: cents(communalTax),
    communalTaxOnVrijgesteld: cents(communalTaxOnVrijgesteld),
    federalTax: cents(federalTax),
    netTaxBE: cents(netTaxBE),
    effectiveRateBE: taxableWage > 0 ? netTaxBE / taxableWage : 0,
  };
}
