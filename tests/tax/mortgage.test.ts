import { describe, expect, it } from "vitest";

import { VALID_YEARS } from "@/tax/constants";
import { DEFAULT_INPUTS } from "@/tax/defaults";
import { calculate } from "@/tax/index";
import { assessEligibility, getDeductibleInterest } from "@/tax/mortgage";
import { TAX_PARAMS } from "@/tax/params";
import type { TaxInputs } from "@/tax/types";

const base: TaxInputs = {
  ...DEFAULT_INPUTS,
  grossSalary: 60000,
  daysWorkedNL: 220,
  daysWorkedBE: 0,
  mortgageEnabled: true,
  mortgageInterest: 6000,
  incomeOutsideNL: 0,
};

describe("mortgage scenario", () => {
  it("is absent unless enabled, and ignores the mortgage fields", () => {
    const off = calculate({ ...base, mortgageEnabled: false });
    const none = calculate({
      ...DEFAULT_INPUTS,
      grossSalary: 60000,
      daysWorkedNL: 220,
      daysWorkedBE: 0,
    });

    expect(off.mortgage).toBeNull();
    expect(off.totalTax).toBe(none.totalTax);
  });

  it("deducts eligible interest from NL taxable income at the bracket rate", () => {
    const without = calculate({ ...base, mortgageEnabled: false });
    const result = calculate(base);

    expect(result.mortgage?.status).toBe("eligible");
    expect(result.mortgage?.applied).toBe(true);
    expect(result.nl.mortgageDeduction).toBe(6000);
    expect(result.nl.nlTaxableIncome).toBe(without.nl.nlTaxableIncome - 6000);
    // 60k sits wholly in the 37.48% bracket: 6000 × 0.3748 = 2248.8
    expect(result.mortgage?.realised.nlTaxSaving).toBeCloseTo(2249, -1);
    expect(without.nl.netTaxNL - result.nl.netTaxNL).toBeCloseTo(2249, -1);
  });

  it("reports the net benefit after the Belgian tax change, not interest × marginal rate", () => {
    const { mortgage } = calculate(base);

    expect(mortgage?.realised.beTaxIncrease).toBeGreaterThan(0);
    expect(mortgage?.realised.netBenefit).toBeCloseTo(
      (mortgage?.realised.nlTaxSaving ?? 0) - (mortgage?.realised.beTaxIncrease ?? 0),
      6,
    );
    expect(mortgage?.realised.netBenefit).toBeLessThan(mortgage?.realised.nlTaxSaving ?? 0);
    expect(calculate(base).netIncome).toBeCloseTo(
      calculate({ ...base, mortgageEnabled: false }).netIncome +
        (mortgage?.realised.netBenefit ?? 0),
      6,
    );
  });

  it("relieves the part of the deduction taxed above the cap only at the cap rate", () => {
    const high = { ...base, grossSalary: 100000, mortgageInterest: 10000 };
    const without = calculate({ ...high, mortgageEnabled: false });
    const result = calculate(high);

    // all 10k lies in the 49.5% bracket, relieved at 37.48%
    expect(result.nl.mortgageRateCapSurcharge).toBe(Math.round(10000 * (0.495 - 0.3748)));
    expect(without.nl.netTaxNL - result.nl.netTaxNL).toBeCloseTo(3748, -1);
  });

  it("has no cap surcharge when the deduction stays within the capped bracket", () => {
    expect(calculate(base).nl.mortgageRateCapSurcharge).toBe(0);
  });

  it("never takes NL taxable income below zero", () => {
    const result = calculate({ ...base, grossSalary: 1000, mortgageInterest: 50000 });

    expect(result.nl.nlTaxableIncome).toBe(0);
    expect(result.nl.mortgageDeduction).toBe(1000);
  });

  it("applies the ownership share", () => {
    const half = calculate({ ...base, mortgageOwnershipShare: 50 });

    expect(half.mortgage?.deductibleInterest).toBe(3000);
    expect(half.nl.mortgageDeduction).toBe(3000);
  });

  it("treats zero interest as eligible with no effect", () => {
    const result = calculate({ ...base, mortgageInterest: 0 });

    expect(result.mortgage?.status).toBe("eligible");
    expect(result.mortgage?.reasons).toContain("no_interest");
    expect(result.mortgage?.applied).toBe(false);
    expect(result.mortgage?.potential.netBenefit).toBe(0);
  });
});

describe("90% test", () => {
  // 20 BE days of 200 → exactly 90% of salary taxed in NL
  const atThreshold = { ...base, daysWorkedNL: 180, daysWorkedBE: 20 };

  it("passes at exactly 90%", () => {
    const result = calculate(atThreshold);

    expect(result.mortgage?.nlTaxedPercent).toBe(90);
    expect(result.mortgage?.status).toBe("eligible");
  });

  it("fails just below 90%, rounding down", () => {
    // 179/200 = 89.5% → 89
    const result = calculate({ ...atThreshold, daysWorkedNL: 179, daysWorkedBE: 21 });

    expect(result.mortgage?.nlTaxedPercent).toBe(89);
    expect(result.mortgage?.status).toBe("ineligible");
    expect(result.mortgage?.reasons).toEqual(["threshold_not_met"]);
  });

  it("does not apply the deduction when ineligible but still reports the potential benefit", () => {
    const failing = { ...atThreshold, daysWorkedNL: 150, daysWorkedBE: 50 };
    const result = calculate(failing);

    expect(result.mortgage?.applied).toBe(false);
    expect(result.nl.mortgageDeduction).toBe(0);
    expect(result.totalTax).toBe(calculate({ ...failing, mortgageEnabled: false }).totalTax);
    expect(result.mortgage?.potential.netBenefit).toBeGreaterThan(0);
    expect(result.mortgage?.realised.netBenefit).toBe(0);
  });

  it("is unknown when the salary passes but income outside NL was not entered", () => {
    const result = calculate({ ...atThreshold, incomeOutsideNL: undefined });

    expect(result.mortgage?.status).toBe("unknown");
    expect(result.mortgage?.reasons).toEqual(["income_outside_nl_missing"]);
    expect(result.mortgage?.nlTaxedPercentIsUpperBound).toBe(true);
    expect(result.mortgage?.applied).toBe(false);
  });

  it("is ineligible, not unknown, when the salary alone already fails", () => {
    const result = calculate({
      ...atThreshold,
      daysWorkedNL: 100,
      daysWorkedBE: 100,
      incomeOutsideNL: undefined,
    });

    expect(result.mortgage?.status).toBe("ineligible");
  });

  it("counts income outside NL, which can remove eligibility", () => {
    // 54k taxed in NL, 6k not; 1 more euro outside NL drops it below 90%
    const result = calculate({ ...atThreshold, incomeOutsideNL: 1000 });

    expect(result.mortgage?.nlTaxedPercent).toBe(88);
    expect(result.mortgage?.status).toBe("ineligible");
  });

  it("is ineligible with no NL workdays", () => {
    const result = calculate({ ...base, daysWorkedNL: 0, daysWorkedBE: 100 });

    expect(result.mortgage?.status).toBe("ineligible");
    expect(result.mortgage?.reasons).toEqual(["no_nl_income"]);
  });

  it("assessEligibility is exact at integer boundaries", () => {
    expect(assessEligibility(base, 90, 10).nlTaxedPercent).toBe(90);
    expect(assessEligibility(base, 899, 101).nlTaxedPercent).toBe(89);
  });
});

describe("inputs and params", () => {
  it("defaults the ownership share to 100% and clamps it", () => {
    expect(getDeductibleInterest({ ...base, mortgageOwnershipShare: undefined })).toBe(6000);
    expect(getDeductibleInterest({ ...base, mortgageOwnershipShare: 150 })).toBe(6000);
    expect(getDeductibleInterest({ ...base, mortgageInterest: -5 })).toBe(0);
  });

  it("has a deduction rate cap for every supported year", () => {
    for (const year of VALID_YEARS) {
      const cap = TAX_PARAMS[year].nl.mortgageDeductionRateCap;
      expect(cap).toBeGreaterThan(0.3);
      expect(cap).toBeLessThanOrEqual(0.495);
    }
  });

  it("calculates a result for every supported year", () => {
    for (const year of VALID_YEARS) {
      const result = calculate({ ...base, year, grossSalary: 100000, mortgageInterest: 8000 });
      expect(result.mortgage?.realised.netBenefit).toBeGreaterThan(0);
    }
  });
});

describe("privacy", () => {
  it("never persists mortgage inputs", async () => {
    const { PersistedInputsSchema } = await import("@/tax/schema");
    const persisted = PersistedInputsSchema.parse({ ...base, mortgageInterest: 6000 });

    expect(Object.keys(persisted).filter((key) => /mortgage|incomeOutsideNL/.test(key))).toEqual(
      [],
    );
  });
});
