import { describe, expect, it } from "vitest";

import { getMaxDaysInYear, getTotalWorkdays } from "@/tax/workdays";
import { DEFAULT_INPUTS } from "@/app/inputState";

describe("getMaxDaysInYear", () => {
  it("returns 366 for leap years", () => {
    expect(getMaxDaysInYear(2024)).toBe(366);
    expect(getMaxDaysInYear(2000)).toBe(366);
  });

  it("returns 365 for non-leap years", () => {
    expect(getMaxDaysInYear(2025)).toBe(365);
    expect(getMaxDaysInYear(1900)).toBe(365);
  });
});

describe("getTotalWorkdays", () => {
  it("includes NL, BE and optional other days", () => {
    expect(
      getTotalWorkdays({
        ...DEFAULT_INPUTS,
        daysWorkedNL: 220,
        daysWorkedBE: 10,
        daysWorkedOther: 5,
      }),
    ).toBe(235);
  });
});
