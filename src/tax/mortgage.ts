/**
 * Hypotheekrenteaftrek for a Belgian resident who may be a kwalificerend buitenlands
 * belastingplichtige (qualifying non-resident taxpayer).
 *
 * Eligibility here is only the 90% test: Dutch-taxed income ÷ worldwide income, rounded down to a
 * whole percent. Everything else (inkomensverklaring, 30-year and repayment conditions,
 * qualifying debt) cannot be verified from the inputs and is returned as an assumption.
 *
 * The financial effect is not computed here: `calculate()` runs the NL and BE engines with and
 * without the deduction and reports the difference.
 */
import { MORTGAGE_QUALIFYING_MIN_NL_PERCENT } from "./constants";
import { EIGENWONINGFORFAIT } from "./params";
import type { TaxInputs } from "./schema";

export type MortgageStatus = "eligible" | "ineligible" | "unknown";

export type MortgageReason =
  /** No income is taxed in NL, so the 90% test cannot be met. */
  | "no_nl_income"
  /** The percentage taxed in NL is at or above the threshold. */
  | "threshold_met"
  /** The percentage taxed in NL is below the threshold. */
  | "threshold_not_met"
  /** The salary alone passes; other income outside NL decides and has not been entered. */
  | "income_outside_nl_missing"
  /** Eligible, but there is no interest to deduct. */
  | "no_interest"
  | "forfait_exceeds_interest";

export type MortgageAssumption =
  /** An inkomensverklaring validated by the Belgian tax authority is required, subject to repeat-filer exceptions. */
  | "income_statement_required"
  /** The entered interest is assumed to be on qualifying home debt (eigenwoningschuld) that meets the 30-year and repayment conditions. */
  | "qualifying_debt"
  /** Missing value means an interest-only upper estimate. */
  | "home_value_missing"
  /** Full-year ordinary occupied main home; special situations not modelled. */
  | "full_year_main_home"
  /** Legacy identifier retained for compatibility; no longer returned: mortgage deductions reduce premium income. */
  | "premium_base_unchanged"
  /** Belgian tax is recomputed from the lower Dutch tax; no Belgian home benefit (woonbonus) is modelled. */
  | "no_belgian_home_benefit";

export interface MortgageEffect {
  /** NL tax reduction (positive = less tax). */
  nlTaxSaving: number;
  /** Change in BE tax (positive = more tax, as the lower NL tax raises Belgian declared income). */
  beTaxIncrease: number;
  /** Net income gain = nlTaxSaving − beTaxIncrease. */
  netBenefit: number;
}

export interface MortgageResult {
  status: MortgageStatus;
  reasons: MortgageReason[];
  assumptions: MortgageAssumption[];
  /** Whole percent of worldwide income taxed in NL. */
  nlTaxedPercent: number;
  /** True when `nlTaxedPercent` ignores unentered income outside NL, so the real figure may be lower. */
  nlTaxedPercentIsUpperBound: boolean;
  /** Interest × ownership share. */
  deductibleInterest: number;
  eigenwoningforfait: number;
  netDeduction: number;
  benefitIsUpperBound: boolean;
  /** Whether a positive net deduction is included in the totals (status is eligible). */
  applied: boolean;
  /** What the deduction would change if the taxpayer qualifies. */
  potential: MortgageEffect;
  /** What it changes in the totals: `potential` when applied, otherwise zero. */
  realised: MortgageEffect;
}

export const NO_MORTGAGE_EFFECT: MortgageEffect = {
  nlTaxSaving: 0,
  beTaxIncrease: 0,
  netBenefit: 0,
};

export function getDeductibleInterest(inputs: TaxInputs): number {
  const interest = Math.max(0, inputs.mortgageInterest ?? 0);
  const share = Math.min(100, Math.max(0, inputs.mortgageOwnershipShare ?? 100));
  return (interest * share) / 100;
}

/** Integer percent, rounded down; the epsilon keeps exact fractions such as 90/100 from floating below. */
function wholePercent(part: number, total: number): number {
  return total > 0 ? Math.floor((part * 100) / total + 1e-9) : 0;
}

export interface Eligibility {
  status: MortgageStatus;
  reasons: MortgageReason[];
  nlTaxedPercent: number;
  nlTaxedPercentIsUpperBound: boolean;
}

/**
 * @param nlTaxedIncome Income taxed in NL, before the mortgage deduction.
 * @param untaxedInNL Income from work that NL does not tax (BE and third-country workdays).
 */
export function assessEligibility(
  inputs: TaxInputs,
  nlTaxedIncome: number,
  untaxedInNL: number,
): Eligibility {
  const threshold = MORTGAGE_QUALIFYING_MIN_NL_PERCENT;
  const salaryOnlyPercent = wholePercent(nlTaxedIncome, nlTaxedIncome + untaxedInNL);

  if (nlTaxedIncome <= 0) {
    return {
      status: "ineligible",
      reasons: ["no_nl_income"],
      nlTaxedPercent: 0,
      nlTaxedPercentIsUpperBound: false,
    };
  }
  // Other income can only lower the percentage, so a failing salary-only figure is final.
  if (salaryOnlyPercent < threshold) {
    return {
      status: "ineligible",
      reasons: ["threshold_not_met"],
      nlTaxedPercent: salaryOnlyPercent,
      nlTaxedPercentIsUpperBound: inputs.incomeOutsideNL === undefined,
    };
  }
  if (inputs.incomeOutsideNL === undefined) {
    return {
      status: "unknown",
      reasons: ["income_outside_nl_missing"],
      nlTaxedPercent: salaryOnlyPercent,
      nlTaxedPercentIsUpperBound: true,
    };
  }
  const percent = wholePercent(nlTaxedIncome, nlTaxedIncome + untaxedInNL + inputs.incomeOutsideNL);
  return {
    status: percent >= threshold ? "eligible" : "ineligible",
    reasons: [percent >= threshold ? "threshold_met" : "threshold_not_met"],
    nlTaxedPercent: percent,
    nlTaxedPercentIsUpperBound: false,
  };
}

export const MORTGAGE_ASSUMPTIONS: readonly MortgageAssumption[] = [
  "income_statement_required",
  "qualifying_debt",
  "full_year_main_home",
  "no_belgian_home_benefit",
];

/** Calculate on the whole home first, then allocate ownership (no partner optimisation). */
export function getEigenwoningforfait(inputs: TaxInputs): number {
  if (inputs.mortgageHomeValue === undefined) return 0;
  const value = Math.max(0, inputs.mortgageHomeValue);
  const p = EIGENWONINGFORFAIT[inputs.year];
  const band =
    value <= 12500 ? 0 : value <= 25000 ? 1 : value <= 50000 ? 2 : value <= 75000 ? 3 : 4;
  const whole =
    value > p.threshold ? p.base + (value - p.threshold) * p.excessRate : value * p.rates[band]!;
  return (whole * Math.min(100, Math.max(0, inputs.mortgageOwnershipShare ?? 100))) / 100;
}
