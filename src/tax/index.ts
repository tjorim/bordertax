import type { TaxInputs, TaxResult } from "./types";
import { calculateNLTax } from "./nl";
import { calculateBETax } from "./be";
import { getNLFractions } from "./workdays";
import {
  MORTGAGE_ASSUMPTIONS,
  NO_MORTGAGE_EFFECT,
  assessEligibility,
  getDeductibleInterest,
  type MortgageEffect,
} from "./mortgage";

type CoreResult = Omit<TaxResult, "mortgage">;

function calculateCore(inputs: TaxInputs, mortgageDeduction: number): CoreResult {
  const nl = calculateNLTax(inputs, mortgageDeduction);
  const be = calculateBETax(inputs, nl);

  const totalTax = nl.netTaxNL + (be?.netTaxBE ?? 0);
  const netIncome = inputs.grossSalary - totalTax;

  const { nlFractionDutchMethod, nlFractionBelgianMethod } = getNLFractions(inputs);

  return {
    inputs,
    nl,
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
  const withMortgage =
    deductibleInterest > 0 ? calculateCore(inputs, deductibleInterest) : withoutMortgage;
  const potential = effectOf(withoutMortgage, withMortgage);
  const applied = eligibility.status === "eligible" && deductibleInterest > 0;
  const reasons =
    eligibility.status === "eligible" && deductibleInterest <= 0
      ? [...eligibility.reasons, "no_interest" as const]
      : eligibility.reasons;

  return {
    ...(applied ? withMortgage : withoutMortgage),
    mortgage: {
      ...eligibility,
      reasons,
      assumptions: [...MORTGAGE_ASSUMPTIONS],
      deductibleInterest,
      applied,
      potential,
      realised: applied ? potential : NO_MORTGAGE_EFFECT,
    },
  };
}

export type { TaxInputs, TaxResult, NLTaxResult, BETaxResult, BracketLine } from "./types";
export type { MortgageResult, MortgageStatus, MortgageReason, MortgageEffect } from "./mortgage";
