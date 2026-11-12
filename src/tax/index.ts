import type { TaxInputs, TaxResult } from "./types";
import { calculateNLTax, resolveDutchCharge } from "./nl";
import { calculateBETax } from "./be";
import { getNLFractions } from "./workdays";
import {
  NO_MORTGAGE_EFFECT,
  assessEligibility,
  getDeductibleInterest,
  getEigenwoningforfait,
  getMortgageAssumptions,
  type MortgageEffect,
} from "./mortgage";

type CoreResult = Omit<TaxResult, "mortgage">;

function calculateCore(
  inputs: TaxInputs,
  mortgageDeduction: number,
  grossInterest = mortgageDeduction,
): CoreResult {
  const nl = calculateNLTax(inputs, mortgageDeduction, grossInterest);
  // The Dutch assessment, when entered, replaces the estimate here and only here; `nl` stays the
  // app's own estimate so the two can be compared.
  const nlCharge = resolveDutchCharge(inputs, nl);
  const be = calculateBETax(inputs, nlCharge);

  const totalTax = nlCharge.netTaxNL + (be?.netTaxBE ?? 0);
  const netIncome = inputs.grossSalary - totalTax;

  const { nlFractionDutchMethod, nlFractionBelgianMethod } = getNLFractions(inputs);

  return {
    inputs,
    nl,
    nlCharge,
    be,
    grossIncome: inputs.grossSalary,
    totalTax,
    netIncome,
    effectiveRateTotal: inputs.grossSalary > 0 ? totalTax / inputs.grossSalary : 0,
    nlFractionDutchMethod,
    nlFractionBelgianMethod,
  };
}

function effectOf(without: CoreResult, withDeduction: CoreResult): MortgageEffect {
  const nlTaxSaving = without.nl.netTaxNL - withDeduction.nl.netTaxNL;
  const beTaxIncrease = (withDeduction.be?.netTaxBE ?? 0) - (without.be?.netTaxBE ?? 0);
  return { nlTaxSaving, beTaxIncrease, netBenefit: nlTaxSaving - beTaxIncrease };
}

export function calculate(inputs: TaxInputs): TaxResult {
  const withoutMortgage = calculateCore(inputs, 0);
  if (!inputs.mortgageEnabled) return { ...withoutMortgage, mortgage: null };

  const eligibility = assessEligibility(
    inputs,
    withoutMortgage.nl.nlTaxableIncome,
    withoutMortgage.nl.deelNietInNLBelast,
  );
  const deductibleInterest = getDeductibleInterest(inputs);
  const eigenwoningforfait = getEigenwoningforfait(inputs);
  const netDeduction = Math.max(0, deductibleInterest - eigenwoningforfait);
  const benefitIsUpperBound = inputs.mortgageHomeValue === undefined;
  const withMortgage =
    netDeduction > 0 ? calculateCore(inputs, netDeduction, deductibleInterest) : withoutMortgage;
  // An assessment already fixes the Dutch charge, so it cannot show what the deduction changes.
  // The saving and the extra Belgian tax are measured on the estimate, with the same inputs
  // otherwise, so that they stay consistent with each other.
  const assessed = withoutMortgage.nlCharge.source === "assessment";
  const estimateInputs: TaxInputs = {
    ...inputs,
    assessmentIncomeTaxDue: undefined,
    assessmentPremiumsDue: undefined,
  };
  const effectWithout = assessed ? calculateCore(estimateInputs, 0) : withoutMortgage;
  const effectWith =
    netDeduction <= 0
      ? effectWithout
      : assessed
        ? calculateCore(estimateInputs, netDeduction, deductibleInterest)
        : withMortgage;
  const potential = effectOf(effectWithout, effectWith);
  const applied = eligibility.status === "eligible" && netDeduction > 0;
  const reasons = [...eligibility.reasons];
  if (eligibility.status === "eligible" && deductibleInterest <= 0) reasons.push("no_interest");
  if (eigenwoningforfait > deductibleInterest) reasons.push("forfait_exceeds_interest");

  return {
    ...(applied ? withMortgage : withoutMortgage),
    mortgage: {
      ...eligibility,
      reasons,
      assumptions: [
        ...getMortgageAssumptions(inputs.year),
        ...(benefitIsUpperBound ? ["home_value_missing" as const] : []),
      ],
      eigenwoningforfait,
      netDeduction,
      benefitIsUpperBound,
      deductibleInterest,
      applied,
      potential,
      realised: applied ? potential : NO_MORTGAGE_EFFECT,
    },
  };
}

export type { TaxInputs, TaxResult, NLTaxResult, BETaxResult, BracketLine } from "./types";
export type { MortgageResult, MortgageStatus, MortgageReason, MortgageEffect } from "./mortgage";
