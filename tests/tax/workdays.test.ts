import { describe, expect, it } from "vitest";

import {
  getMaxDaysInYear,
  getNLFractions,
  getTotalWorkdays,
  getWorkdayTotals,
} from "@/tax/workdays";
import type { TaxInputs } from "@/tax/types";

const base: TaxInputs = {
  year: 2025,
  residentCountry: "BE",
  civilStatus: "single",
  dependentChildren: 0,
  belowAOWAge: true,
  belgianRegion: "flemish",
  communalTaxRate: 7,
  annualStatements: [{ taxableWage: 60000, wageTaxWithheld: 0 }],
  daysWorkedNL: 220,
  daysWorkedBE: 10,
  daysWorkedOther: 5,
  thirtyPercentRuling: false,
  healthInsurancePremium: 0,
  supplementaryPension: 0,
  serviceVouchers: 0,
  reclaimableWithholdingTax: 0,
  sickDaysNL: 0,
  sickDaysOutsideNL: 0,
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
    expect(getTotalWorkdays({ ...base, sickDaysNL: 7 })).toBe(235);
  });
});

describe("getWorkdayTotals", () => {
  it("returns denominators with and without sick days", () => {
    expect(
      getWorkdayTotals({
        ...base,
        daysWorkedNL: 200,
        daysWorkedBE: 20,
        daysWorkedOther: 10,
        sickDaysNL: 5,
        sickDaysOutsideNL: 0,
      }),
    ).toMatchObject({
      daysNL: 200,
      daysBE: 20,
      daysOther: 10,
      sickDaysNL: 5,
      sickDaysOutsideNL: 0,
      daysOutsideNL: 30,
      totalNoSick: 230,
      totalWithSick: 235,
    });
  });
});

describe("getNLFractions", () => {
  it("returns zero fractions when there are no workdays", () => {
    const fractions = getNLFractions({
      ...base,
      daysWorkedNL: 0,
      daysWorkedBE: 0,
      daysWorkedOther: 0,
      sickDaysNL: 0,
      sickDaysOutsideNL: 0,
    });

    expect(fractions.nlFractionDutchMethod).toBe(0);
    expect(fractions.nlFractionBelgianMethod).toBe(0);
    expect(fractions.beFraction).toBe(0);
    expect(fractions.nlFractionBelgianMethod).toBe(0);
  });

  it("includes sick days only in the Dutch-method NL fraction", () => {
    const fractions = getNLFractions({
      ...base,
      daysWorkedNL: 200,
      daysWorkedBE: 20,
      daysWorkedOther: 10,
      sickDaysNL: 5,
      sickDaysOutsideNL: 0,
    });

    expect(fractions.nlFractionDutchMethod).toBeCloseTo(205 / 235, 10);
    expect(fractions.nlFractionBelgianMethod).toBeCloseTo(200 / 230, 10);
    expect(fractions.nlFractionBelgianMethod).toBeCloseTo(200 / 230, 10);
  });

  it("counts other-country days outside NL for Belgian sourcing", () => {
    const fractions = getNLFractions({
      ...base,
      daysWorkedNL: 200,
      daysWorkedBE: 20,
      daysWorkedOther: 30,
    });

    expect(fractions.beFraction).toBeCloseTo(50 / 250, 10);
    expect(fractions.nlFractionBelgianMethod).toBeCloseTo(200 / 250, 10);
  });
});

describe("sick days by scheduled country", () => {
  it("counts NL-scheduled sick days as NL days and the others as days outside NL (Dutch method)", () => {
    const f = getNLFractions({
      ...base,
      daysWorkedNL: 180,
      daysWorkedBE: 20,
      daysWorkedOther: 0,
      sickDaysNL: 20,
      sickDaysOutsideNL: 10,
    });
    expect(f.sickDays).toBe(30);
    expect(f.totalWithSick).toBe(230);
    expect(f.nlFractionDutchMethod).toBeCloseTo(200 / 230, 12);
  });

  it("leaves every sick day out of the Belgian method, wherever it was scheduled", () => {
    const nl = getNLFractions({ ...base, sickDaysNL: 30, sickDaysOutsideNL: 0 });
    const outside = getNLFractions({ ...base, sickDaysNL: 0, sickDaysOutsideNL: 30 });
    const none = getNLFractions(base);
    expect(nl.nlFractionBelgianMethod).toBe(none.nlFractionBelgianMethod);
    expect(outside.nlFractionBelgianMethod).toBe(none.nlFractionBelgianMethod);
    expect(nl.beFraction).toBe(none.beFraction);
    expect(outside.beFraction).toBe(none.beFraction);
  });

  it("gives the version 1 fraction when every sick day is scheduled in NL", () => {
    const f = getNLFractions({ ...base, sickDaysNL: 12, sickDaysOutsideNL: 0 });
    expect(f.nlFractionDutchMethod).toBe((220 + 12) / (235 + 12));
  });

  it("counts only sick days scheduled outside NL as workdays when nothing else is entered", () => {
    const f = getNLFractions({
      ...base,
      daysWorkedNL: 0,
      daysWorkedBE: 0,
      daysWorkedOther: 0,
      sickDaysOutsideNL: 5,
    });
    expect(f.noWorkdays).toBe(false);
    expect(f.nlFractionDutchMethod).toBe(0);
  });
});
