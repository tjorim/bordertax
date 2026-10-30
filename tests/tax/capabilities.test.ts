import { describe, expect, it } from "vitest";
import { getCapabilities } from "@/tax/capabilities";
import {
  MORTGAGE_QUALIFYING_MIN_NL_PERCENT,
  VALID_BELGIAN_REGIONS,
  VALID_CIVIL_STATUSES,
  VALID_RESIDENT_COUNTRIES,
  VALID_YEARS,
} from "@/tax/constants";
import { TAX_PARAMS } from "@/tax/params";
import { DEFAULT_INPUTS } from "@/tax/defaults";
import { parseStrictTaxInputs } from "@/tax/strict";

describe("tax capabilities", () => {
  it("keeps enabled years aligned with engine parameters", () => {
    expect(Object.keys(TAX_PARAMS).map(Number)).toEqual([...VALID_YEARS]);
  });

  it("reflects supported constants and serialises without loss", () => {
    const capabilities = getCapabilities();
    expect(capabilities.supportedYears).toEqual([...VALID_YEARS]);
    expect(capabilities.residentCountries).toEqual([...VALID_RESIDENT_COUNTRIES]);
    expect(capabilities.civilStatuses).toEqual([...VALID_CIVIL_STATUSES]);
    expect(capabilities.belgianRegions).toEqual([...VALID_BELGIAN_REGIONS]);
    expect(capabilities.mortgage.qualifyingMinNLPercent).toBe(MORTGAGE_QUALIFYING_MIN_NL_PERCENT);
    expect(JSON.parse(JSON.stringify(capabilities))).toEqual(capabilities);
  });

  it("derives per-year limits from parameters and the calendar", () => {
    for (const { year, maxDependentChildren, maxWorkdaysIncludingSickDays } of getCapabilities()
      .perYear) {
      expect(maxDependentChildren).toBe(TAX_PARAMS[year].be.extraPerChildAbove4 === null ? 4 : 10);
      expect(maxWorkdaysIncludingSickDays).toBe(year === 2020 || year === 2024 ? 366 : 365);
    }
  });

  it("documents required fields, defaults, units and mortgage status meanings", () => {
    const capabilities = getCapabilities();
    for (const field of capabilities.requiredInputs) {
      const input = { ...DEFAULT_INPUTS } as Record<string, unknown>;
      delete input[field];
      expect(() => parseStrictTaxInputs(input)).toThrow(field);
    }
    expect(capabilities.requiredInputs).toHaveLength(18);
    expect(capabilities.units.money).toBe("EUR per year");
    expect(capabilities.units.communalTaxRate).toEqual({ unit: "percent", min: 0, max: 15 });
    expect(capabilities.units.resultRatesAndShares).toContain("fractions");
    expect(capabilities.units.workdays).toContain("day counts");
    expect(capabilities.mortgage.inputs.mortgageEnabled.default).toBe(false);
    expect(Object.keys(capabilities.mortgage.result.statuses)).toEqual([
      "eligible",
      "ineligible",
      "unknown",
    ]);
    expect(capabilities.mortgage.result.disabled).toBeNull();
    expect(capabilities.limitations).toEqual(
      expect.arrayContaining([
        "Single person only",
        "Flemish region only",
        "NL-resident unsupported",
        "Simplified estimate, not tax advice",
      ]),
    );
  });
});
