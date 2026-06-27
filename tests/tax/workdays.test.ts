import { describe, expect, it } from "vitest";

import { getMaxDaysInYear, getNLFractions, getTotalWorkdays, getWorkdayTotals } from "@/tax/workdays";
import type { TaxInputs } from "@/tax/types";

const base: TaxInputs = {
  year: 2025,
  residentCountry: "BE",
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
  socialContributions: 0,
  aanvullendPensioen: 0,
  dienstencheques: 0,
  roerendeVoorheffing: 0,
  withheldTaxNL: 0,
  sickDays: 0,
};

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
        ...base,
      }),
    ).toBe(235);
  });

  it("excludes sick days", () => {
    expect(getTotalWorkdays({ ...base, sickDays: 7 })).toBe(235);
  });
});

describe("getWorkdayTotals", () => {
  it("returns denominators with and without sick days", () => {
    expect(getWorkdayTotals({ ...base, daysWorkedNL: 200, daysWorkedBE: 20, daysWorkedOther: 10, sickDays: 5 })).toMatchObject({
      daysNL: 200,
      daysBE: 20,
      daysOther: 10,
      sickDays: 5,
      daysOutsideNL: 30,
      totalNoSick: 230,
      totalWithSick: 235,
    });
  });
});

describe("getNLFractions", () => {
  it("returns zero fractions when there are no workdays", () => {
    const fractions = getNLFractions({ ...base, daysWorkedNL: 0, daysWorkedBE: 0, daysWorkedOther: 0, sickDays: 0 });

    expect(fractions.nlFractionDutchMethod).toBe(0);
    expect(fractions.nlFractionBelgianMethod).toBe(0);
    expect(fractions.beFraction).toBe(0);
    expect(fractions.vrijgesteldFrac).toBe(0);
  });

  it("includes sick days only in the Dutch-method NL fraction", () => {
    const fractions = getNLFractions({ ...base, daysWorkedNL: 200, daysWorkedBE: 20, daysWorkedOther: 10, sickDays: 5 });

    expect(fractions.nlFractionDutchMethod).toBeCloseTo(205 / 235, 10);
    expect(fractions.nlFractionBelgianMethod).toBeCloseTo(200 / 230, 10);
    expect(fractions.vrijgesteldFrac).toBeCloseTo(200 / 230, 10);
  });

  it("counts other-country days outside NL for Belgian sourcing", () => {
    const fractions = getNLFractions({ ...base, daysWorkedNL: 200, daysWorkedBE: 20, daysWorkedOther: 30 });

    expect(fractions.beFraction).toBeCloseTo(50 / 250, 10);
    expect(fractions.vrijgesteldFrac).toBeCloseTo(200 / 250, 10);
  });
});
