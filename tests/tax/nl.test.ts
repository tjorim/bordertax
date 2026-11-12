import { describe, expect, it } from "vitest";

import { calculateNLTax } from "@/tax/nl";
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
  daysWorkedBE: 0,
  daysWorkedOther: 0,
  thirtyPercentRuling: false,
  socialContributions: 0,
  aanvullendPensioen: 0,
  dienstencheques: 0,
  roerendeVoorheffing: 0,
  withheldTaxNL: 0,
  sickDays: 0,
};

describe("calculateNLTax", () => {
  it("returns zero tax for zero gross salary", () => {
    const result = calculateNLTax({ ...base, grossSalary: 0 });
    expect(result.netTaxNL).toBe(0);
    expect(result.nlTaxableIncome).toBe(0);
    expect(result.effectiveRateNL).toBe(0);
  });

  it("returns zero taxable income when no NL workdays", () => {
    // nlTaxableIncome is 0 (no NL income fraction), but volksverzekeringen still applies
    // because social insurance covers the full employment relationship.
    const result = calculateNLTax({ ...base, daysWorkedNL: 0, daysWorkedBE: 220 });
    expect(result.nlTaxableIncome).toBe(0);
    expect(result.taxBeforeCredits).toBe(0);
    // netTaxNL may be > 0 due to volksverzekeringen net of AK credit
  });

  it("returns zero taxable income when total days are zero", () => {
    const result = calculateNLTax({ ...base, daysWorkedNL: 0, daysWorkedBE: 0 });
    expect(result.nlTaxableIncome).toBe(0);
    expect(result.taxBeforeCredits).toBe(0);
  });

  it("computes NL fraction correctly when working split days", () => {
    const result = calculateNLTax({ ...base, daysWorkedNL: 110, daysWorkedBE: 110 });
    expect(result.nlTaxableIncome).toBeCloseTo(30000, 0);
    expect(result.deelNietInNLBelast).toBeCloseTo(30000, 0);
    expect(result.nlTaxableIncome + result.deelNietInNLBelast).toBe(base.grossSalary);
  });

  it("keeps the non-NL-taxed portion separate from the 30% ruling exemption", () => {
    const withRuling = calculateNLTax({
      ...base,
      daysWorkedNL: 110,
      daysWorkedBE: 110,
      thirtyPercentRuling: true,
    });
    expect(withRuling.deelNietInNLBelast).toBe(30000);
  });

  it("applies 30% ruling by taxing only 70% of the NL income", () => {
    const nlResident = {
      ...base,
      residentCountry: "NL" as unknown as TaxInputs["residentCountry"],
    };
    const withRuling = calculateNLTax({ ...nlResident, thirtyPercentRuling: true });
    const withoutRuling = calculateNLTax({ ...nlResident, thirtyPercentRuling: false });
    expect(withRuling.nlTaxableIncome).toBeCloseTo(withoutRuling.nlTaxableIncome * 0.7, 1);
    expect(withRuling.netTaxNL).toBeLessThan(withoutRuling.netTaxNL);
  });

  it("does not apply a stored 30% ruling selection for a Belgian resident", () => {
    const withStoredSelection = calculateNLTax({ ...base, thirtyPercentRuling: true });
    const withoutRuling = calculateNLTax({ ...base, thirtyPercentRuling: false });
    expect(withStoredSelection.nlTaxableIncome).toBe(withoutRuling.nlTaxableIncome);
    expect(withStoredSelection.netTaxNL).toBe(withoutRuling.netTaxNL);
  });

  it("uses lower netTaxNL for above-AOW-age taxpayers (lower social premium rate)", () => {
    // Income-tax brackets are the same for both age groups; only volksverzekeringen differs
    const under = calculateNLTax({ ...base, belowAOWAge: true });
    const over = calculateNLTax({ ...base, belowAOWAge: false });
    expect(over.netTaxNL).toBeLessThan(under.netTaxNL);
  });

  it("does not return negative netTaxNL", () => {
    // Very low salary where credits exceed tax
    const result = calculateNLTax({ ...base, grossSalary: 5000 });
    expect(result.netTaxNL).toBeGreaterThanOrEqual(0);
  });

  it("totalCredits does not exceed taxBeforeCredits + volksverzekeringen", () => {
    const result = calculateNLTax({ ...base, grossSalary: 5000 });
    expect(result.totalCredits).toBeLessThanOrEqual(
      result.taxBeforeCredits + result.volksverzekeringen,
    );
  });

  it("brackets array is non-empty for positive income", () => {
    const result = calculateNLTax({ ...base });
    expect(result.brackets.length).toBeGreaterThan(0);
  });

  it("brackets sum matches taxBeforeCredits", () => {
    const result = calculateNLTax({ ...base, grossSalary: 100000 });
    const sum = result.brackets.reduce((acc, b) => acc + b.tax, 0);
    expect(sum).toBeCloseTo(result.taxBeforeCredits, 1);
  });

  it("effectiveRateNL is between 0 and 1 for normal salary", () => {
    const result = calculateNLTax({ ...base });
    expect(result.effectiveRateNL).toBeGreaterThan(0);
    expect(result.effectiveRateNL).toBeLessThan(1);
  });

  it("higher salary results in higher effective rate", () => {
    const low = calculateNLTax({ ...base, grossSalary: 30000 });
    const high = calculateNLTax({ ...base, grossSalary: 120000 });
    expect(high.effectiveRateNL).toBeGreaterThan(low.effectiveRateNL);
  });

  it("works for tax year 2024", () => {
    const result = calculateNLTax({ ...base, year: 2024 });
    expect(result.netTaxNL).toBeGreaterThan(0);
    expect(result.brackets.length).toBeGreaterThan(0);
  });

  it("throws for an unsupported tax year instead of falling back to another year", () => {
    expect(() => calculateNLTax({ ...base, year: 2030 as TaxInputs["year"] })).toThrow(
      /Unsupported tax year: 2030/,
    );
  });

  // TODO: Re-enable when 2026 support is re-integrated
  it.skip("works for tax year 2026", () => {
    const result = calculateNLTax({ ...base, year: 2026 as unknown as TaxInputs["year"] });
    expect(result.netTaxNL).toBeGreaterThan(0);
    expect(result.brackets.length).toBeGreaterThan(0);
  });

  it("reaches top bracket for very high salary", () => {
    const result = calculateNLTax({ ...base, grossSalary: 200000 });
    const topBracket = result.brackets.find((b) => b.rate === 0.495);
    expect(topBracket).toBeDefined();
    expect(topBracket!.tax).toBeGreaterThan(0);
  });

  it("applies the algemene heffingskorting to Belgian residents", () => {
    // 2025 under AOW age, full wage €60,000: 3,068 − 6.337% × (60,000 − 28,406), rounded up.
    const result = calculateNLTax({ ...base, residentCountry: "BE" });
    expect(result.algemeneHeffingskorting).toBe(1066);
  });

  it("AHK is zero for very high income (above phase-out end)", () => {
    expect(calculateNLTax({ ...base, grossSalary: 200000 }).algemeneHeffingskorting).toBe(0);
  });

  it("AHK is at maximum for very low income (below phase-out start)", () => {
    expect(calculateNLTax({ ...base, grossSalary: 20000 }).algemeneHeffingskorting).toBe(3068);
  });

  it("above-AOW age uses lower AHK max", () => {
    const under = calculateNLTax({ ...base, grossSalary: 10000, belowAOWAge: true });
    const over = calculateNLTax({ ...base, grossSalary: 10000, belowAOWAge: false });
    expect(over.algemeneHeffingskorting).toBe(1536);
    expect(over.algemeneHeffingskorting).toBeLessThan(under.algemeneHeffingskorting);
  });

  it("splits the credits by the first-bracket rates into income tax due and premiums due", () => {
    const result = calculateNLTax({
      ...base,
      grossSalary: 53299,
      daysWorkedNL: 180,
      daysWorkedBE: 50,
    });
    const share = 0.0817 / (0.0817 + 0.2765);
    expect(result.incomeTaxDue + result.premiumsDue).toBeCloseTo(result.netTaxNL, 6);
    expect(result.incomeTaxDue).toBeCloseTo(
      result.taxBeforeCredits - result.totalCredits * share,
      6,
    );
    expect(result.premiumsDue).toBeCloseTo(
      result.volksverzekeringen - result.totalCredits * (1 - share),
      6,
    );
  });

  it("keeps income tax and premiums adding up to the net tax when a credit part overflows", () => {
    // Tiny Dutch share: income tax is smaller than the tax part of the credits.
    const result = calculateNLTax({
      ...base,
      grossSalary: 40000,
      daysWorkedNL: 5,
      daysWorkedBE: 215,
    });
    expect(result.incomeTaxDue).toBeGreaterThanOrEqual(0);
    expect(result.premiumsDue).toBeGreaterThanOrEqual(0);
    expect(result.incomeTaxDue + result.premiumsDue).toBeCloseTo(result.netTaxNL, 6);
  });

  it("returns correct structure", () => {
    const result = calculateNLTax({ ...base });
    expect(result).toHaveProperty("nlTaxableIncome");
    expect(result).toHaveProperty("deelNietInNLBelast");
    expect(result).toHaveProperty("taxBeforeCredits");
    expect(result).toHaveProperty("brackets");
    expect(result).toHaveProperty("algemeneHeffingskorting");
    expect(result).toHaveProperty("arbeidskorting");
    expect(result).toHaveProperty("totalCredits");
    expect(result).toHaveProperty("volksverzekeringen");
    expect(result).toHaveProperty("incomeTaxDue");
    expect(result).toHaveProperty("premiumsDue");
    expect(result).toHaveProperty("netTaxNL");
    expect(result).toHaveProperty("effectiveRateNL");
  });
});
