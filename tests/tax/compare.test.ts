import { describe, expect, it } from "vitest";

import { compareScenarios } from "@/tax/compare";
import { DEFAULT_INPUTS } from "@/tax/defaults";
import { PersistedInputsSchema, TaxInputSchema } from "@/tax/schema";
import type { TaxInputs } from "@/tax/types";

const a: TaxInputs = {
  ...DEFAULT_INPUTS,
  annualStatements: [{ taxableWage: 70000, wageTaxWithheld: 0 }],
  daysWorkedNL: 180,
  daysWorkedBE: 20,
  mortgageEnabled: true,
  mortgageInterest: 8000,
  incomeOutsideNL: 0,
};

describe("compareScenarios", () => {
  it("reports no change for identical scenarios", () => {
    const c = compareScenarios(a, { ...a });

    expect(c.changed).toEqual([]);
    expect(c.delta.netIncome).toBe(0);
    expect(c.attribution.netIncome).toEqual({});
  });

  it("computes deltas as b − a", () => {
    const c = compareScenarios(a, {
      ...a,
      annualStatements: [{ taxableWage: 80000, wageTaxWithheld: 0 }],
    });

    expect(c.delta.taxableWage).toBe(10000);
    expect(c.delta.totalTax).toBeCloseTo(c.b.totalTax - c.a.totalTax, 6);
    expect(c.delta.netIncome).toBeCloseTo(c.b.netIncome - c.a.netIncome, 6);
    expect(c.delta.netIncomeMonthly).toBeCloseTo(c.delta.netIncome / 12, 6);
    expect(c.changed).toEqual(["income"]);
  });

  it("attributes the whole difference to a single changed group", () => {
    const c = compareScenarios(a, {
      ...a,
      annualStatements: [{ taxableWage: 80000, wageTaxWithheld: 0 }],
    });

    expect(c.attribution.netIncome.income).toBeCloseTo(c.delta.netIncome, 6);
  });

  it("splits a multi-group change so the shares add up to the delta", () => {
    const b: TaxInputs = {
      ...a,
      annualStatements: [{ taxableWage: 75000, wageTaxWithheld: 0 }],
      daysWorkedNL: 120,
      daysWorkedBE: 80,
      mortgageInterest: 12000,
    };
    const c = compareScenarios(a, b);

    expect(c.changed).toEqual(["workdays", "income", "mortgage"]);
    for (const metric of ["nlTax", "beTax", "netIncome"] as const) {
      const total = Object.values(c.attribution[metric]).reduce((sum, v) => sum + v, 0);
      const delta = metric === "netIncome" ? c.delta.netIncome : c.delta[metric];
      expect(total).toBeCloseTo(delta, 6);
    }
  });

  it("shows losing eligibility as a workday effect, not a mortgage change", () => {
    // a keeps the 90% test; b moves to 50% home days and loses the deduction
    const b = { ...a, daysWorkedNL: 100, daysWorkedBE: 100 };
    const c = compareScenarios(a, b);

    expect(c.a.mortgage?.status).toBe("eligible");
    expect(c.b.mortgage?.status).toBe("ineligible");
    expect(c.changed).toEqual(["workdays"]);
    expect(c.attribution.netIncome.workdays).toBeCloseTo(c.delta.netIncome, 6);
  });

  it("is symmetric: swapping the scenarios negates the deltas", () => {
    const b = { ...a, daysWorkedNL: 100, daysWorkedBE: 100, mortgageInterest: 3000 };
    const forward = compareScenarios(a, b);
    const backward = compareScenarios(b, a);

    expect(backward.delta.netIncome).toBeCloseTo(-forward.delta.netIncome, 6);
    for (const group of forward.changed) {
      expect(backward.attribution.netIncome[group]).toBeCloseTo(
        -(forward.attribution.netIncome[group] ?? 0),
        6,
      );
    }
  });

  it("groups inputs outside workdays, income and mortgage as other", () => {
    expect(compareScenarios(a, { ...a, dependentChildren: 2 }).changed).toEqual(["other"]);
  });
});

describe("Dutch assessment inputs", () => {
  const assessment = { assessmentIncomeTaxDue: 2700, assessmentPremiumsDue: 5900 };

  it("groups the assessment as other and uses the assessed Dutch tax", () => {
    const c = compareScenarios(a, { ...a, ...assessment });

    expect(c.changed).toEqual(["other"]);
    expect(c.b.nlCharge.netTaxNL).toBe(8600);
    expect(c.delta.nlTax).toBeCloseTo(8600 - c.a.nl.netTaxNL, 8);
    expect(c.delta.totalTax).toBeCloseTo(c.delta.nlTax + c.delta.beTax, 8);
    expect(c.attribution.nlTax.other).toBeCloseTo(c.delta.nlTax, 8);
  });

  it("is not persisted across reloads", () => {
    const persisted = PersistedInputsSchema.parse({ ...DEFAULT_INPUTS, ...assessment });
    expect(persisted).not.toHaveProperty("assessmentIncomeTaxDue");
    expect(persisted).not.toHaveProperty("assessmentPremiumsDue");
  });
});

describe("mortgage inputs in the schema", () => {
  it("keeps unset values undefined and clamps entered ones", () => {
    const parsed = TaxInputSchema.parse({
      ...DEFAULT_INPUTS,
      mortgageInterest: -5,
      mortgageOwnershipShare: 250,
    });

    expect(parsed.incomeOutsideNL).toBeUndefined();
    expect(parsed.mortgageInterest).toBe(0);
    expect(parsed.mortgageOwnershipShare).toBe(100);
  });

  it("drops invalid mortgage values to undefined", () => {
    const parsed = TaxInputSchema.parse({ ...DEFAULT_INPUTS, incomeOutsideNL: "lots" });

    expect(parsed.incomeOutsideNL).toBeUndefined();
  });
});
