import { describe, expect, it } from "vitest";
import { getEigenwoningforfait } from "@/tax/mortgage";
import { calculate } from "@/tax";
import { DEFAULT_INPUTS } from "@/tax/defaults";
import { EIGENWONINGFORFAIT } from "@/tax/params";
import { TaxInputSchema, PersistedInputsSchema } from "@/tax/schema";
import { parseStrictTaxInputs } from "@/tax/strict";
import { getCapabilities } from "@/tax/capabilities";
import { compareScenarios } from "@/tax/compare";

const base = {
  ...DEFAULT_INPUTS,
  mortgageEnabled: true,
  mortgageInterest: 6000,
  mortgageOwnershipShare: 100,
  incomeOutsideNL: 0,
  daysWorkedBE: 0,
};
describe("eigenwoningforfait", () => {
  it.each([
    [2020, [0, 50, 175, 337.5, 1800], 6540],
    [2021, [0, 50, 150, 300, 1500], 5550],
    [2022, [0, 37.5, 125, 262.5, 1350], 5085],
    [2023, [0, 25, 100, 187.5, 1050], 4200],
    [2024, [0, 25, 100, 187.5, 1050], 4585],
    [2025, [0, 25, 100, 187.5, 1050], 4655],
  ] as const)("verifies every band in %s", (year, amounts, highBase) => {
    const values = [12500, 25000, 50000, 75000, 300000];
    values.forEach((mortgageHomeValue, i) =>
      expect(getEigenwoningforfait({ ...base, year, mortgageHomeValue })).toBeCloseTo(amounts[i]!),
    );
    const threshold = EIGENWONINGFORFAIT[year].threshold;
    expect(getEigenwoningforfait({ ...base, year, mortgageHomeValue: threshold })).toBeCloseTo(
      highBase,
    );
    expect(
      getEigenwoningforfait({ ...base, year, mortgageHomeValue: threshold + 100000 }),
    ).toBeCloseTo(highBase + 2350);
    expect(getEigenwoningforfait({ ...base, year, mortgageHomeValue: 12501 })).toBeGreaterThan(0);
  });
  it("allocates after calculating the whole-home table", () => {
    const result = calculate({
      ...base,
      year: 2025,
      mortgageHomeValue: 1400000,
      mortgageOwnershipShare: 50,
    }).mortgage!;
    expect(result.eigenwoningforfait).toBe(3150);
    expect(result.deductibleInterest).toBe(3000);
    expect(result.netDeduction).toBe(0);
    expect(result.reasons).toContain("forfait_exceeds_interest");
    expect(result.applied).toBe(false);
    expect(result.realised.netBenefit).toBe(0);
  });
  it("caps gross costs while premiums follow the net home balance", () => {
    const high = calculate({ ...base, year: 2025, grossSalary: 120000, mortgageHomeValue: 300000 });
    const without = calculate({ ...base, year: 2025, grossSalary: 120000, mortgageEnabled: false });
    expect(high.nl.mortgageDeduction).toBe(4950);
    expect(high.nl.mortgageRateCapSurcharge).toBe(Math.round(6000 * (0.495 - 0.3748)));
    expect(without.nl.netTaxNL - high.nl.netTaxNL).toBeCloseTo(
      4950 * 0.495 - high.nl.mortgageRateCapSurcharge,
      0,
    );
    const low = calculate({ ...base, year: 2025, grossSalary: 30000, mortgageHomeValue: 300000 });
    expect(low.nl.volksverzekeringen).toBe(Math.floor((30000 - 4950) * 0.2765));
  });

  it("distinguishes missing and explicit zero values", () => {
    const missing = calculate(base).mortgage!;
    expect(missing.benefitIsUpperBound).toBe(true);
    expect(missing.assumptions).toContain("home_value_missing");
    const entered = calculate({ ...base, mortgageHomeValue: 0 }).mortgage!;
    expect(entered.benefitIsUpperBound).toBe(false);
    expect(entered.assumptions).not.toContain("home_value_missing");
    expect(entered.netDeduction).toBe(missing.netDeduction);
  });
  it("validates, describes, compares and never persists the home value", () => {
    const input = { ...base, mortgageHomeValue: 300000 };
    expect(TaxInputSchema.parse(input)).toEqual(parseStrictTaxInputs(input));
    expect(() => parseStrictTaxInputs({ ...input, mortgageEnabled: false })).toThrow(
      "mortgageHomeValue",
    );
    expect(() => parseStrictTaxInputs({ ...input, mortgageHomeValue: -1 })).toThrow(
      "mortgageHomeValue",
    );
    expect(TaxInputSchema.parse({ ...input, mortgageHomeValue: -1 }).mortgageHomeValue).toBe(0);
    expect(PersistedInputsSchema.parse(input)).not.toHaveProperty("mortgageHomeValue");
    expect(getCapabilities().mortgage.inputs.mortgageHomeValue.unit).toContain("whole-home");
    expect(compareScenarios(base, input).changed).toEqual(["mortgage"]);
  });
});
