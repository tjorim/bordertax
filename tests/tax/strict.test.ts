import { describe, expect, it } from "vitest";
import { DEFAULT_INPUTS } from "@/tax/defaults";
import { VALID_YEARS } from "@/tax/constants";
import { TaxInputFields, TaxInputSchema } from "@/tax/schema";
import { getMaxDependentChildren, parseStrictTaxInputs, StrictTaxInputSchema } from "@/tax/strict";

const mortgageFields = [
  "mortgageEnabled",
  "mortgageInterest",
  "mortgageOwnershipShare",
  "incomeOutsideNL",
];

describe("strict tax input boundary", () => {
  it.each(VALID_YEARS)("agrees with the form on valid inputs in %i", (year) => {
    for (const dependentChildren of [0, getMaxDependentChildren(year)]) {
      for (const mortgageEnabled of [false, true]) {
        const input = {
          ...DEFAULT_INPUTS,
          year,
          dependentChildren,
          daysWorkedNL: 200.5,
          mortgageEnabled,
          ...(mortgageEnabled
            ? { mortgageInterest: 5000, mortgageOwnershipShare: 50, incomeOutsideNL: 0 }
            : {}),
        };
        expect(parseStrictTaxInputs(input)).toEqual(TaxInputSchema.parse(input));
      }
    }
  });

  it("requires every core field and preserves the shared field inventory", () => {
    expect(Object.keys(StrictTaxInputSchema.in.shape).sort()).toEqual(
      Object.keys(TaxInputFields).sort(),
    );
    for (const field of Object.keys(TaxInputFields).filter(
      (key) => !mortgageFields.includes(key),
    )) {
      const input = { ...DEFAULT_INPUTS } as Record<string, unknown>;
      delete input[field];
      expect(() => parseStrictTaxInputs(input)).toThrow(field);
    }
  });

  it("rejects invalid types, non-finite numbers, and negative numeric fields", () => {
    for (const [field, value] of Object.entries(DEFAULT_INPUTS)) {
      expect(() => parseStrictTaxInputs({ ...DEFAULT_INPUTS, [field]: null })).toThrow(field);
      if (typeof value === "number" && field !== "year") {
        for (const invalid of [NaN, Infinity, -Infinity, -1, "1"]) {
          expect(() => parseStrictTaxInputs({ ...DEFAULT_INPUTS, [field]: invalid })).toThrow(
            field,
          );
        }
      }
    }
    for (const field of mortgageFields.slice(1)) {
      for (const invalid of [NaN, Infinity, -Infinity, -1, "1", null]) {
        expect(() =>
          parseStrictTaxInputs({ ...DEFAULT_INPUTS, mortgageEnabled: true, [field]: invalid }),
        ).toThrow(field);
      }
    }
  });

  it.each([
    ["year", 2026],
    ["residentCountry", "NL"],
    ["civilStatus", "married"],
    ["belgianRegion", "walloon"],
    ["dependentChildren", 1.5],
    ["dependentChildren", 11],
    ["communalTaxRate", 15.01],
    ["thirtyPercentRuling", true],
    ["extraField", true],
  ])("rejects unsupported %s=%s", (field, value) => {
    expect(() => parseStrictTaxInputs({ ...DEFAULT_INPUTS, [field]: value })).toThrow(field);
  });

  it.each(VALID_YEARS)("checks the child limit in %i", (year) => {
    const max = getMaxDependentChildren(year);
    expect(
      StrictTaxInputSchema.safeParse({ ...DEFAULT_INPUTS, year, dependentChildren: max }).success,
    ).toBe(true);
    expect(() =>
      parseStrictTaxInputs({ ...DEFAULT_INPUTS, year, dependentChildren: max + 1 }),
    ).toThrow("dependentChildren");
  });

  it.each([
    [2024, 366],
    [2025, 365],
  ])("includes sick days in the %i day limit", (year, max) => {
    const input = {
      ...DEFAULT_INPUTS,
      year,
      daysWorkedNL: max - 3,
      daysWorkedBE: 1,
      daysWorkedOther: 1,
      sickDays: 1,
    };
    expect(parseStrictTaxInputs(input)).toEqual(input);
    for (const field of ["daysWorkedNL", "daysWorkedBE", "daysWorkedOther", "sickDays"] as const) {
      expect(() => parseStrictTaxInputs({ ...input, [field]: input[field] + 0.5 })).toThrow(field);
    }
    expect(() => parseStrictTaxInputs({ ...input, sickDays: 0, daysWorkedNL: max })).toThrow(
      "daysWorkedNL",
    );
  });

  it("makes mortgage defaults explicit without treating missing outside income as zero", () => {
    const { mortgageEnabled: _enabled, ...core } = DEFAULT_INPUTS;
    expect(parseStrictTaxInputs(core)).toEqual(DEFAULT_INPUTS);
    expect(parseStrictTaxInputs({ ...core, mortgageEnabled: true })).toEqual({
      ...core,
      mortgageEnabled: true,
      mortgageInterest: 0,
      mortgageOwnershipShare: 100,
    });
    for (const field of mortgageFields.slice(1)) {
      expect(() => parseStrictTaxInputs({ ...core, [field]: 0 })).toThrow(field);
      expect(() => parseStrictTaxInputs({ ...core, mortgageEnabled: false, [field]: 0 })).toThrow(
        field,
      );
    }
    expect(() =>
      parseStrictTaxInputs({ ...core, mortgageEnabled: true, mortgageOwnershipShare: 100.01 }),
    ).toThrow("mortgageOwnershipShare");
    for (const mortgageOwnershipShare of [0, 100]) {
      expect(
        parseStrictTaxInputs({ ...core, mortgageEnabled: true, mortgageOwnershipShare })
          .mortgageOwnershipShare,
      ).toBe(mortgageOwnershipShare);
    }
  });

  it("accepts communal tax endpoints", () => {
    for (const communalTaxRate of [0, 15]) {
      expect(parseStrictTaxInputs({ ...DEFAULT_INPUTS, communalTaxRate }).communalTaxRate).toBe(
        communalTaxRate,
      );
    }
  });
});
