import { describe, expect, it } from "vitest";

import { calculateBETax } from "@/tax/be";
import { calculateNLTax } from "@/tax/nl";
import type { TaxInputs, NLTaxResult } from "@/tax/types";

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

function mockNL(overrides?: Partial<NLTaxResult>): NLTaxResult {
  const canonicalInputs: TaxInputs = {
    ...base,
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
  // TODO: Re-enable when NL-resident support is re-integrated
  it.skip("returns null for NL resident", () => {
    const nlInputs = { ...base, residentCountry: "NL" as unknown as TaxInputs["residentCountry"] };
    expect(calculateBETax(nlInputs, mockNL())).toBeNull();
  });

  it("returns an object for BE resident", () => {
    const result = calculateBETax({ ...base, daysWorkedBE: 20 }, mockNL());
    expect(result).not.toBeNull();
  });

  it("returns non-zero tax for BE resident with some BE days", () => {
    const result = calculateBETax({ ...base, daysWorkedNL: 200, daysWorkedBE: 20 }, mockNL());
    expect(result!.netTaxBE).toBeGreaterThan(0);
  });

  it("returns zero netTaxBE when beFraction is 0 (all NL days) but no communal rate", () => {
    // With 100% NL days and 0% communal rate, there is nothing to tax in BE
    const result = calculateBETax(
      { ...base, daysWorkedNL: 220, daysWorkedBE: 0, communalTaxRate: 0 },
      mockNL({ nlTaxableIncome: 60000, netTaxNL: 16000 }),
    );
    expect(result!.beFraction).toBe(0);
    expect(result!.federalTax).toBe(0);
    expect(result!.netTaxBE).toBeCloseTo(0, 2);
  });

  it("netTaxBE > 0 when communalTaxRate > 0 even with 100% NL days (communal on vrijgesteld)", () => {
    // Belgian residents owe communal tax on the exempt NL income
    const result = calculateBETax(
      { ...base, daysWorkedNL: 220, daysWorkedBE: 0, communalTaxRate: 7 },
      mockNL({ nlTaxableIncome: 60000, netTaxNL: 16000 }),
    );
    expect(result!.beFraction).toBe(0);
    expect(result!.communalTaxOnVrijgesteld).toBeGreaterThan(0);
    expect(result!.netTaxBE).toBeGreaterThan(0);
  });

  it("dienstencheques reduce netTaxBE for income year 2024 (reduction still in force)", () => {
    const withoutVouchers = calculateBETax(
      { ...base, year: 2024, daysWorkedNL: 200, daysWorkedBE: 20, dienstencheques: 0 },
      mockNL(),
    );
    const withVouchers = calculateBETax(
      { ...base, year: 2024, daysWorkedNL: 200, daysWorkedBE: 20, dienstencheques: 1000 },
      mockNL(),
    );
    expect(withVouchers!.netTaxBE).toBeLessThan(withoutVouchers!.netTaxBE);
  });

  it("dienstencheques no longer reduce netTaxBE from income year 2025 onward (reduction abolished)", () => {
    const withoutVouchers = calculateBETax(
      { ...base, year: 2025, daysWorkedNL: 200, daysWorkedBE: 20, dienstencheques: 0 },
      mockNL(),
    );
    const withVouchers = calculateBETax(
      { ...base, year: 2025, daysWorkedNL: 200, daysWorkedBE: 20, dienstencheques: 1000 },
      mockNL(),
    );
    expect(withVouchers!.netTaxBE).toBeCloseTo(withoutVouchers!.netTaxBE, 6);
  });

  it("returns zero netTaxBE when both day counts are 0 and grossSalary is 0", () => {
    // With grossSalary=0, declared income=0, no tax of any kind
    const result = calculateBETax(
      { ...base, grossSalary: 0, daysWorkedNL: 0, daysWorkedBE: 0, communalTaxRate: 0 },
      mockNL({ nlTaxableIncome: 0, netTaxNL: 0, volksverzekeringen: 0, effectiveRateNL: 0 }),
    );
    expect(result!.beFraction).toBe(0);
    expect(result!.netTaxBE).toBe(0);
  });

  it("beFraction equals 1 when all days are worked in BE", () => {
    const result = calculateBETax(
      { ...base, daysWorkedNL: 0, daysWorkedBE: 220 },
      mockNL({ nlTaxableIncome: 0, netTaxNL: 0 }),
    );
    expect(result!.beFraction).toBe(1);
  });

  it("follows the FOD guideline: premiums before the day fraction, income tax from the exempt side", () => {
    const result = calculateBETax(
      { ...base, grossSalary: 10000, daysWorkedNL: 9, daysWorkedBE: 1 },
      mockNL({ nlTaxableIncome: 9000, netTaxNL: 2000, incomeTaxDue: 800, premiumsDue: 1200 }),
    );
    // W = 10,000 − 1,200 = 8,800; Y = W × 1/10 = 880 (O.1); code 1250 = 8,000;
    // Z = W − Y − 800 = 7,120 (O.2).
    expect(result!.beIncome).toBeCloseTo(880, 6);
    expect(result!.declaredIncome).toBeCloseTo(8000, 6);
    expect(result!.declaredIncome - result!.beIncome).toBeCloseTo(7120, 6);
    expect(result!.vrijgesteld / result!.netProfessionalIncome).toBeCloseTo(7120 / 8000, 6);
  });

  it("communal levy increases with higher communalTaxRate", () => {
    const low = calculateBETax(
      { ...base, daysWorkedNL: 200, daysWorkedBE: 20, communalTaxRate: 5 },
      mockNL(),
    );
    const high = calculateBETax(
      { ...base, daysWorkedNL: 200, daysWorkedBE: 20, communalTaxRate: 9 },
      mockNL(),
    );
    expect(high!.communalTax + high!.communalTaxOnVrijgesteld).toBeGreaterThan(
      low!.communalTax + low!.communalTaxOnVrijgesteld,
    );
  });

  it("communal tax components are non-negative and at least one is positive", () => {
    const result = calculateBETax(
      { ...base, daysWorkedNL: 200, daysWorkedBE: 20, communalTaxRate: 7 },
      mockNL(),
    );
    expect(result!.communalTax).toBeGreaterThanOrEqual(0);
    expect(result!.communalTaxOnVrijgesteld).toBeGreaterThanOrEqual(0);
    expect(result!.communalTax + result!.communalTaxOnVrijgesteld).toBeGreaterThan(0);
  });

  it("netTaxBE equals federalTax + communalTax + communalTaxOnVrijgesteld", () => {
    const result = calculateBETax({ ...base, daysWorkedNL: 200, daysWorkedBE: 20 }, mockNL());
    expect(result!.netTaxBE).toBeCloseTo(
      result!.saldoFederaal +
        result!.saldoGewestelijk +
        result!.communalTax +
        result!.communalTaxOnVrijgesteld,
      5,
    );
  });

  it("effectiveRateBE is between 0 and 1 for normal inputs", () => {
    const result = calculateBETax({ ...base, daysWorkedNL: 200, daysWorkedBE: 20 }, mockNL());
    expect(result!.effectiveRateBE).toBeGreaterThan(0);
    expect(result!.effectiveRateBE).toBeLessThan(1);
  });

  it("effectiveRateBE is 0 when grossSalary is 0", () => {
    const result = calculateBETax(
      { ...base, grossSalary: 0 },
      mockNL({ nlTaxableIncome: 0, netTaxNL: 0 }),
    );
    expect(result!.effectiveRateBE).toBe(0);
  });

  it("dependent children reduce the tax through higher personal exemption", () => {
    const noChildren = calculateBETax(
      { ...base, daysWorkedNL: 200, daysWorkedBE: 20, dependentChildren: 0 },
      mockNL(),
    );
    const twoChildren = calculateBETax(
      { ...base, daysWorkedNL: 200, daysWorkedBE: 20, dependentChildren: 2 },
      mockNL(),
    );
    expect(twoChildren!.belastingvrijeSomReduction).toBeGreaterThan(
      noChildren!.belastingvrijeSomReduction,
    );
    expect(twoChildren!.netTaxBE).toBeLessThan(noChildren!.netTaxBE);
  });

  it("handles 5+ dependent children via extraPerChildAbove4", () => {
    const four = calculateBETax(
      { ...base, daysWorkedNL: 200, daysWorkedBE: 20, dependentChildren: 4 },
      mockNL(),
    );
    const five = calculateBETax(
      { ...base, daysWorkedNL: 200, daysWorkedBE: 20, dependentChildren: 5 },
      mockNL(),
    );
    expect(five!.belastingvrijeSomReduction).toBeGreaterThan(four!.belastingvrijeSomReduction);
  });

  it("professional expenses are capped at forfaitMax", () => {
    // Very high income: declared income is high, forfait should hit cap
    // Use netTaxNL=0 so declaredIncome = grossSalary
    const result = calculateBETax(
      { ...base, grossSalary: 200000, daysWorkedNL: 0, daysWorkedBE: 220 },
      mockNL({ nlTaxableIncome: 200000, netTaxNL: 0 }),
    );
    expect(result!.professionalExpenses).toBe(5930); // 2025 forfaitMax
  });

  it("professional expenses for low income are a fraction of forfaitBase", () => {
    // Low income, no NL tax: forfait = 30% of (declaredIncome - socialContributions)
    const result = calculateBETax(
      { ...base, grossSalary: 10000, daysWorkedNL: 0, daysWorkedBE: 220 },
      mockNL({ nlTaxableIncome: 0, netTaxNL: 0 }),
    );
    expect(result!.professionalExpenses).toBeCloseTo(10000 * 0.3, 1);
  });

  it("nlExemptIncome is the days-based Dutch share of the gross wage", () => {
    const result = calculateBETax({ ...base, daysWorkedNL: 200, daysWorkedBE: 20 }, mockNL());
    expect(result!.nlExemptIncome).toBeCloseTo(base.grossSalary * (200 / 220), 2);
  });

  it("works for tax year 2024", () => {
    const result = calculateBETax(
      { ...base, year: 2024, daysWorkedNL: 200, daysWorkedBE: 20 },
      mockNL(),
    );
    expect(result).not.toBeNull();
    expect(result!.netTaxBE).toBeGreaterThan(0);
  });

  it("works for tax year 2026", () => {
    const result = calculateBETax(
      { ...base, year: 2026, daysWorkedNL: 200, daysWorkedBE: 20 },
      mockNL(),
    );
    expect(result).not.toBeNull();
    expect(result!.netTaxBE).toBeGreaterThan(0);
  });

  it("returns correct result structure", () => {
    const result = calculateBETax({ ...base, daysWorkedNL: 200, daysWorkedBE: 20 }, mockNL());
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
      { ...base, grossSalary: 5000, daysWorkedNL: 0, daysWorkedBE: 220 },
      mockNL({ nlTaxableIncome: 0, netTaxNL: 0 }),
    );
    expect(result!.omTeSlane).toBeGreaterThanOrEqual(0);
  });

  it("throws for >4 dependents in years with unknown extra child allowance", () => {
    expect(() =>
      calculateBETax(
        { ...base, year: 2020, daysWorkedNL: 200, daysWorkedBE: 20, dependentChildren: 5 },
        mockNL(),
      ),
    ).toThrow(/Unsupported dependent children count/);
  });

  it("throws for unsupported tax year", () => {
    const invalidYearInputs = { ...base, year: 2030 as TaxInputs["year"] };
    expect(() => calculateBETax(invalidYearInputs, mockNL())).toThrow(/Unsupported tax year/);
  });

  describe("cent rounding at the engine boundary", () => {
    const hasCents = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;
    // Fractions are not money and keep full precision.
    const fractions = new Set(["beFraction", "effectiveRateBE"]);

    it("returns every money figure in whole cents", () => {
      const result = calculateBETax(
        {
          ...base,
          grossSalary: 61234.57,
          daysWorkedNL: 191,
          daysWorkedBE: 29,
          socialContributions: 123.456,
          communalTaxRate: 6.3,
        },
        mockNL(),
      )!;
      for (const [key, value] of Object.entries(result)) {
        if (fractions.has(key)) continue;
        expect(hasCents(value), `${key} = ${value}`).toBe(true);
      }
      expect(result.netTaxBE).toBeGreaterThan(0);
    });

    it("keeps the fractions at full precision", () => {
      const result = calculateBETax({ ...base, daysWorkedNL: 200, daysWorkedBE: 20 }, mockNL())!;
      expect(result.beFraction).toBe(20 / 220);
      expect(hasCents(result.beFraction)).toBe(false);
    });

    it("rounds once at the end, not between steps", () => {
      // Communal tax is computed from the unrounded totaleBelasting, so the rounded figures can
      // differ from a recomputation on the rounded ones by at most a cent or two.
      const result = calculateBETax({ ...base, daysWorkedNL: 200, daysWorkedBE: 20 }, mockNL())!;
      const sum =
        result.saldoFederaal +
        result.saldoGewestelijk +
        result.communalTax +
        result.communalTaxOnVrijgesteld;
      expect(Math.abs(sum - result.netTaxBE)).toBeLessThanOrEqual(0.02);
    });
  });

  describe("unused federal reductions (code 1437 and supplementary pension)", () => {
    const inputs = { ...base, daysWorkedNL: 200, daysWorkedBE: 20 };

    it("is 0 when the reductions are fully used", () => {
      const without = calculateBETax(inputs, mockNL())!;
      expect(without.federalReductionsUnused).toBe(0);
      const small = calculateBETax({ ...inputs, roerendeVoorheffing: 10 }, mockNL())!;
      expect(small.federalReductionsUnused).toBe(0);
      expect(small.saldoFederaal).toBeCloseTo(without.saldoFederaal - 10, 2);
    });

    it("reports the part of the reductions above the federal part", () => {
      const without = calculateBETax(inputs, mockNL())!;
      const result = calculateBETax(
        { ...inputs, aanvullendPensioen: 1000, roerendeVoorheffing: 5000 },
        mockNL(),
      )!;
      // 30% × 1,000 + 5,000, against the reduced federal portion.
      expect(result.saldoFederaal).toBe(0);
      expect(result.federalReductionsUnused).toBeCloseTo(5300 - without.gereduceerde, 2);
      expect(result.federalReductionsUnused).toBeGreaterThan(0);
    });

    it("leaves the regional saldo and the federal portion untouched", () => {
      const without = calculateBETax(inputs, mockNL())!;
      const result = calculateBETax({ ...inputs, roerendeVoorheffing: 99999 }, mockNL())!;
      expect(result.gereduceerde).toBe(without.gereduceerde);
      expect(result.saldoGewestelijk).toBe(without.saldoGewestelijk);
      expect(result.federalTax).toBe(result.saldoFederaal);
    });
  });
});
