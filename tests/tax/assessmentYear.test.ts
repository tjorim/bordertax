import { describe, expect, it } from "vitest";
import * as m from "@/paraglide/messages.js";
import { setLocale } from "@/paraglide/runtime.js";
import { assessmentYear, yearParams } from "@/tax/assessmentYear";
import { SUPPORTED_YEARS } from "@/tax/years";

describe("assessmentYear", () => {
  it("is the income year plus one for every supported year", () => {
    for (const year of SUPPORTED_YEARS) expect(assessmentYear(year)).toBe(year + 1);
    expect(yearParams(2025)).toEqual({ year: 2025, assessmentYear: 2026 });
  });

  it.each([
    ["en", "Income year 2025 (aanslagjaar 2026)"],
    ["nl", "Inkomstenjaar 2025 (aanslagjaar 2026)"],
  ] as const)("names both years in %s", (locale, expected) => {
    setLocale(locale, { reload: false });
    try {
      expect(m.income_year_with_assessment(yearParams(2025))).toBe(expected);
      expect(m.filing_be_title(yearParams(2025))).toContain("aanslagjaar 2026");
      expect(m.be_title(yearParams(2025))).toContain("aanslagjaar 2026");
      expect(m.ref_meta_income_year(yearParams(2025))).toBe(expected);
    } finally {
      setLocale("en", { reload: false });
    }
  });
});
