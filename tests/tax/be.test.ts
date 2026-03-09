import { describe, expect, it } from "vitest";

import { calculateBETax } from "@/tax/be";
import { calculateNLTax } from "@/tax/nl";
import type { TaxInputs, NLTaxResult } from "@/tax/types";

const baseNL: TaxInputs = {
  year: 2025,
  residentCountry: "NL",
  civilStatus: "single",
  dependentChildren: 0,
  belowAOWAge: true,
  belgianRegion: "flemish",
  communalTaxRate: 7,
  grossSalary: 60000,
  daysWorkedNL: 220,
  daysWorkedBE: 0,
  thirtyPercentRuling: false,
  socialContributions: 0,
  aanvullendPensioen: 0,
  dienstencheques: 0,
  roerendeVoorheffing: 0,
};

const baseBE: TaxInputs = {
  ...baseNL,
  residentCountry: "BE",
};

function mockNL(overrides?: Partial<NLTaxResult>): NLTaxResult {
  const canonicalInputs: TaxInputs = {
    ...baseNL,
    grossSalary: 60000,
    daysWorkedNL: 220,
    daysWorkedBE: 0,
  };

  return {
    ...calculateNLTax(canonicalInputs),
    ...overrides,
  };
}

describe("calculateBETax", () => {
  it("returns null for NL resident", () => {
    expect(calculateBETax(baseNL, mockNL())).toBeNull();
  });

  it("returns an object for BE resident", () => {
    const result = calculateBETax({ ...baseBE, daysWorkedBE: 20 }, mockNL());
    expect(result).not.toBeNull();
  });

  it("returns non-zero tax for BE resident with some BE days", () => {
    const result = calculateBETax({ ...baseBE, daysWorkedNL: 200, daysWorkedBE: 20 }, mockNL());
    expect(result!.netTaxBE).toBeGreaterThan(0);
  });

  it("returns zero netTaxBE when beFraction is 0 (all NL days) but no communal rate", () => {
    // With 100% NL days and 0% communal rate, there is nothing to tax in BE
    const result = calculateBETax(
      { ...baseBE, daysWorkedNL: 220, daysWorkedBE: 0, communalTaxRate: 0 },
      mockNL({ nlTaxableIncome: 60000, netTaxNL: 16000 }),
    );
    expect(result!.beFraction).toBe(0);
    expect(result!.federalTax).toBe(0);
    expect(result!.netTaxBE).toBeCloseTo(0, 2);
  });

  it("netTaxBE > 0 when communalTaxRate > 0 even with 100% NL days (communal on vrijgesteld)", () => {
    // Belgian residents owe communal tax on the exempt NL income
    const result = calculateBETax(
      { ...baseBE, daysWorkedNL: 220, daysWorkedBE: 0, communalTaxRate: 7 },
      mockNL({ nlTaxableIncome: 60000, netTaxNL: 16000 }),
    );
    expect(result!.beFraction).toBe(0);
    expect(result!.communalTaxOnVrijgesteld).toBeGreaterThan(0);
    expect(result!.netTaxBE).toBeGreaterThan(0);
  });

  it("returns zero netTaxBE when both day counts are 0 and grossSalary is 0", () => {
    // With grossSalary=0, declared income=0, no tax of any kind
    const result = calculateBETax(
      { ...baseBE, grossSalary: 0, daysWorkedNL: 0, daysWorkedBE: 0, communalTaxRate: 0 },
      mockNL({ nlTaxableIncome: 0, netTaxNL: 0, volksverzekeringen: 0, effectiveRateNL: 0 }),
    );
    expect(result!.beFraction).toBe(0);
    expect(result!.netTaxBE).toBe(0);
  });

  it("beFraction equals 1 when all days are worked in BE", () => {
    const result = calculateBETax(
      { ...baseBE, daysWorkedNL: 0, daysWorkedBE: 220 },
      mockNL({ nlTaxableIncome: 0, netTaxNL: 0 }),
    );
    expect(result!.beFraction).toBe(1);
  });

  it("communal levy increases with higher communalTaxRate", () => {
    const low = calculateBETax(
      { ...baseBE, daysWorkedNL: 200, daysWorkedBE: 20, communalTaxRate: 5 },
      mockNL(),
    );
    const high = calculateBETax(
      { ...baseBE, daysWorkedNL: 200, daysWorkedBE: 20, communalTaxRate: 9 },
      mockNL(),
    );
    expect(high!.communalTax + high!.communalTaxOnVrijgesteld).toBeGreaterThan(
      low!.communalTax + low!.communalTaxOnVrijgesteld,
    );
  });

  it("communal tax components are non-negative and at least one is positive", () => {
    const result = calculateBETax(
      { ...baseBE, daysWorkedNL: 200, daysWorkedBE: 20, communalTaxRate: 7 },
      mockNL(),
    );
    expect(result!.communalTax).toBeGreaterThanOrEqual(0);
    expect(result!.communalTaxOnVrijgesteld).toBeGreaterThanOrEqual(0);
    expect(result!.communalTax + result!.communalTaxOnVrijgesteld).toBeGreaterThan(0);
  });

  it("netTaxBE equals federalTax + communalTax + communalTaxOnVrijgesteld", () => {
    const result = calculateBETax({ ...baseBE, daysWorkedNL: 200, daysWorkedBE: 20 }, mockNL());
    expect(result!.netTaxBE).toBeCloseTo(
      result!.federalTax + result!.communalTax + result!.communalTaxOnVrijgesteld,
      5,
    );
  });

  it("effectiveRateBE is between 0 and 1 for normal inputs", () => {
    const result = calculateBETax({ ...baseBE, daysWorkedNL: 200, daysWorkedBE: 20 }, mockNL());
    expect(result!.effectiveRateBE).toBeGreaterThan(0);
    expect(result!.effectiveRateBE).toBeLessThan(1);
  });

  it("effectiveRateBE is 0 when grossSalary is 0", () => {
    const result = calculateBETax(
      { ...baseBE, grossSalary: 0 },
      mockNL({ nlTaxableIncome: 0, netTaxNL: 0 }),
    );
    expect(result!.effectiveRateBE).toBe(0);
  });

  it("dependent children reduce the tax through higher personal exemption", () => {
    const noChildren = calculateBETax(
      { ...baseBE, daysWorkedNL: 200, daysWorkedBE: 20, dependentChildren: 0 },
      mockNL(),
    );
    const twoChildren = calculateBETax(
      { ...baseBE, daysWorkedNL: 200, daysWorkedBE: 20, dependentChildren: 2 },
      mockNL(),
    );
    expect(twoChildren!.belastingvrijeSomReduction).toBeGreaterThan(
      noChildren!.belastingvrijeSomReduction,
    );
    expect(twoChildren!.netTaxBE).toBeLessThan(noChildren!.netTaxBE);
  });

  it("handles 5+ dependent children via extraPerChildAbove4", () => {
    const four = calculateBETax(
      { ...baseBE, daysWorkedNL: 200, daysWorkedBE: 20, dependentChildren: 4 },
      mockNL(),
    );
    const five = calculateBETax(
      { ...baseBE, daysWorkedNL: 200, daysWorkedBE: 20, dependentChildren: 5 },
      mockNL(),
    );
    expect(five!.belastingvrijeSomReduction).toBeGreaterThan(four!.belastingvrijeSomReduction);
  });

  it("professional expenses are capped at forfaitMax", () => {
    // Very high income: declared income is high, forfait should hit cap
    // Use netTaxNL=0 so declaredIncome = grossSalary
    const result = calculateBETax(
      { ...baseBE, grossSalary: 200000, daysWorkedNL: 0, daysWorkedBE: 220 },
      mockNL({ nlTaxableIncome: 200000, netTaxNL: 0 }),
    );
    expect(result!.professionalExpenses).toBe(5930); // 2025 forfaitMax
  });

  it("professional expenses for low income are a fraction of forfaitBase", () => {
    // Low income, no NL tax: forfait = 30% of (declaredIncome - socialContributions)
    const result = calculateBETax(
      { ...baseBE, grossSalary: 10000, daysWorkedNL: 0, daysWorkedBE: 220 },
      mockNL({ nlTaxableIncome: 0, netTaxNL: 0 }),
    );
    expect(result!.professionalExpenses).toBeCloseTo(10000 * 0.3, 1);
  });

  it("nlExemptIncome + beIncome equals grossSalary", () => {
    const result = calculateBETax({ ...baseBE, daysWorkedNL: 200, daysWorkedBE: 20 }, mockNL());
    expect(result!.nlExemptIncome + result!.beIncome).toBeCloseTo(baseBE.grossSalary, 5);
  });

  it("works for tax year 2024", () => {
    const result = calculateBETax(
      { ...baseBE, year: 2024, daysWorkedNL: 200, daysWorkedBE: 20 },
      mockNL(),
    );
    expect(result).not.toBeNull();
    expect(result!.netTaxBE).toBeGreaterThan(0);
  });

  it("works for tax year 2026", () => {
    const result = calculateBETax(
      { ...baseBE, year: 2026, daysWorkedNL: 200, daysWorkedBE: 20 },
      mockNL(),
    );
    expect(result).not.toBeNull();
    expect(result!.netTaxBE).toBeGreaterThan(0);
  });

  it("returns correct result structure", () => {
    const result = calculateBETax({ ...baseBE, daysWorkedNL: 200, daysWorkedBE: 20 }, mockNL());
    expect(result).toHaveProperty("beIncome");
    expect(result).toHaveProperty("nlExemptIncome");
    expect(result).toHaveProperty("professionalExpenses");
    expect(result).toHaveProperty("netProfessionalIncome");
    expect(result).toHaveProperty("basisbelasting");
    expect(result).toHaveProperty("belastingvrijeSomReduction");
    expect(result).toHaveProperty("omTeSlane");
    expect(result).toHaveProperty("beFraction");
    expect(result).toHaveProperty("federalTax");
    expect(result).toHaveProperty("communalTax");
    expect(result).toHaveProperty("communalTaxOnVrijgesteld");
    expect(result).toHaveProperty("netTaxBE");
    expect(result).toHaveProperty("effectiveRateBE");
  });

  it("omTeSlane is never negative", () => {
    // Very low income where personal allowance exceeds tax
    const result = calculateBETax(
      { ...baseBE, grossSalary: 5000, daysWorkedNL: 0, daysWorkedBE: 220 },
      mockNL({ nlTaxableIncome: 0, netTaxNL: 0 }),
    );
    expect(result!.omTeSlane).toBeGreaterThanOrEqual(0);
  });
});
