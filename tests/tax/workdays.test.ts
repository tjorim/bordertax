import { describe, expect, it } from "vitest";

import { getMaxDaysInYear, getTotalWorkdays } from "@/tax/workdays";

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
        year: 2025,
        residentCountry: "NL",
        civilStatus: "single",
        dependentChildren: 0,
        belowAOWAge: true,
        belgianRegion: "flemish",
        communalTaxRate: 7,
        grossSalary: 60000,
        daysWorkedNL: 220,
        daysWorkedBE: 10,
        daysWorkedOther: 5,
        thirtyPercentRuling: false,
      }),
    ).toBe(235);
  });
});
