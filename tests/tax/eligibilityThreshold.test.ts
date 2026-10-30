import { describe, expect, it } from "vitest";
import { eligibilityThreshold } from "@/tax/eligibilityThreshold";
import { calculate } from "@/tax";
import { DEFAULT_INPUTS } from "@/tax/defaults";

describe("eligibilityThreshold", () => {
  it("allows ten percent only when other income is zero", () => {
    expect(eligibilityThreshold(60000, 0)).toBeCloseTo(0.1);
    expect(eligibilityThreshold(60000, 3000)).toBeCloseTo(0.055);
  });
  it("clamps impossible limits and handles non-positive salary", () => {
    expect(eligibilityThreshold(60000, 10000)).toBe(0);
    expect(eligibilityThreshold(0, 0)).toBe(0);
    expect(eligibilityThreshold(-1, 100)).toBe(0);
    expect(eligibilityThreshold(100, -200)).toBe(1);
  });
  it.each([0, 3000])("agrees with calculate at exact 90%% with other income %s", (other) => {
    const ratio = eligibilityThreshold(60000, other);
    const inputs = {
      ...DEFAULT_INPUTS,
      grossSalary: 60000,
      daysWorkedNL: 1000 * (1 - ratio),
      daysWorkedBE: 1000 * ratio,
      daysWorkedOther: 0,
      sickDays: 0,
      thirtyPercentRuling: false,
      mortgageEnabled: true,
      mortgageInterest: 6000,
      incomeOutsideNL: other,
    };
    expect(calculate(inputs).mortgage?.nlTaxedPercent).toBe(90);
    expect(calculate(inputs).mortgage?.status).toBe("eligible");
    expect(
      calculate({
        ...inputs,
        daysWorkedNL: inputs.daysWorkedNL - 1,
        daysWorkedBE: inputs.daysWorkedBE + 1,
      }).mortgage?.status,
    ).toBe("ineligible");
  });
});
