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
    expect(capabilities.requiredInputs).toEqual([
      "year",
      "dependentChildren",
      "belowAOWAge",
      "communalTaxRate",
      "annualStatements",
      "daysWorkedNL",
      "daysWorkedBE",
      "daysWorkedOther",
      "sickDaysNL",
      "sickDaysOutsideNL",
      "healthInsurancePremium",
      "supplementaryPension",
      "serviceVouchers",
      "reclaimableWithholdingTax",
    ]);
    // The single-value fields default, so a caller only sends what varies.
    expect(capabilities.defaults).toEqual({
      residentCountry: "BE",
      civilStatus: "single",
      belgianRegion: "flemish",
      thirtyPercentRuling: false,
      mortgageEnabled: false,
    });
    for (const field of Object.keys(capabilities.defaults)) {
      expect(capabilities.requiredInputs).not.toContain(field);
    }
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
    const wageBase = capabilities.limitations.filter((item) =>
      /code 1250|codes 1254\/1255/.test(item),
    );
    expect(wageBase).toHaveLength(2);
    expect(wageBase.join(" ")).toMatch(/pension premium.*company car.*exchanged/);
  });

  it("reports the input schema version, the renames and the source documents", () => {
    const { inputSchema, sourceDocuments, belgianCodes, sickDays } = getCapabilities();
    expect(inputSchema.version).toBe(2);
    expect(inputSchema.inputFileSchemaVersion).toBe(2);
    expect(inputSchema.renamedFromVersion1.grossSalary).toBe("annualStatements[].taxableWage");
    expect(inputSchema.resultRenamedFromVersion1["result.grossIncome"]).toBe("result.taxableWage");
    expect(Object.keys(sourceDocuments)).toEqual([
      "profile",
      "annualTaxStatement",
      "workdayRecord",
      "healthInsurer",
      "pensionOrPayslip",
      "serviceVoucherStatement",
      "bank",
      "dutchAssessment",
      "home",
    ]);
    expect(sourceDocuments.healthInsurer).toEqual(["healthInsurancePremium"]);
    expect(belgianCodes).toEqual({
      healthInsurancePremium: "1257",
      supplementaryPension: "1285",
      serviceVouchers: "3364",
      reclaimableWithholdingTax: "1437",
    });
    expect(sickDays.belgianMethod).toContain("leaves all sick days out");
  });

  it("describes the result conventions: cents, bracket bounds, no workdays, unused reductions", () => {
    const { resultShape } = getCapabilities();
    expect(resultShape.belgianRounding).toContain("whole cents");
    expect(resultShape.belgianRounding).toContain("no Belgian tax-rounding rule");
    expect(resultShape.brackets).toContain("null for the open-ended top bracket");
    expect(resultShape.noWorkdays).toContain("result.noWorkdays");
    expect(resultShape.federalReductionsUnused).toContain("code 1437");
  });

  it("describes the optional Dutch assessment figures without requiring them", () => {
    const capabilities = getCapabilities();
    expect(capabilities.requiredInputs).not.toContain("assessmentIncomeTaxDue");
    expect(capabilities.requiredInputs).not.toContain("assessmentPremiumsDue");
    expect(Object.keys(capabilities.dutchAssessment.inputs)).toEqual([
      "assessmentIncomeTaxDue",
      "assessmentPremiumsDue",
    ]);
    expect(capabilities.dutchAssessment.mustBeGivenTogether).toBe(true);
  });
});
