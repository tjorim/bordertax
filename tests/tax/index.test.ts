import { describe, expect, it } from "vitest";

import { calculate } from "@/tax/index";
import type { TaxInputs } from "@/tax/types";

const base: TaxInputs = {
  year: 2025,
  residentCountry: "NL",
  civilStatus: "single",
  dependentChildren: 0,
  belowAOWAge: true,
  belgianRegion: "flemish",
  communalTaxRate: 7,
  grossSalary: 60000,
  daysWorkedNL: 220,
  daysWorkedBE: 0,
  thirtyPercentRuling: false,
};

describe("calculate", () => {
  it("returns zero tax and net income for zero gross salary", () => {
    const result = calculate({ ...base, grossSalary: 0 });

    expect(result.totalTax).toBe(0);
    expect(result.netIncome).toBe(0);
    expect(result.effectiveRateTotal).toBe(0);
    expect(result.be).toBeNull();
  });

  it("returns null be result for NL resident", () => {
    const result = calculate({ ...base, residentCountry: "NL" });
    expect(result.be).toBeNull();
  });

  it("returns non-null be result for BE resident", () => {
    const result = calculate({ ...base, residentCountry: "BE", daysWorkedBE: 20 });
    expect(result.be).not.toBeNull();
  });

  it("grossIncome equals grossSalary input", () => {
    const result = calculate({ ...base });
    expect(result.grossIncome).toBe(base.grossSalary);
  });

  it("netIncome equals grossSalary minus totalTax", () => {
    const result = calculate({ ...base });
    expect(result.netIncome).toBeCloseTo(result.grossIncome - result.totalTax, 5);
  });

  it("totalTax equals nl.netTaxNL when residentCountry is NL", () => {
    const result = calculate({ ...base, residentCountry: "NL" });
    expect(result.totalTax).toBeCloseTo(result.nl.netTaxNL, 5);
  });

  it("totalTax equals nl.netTaxNL + be.netTaxBE for BE resident", () => {
    const result = calculate({ ...base, residentCountry: "BE", daysWorkedBE: 20 });
    expect(result.totalTax).toBeCloseTo(result.nl.netTaxNL + (result.be?.netTaxBE ?? 0), 5);
  });

  it("effectiveRateTotal is totalTax / grossSalary", () => {
    const result = calculate({ ...base });
    expect(result.effectiveRateTotal).toBeCloseTo(result.totalTax / result.grossIncome, 10);
  });

  it("effectiveRateTotal is 0 when grossSalary is 0", () => {
    const result = calculate({ ...base, grossSalary: 0 });
    expect(result.effectiveRateTotal).toBe(0);
  });

  it("inputs are preserved in result", () => {
    const result = calculate({ ...base });
    expect(result.inputs).toEqual(base);
  });

  describe("sick days sourcing fractions", () => {
    it("nlFractionNL equals NL days / (NL + BE + other) ignoring sick days", () => {
      const result = calculate({ ...base, daysWorkedNL: 200, daysWorkedBE: 20, sickDays: 10 });
      expect(result.nlFractionNL).toBeCloseTo(200 / 220, 10);
    });

    it("nlFractionBE equals NL days / (NL + BE + other + sick days)", () => {
      const result = calculate({ ...base, daysWorkedNL: 200, daysWorkedBE: 20, sickDays: 10 });
      expect(result.nlFractionBE).toBeCloseTo(200 / 230, 10);
    });

    it("nlFractionNL and nlFractionBE are equal when sickDays is 0", () => {
      const result = calculate({ ...base, daysWorkedNL: 200, daysWorkedBE: 20, sickDays: 0 });
      expect(result.nlFractionNL).toBeCloseTo(result.nlFractionBE, 10);
    });

    it("nlFractionBE is less than nlFractionNL when sickDays > 0", () => {
      const result = calculate({ ...base, daysWorkedNL: 200, daysWorkedBE: 20, sickDays: 10 });
      expect(result.nlFractionBE).toBeLessThan(result.nlFractionNL);
    });

    it("both fractions are 0 when all days are 0", () => {
      const result = calculate({ ...base, daysWorkedNL: 0, daysWorkedBE: 0, sickDays: 0 });
      expect(result.nlFractionNL).toBe(0);
      expect(result.nlFractionBE).toBe(0);
    });

    it("nlFractionBE is 0 when NL days are 0 but there are sick days", () => {
      const result = calculate({ ...base, daysWorkedNL: 0, daysWorkedBE: 20, sickDays: 5 });
      expect(result.nlFractionBE).toBe(0);
    });

    it("nlFractionNL is 1 when all worked days are NL days", () => {
      const result = calculate({ ...base, daysWorkedNL: 220, daysWorkedBE: 0, sickDays: 0 });
      expect(result.nlFractionNL).toBe(1);
    });
  });
});
