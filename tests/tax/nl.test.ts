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
  annualStatements: [{ taxableWage: 60000, wageTaxWithheld: 0 }],
  daysWorkedNL: 220,
  daysWorkedBE: 0,
  daysWorkedOther: 0,
  thirtyPercentRuling: false,
  healthInsurancePremium: 0,
  supplementaryPension: 0,
  exchangedGrossWage: 0,
  commutingAllowance: 0,
  serviceVouchers: 0,
  reclaimableWithholdingTax: 0,
  sickDaysNL: 0,
  sickDaysOutsideNL: 0,
};

describe("calculateNLTax", () => {
  it("returns zero tax for zero gross salary", () => {
    const result = calculateNLTax({
      ...base,
      annualStatements: [{ taxableWage: 0, wageTaxWithheld: 0 }],
    });
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
    expect(result.nlTaxableIncome + result.deelNietInNLBelast).toBe(
      base.annualStatements[0]!.taxableWage,
    );
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
    const result = calculateNLTax({
      ...base,
      annualStatements: [{ taxableWage: 5000, wageTaxWithheld: 0 }],
    });
    expect(result.netTaxNL).toBeGreaterThanOrEqual(0);
  });

  it("totalCredits does not exceed taxBeforeCredits + volksverzekeringen", () => {
    const result = calculateNLTax({
      ...base,
      annualStatements: [{ taxableWage: 5000, wageTaxWithheld: 0 }],
    });
    expect(result.totalCredits).toBeLessThanOrEqual(
      result.taxBeforeCredits + result.volksverzekeringen,
    );
  });

  it("brackets array is non-empty for positive income", () => {
    const result = calculateNLTax({ ...base });
    expect(result.brackets.length).toBeGreaterThan(0);
  });

  it("brackets sum matches taxBeforeCredits", () => {
    const result = calculateNLTax({
      ...base,
      annualStatements: [{ taxableWage: 100000, wageTaxWithheld: 0 }],
    });
    const sum = result.brackets.reduce((acc, b) => acc + b.tax, 0);
    expect(sum).toBeCloseTo(result.taxBeforeCredits, 1);
  });

  it("effectiveRateNL is between 0 and 1 for normal salary", () => {
    const result = calculateNLTax({ ...base });
    expect(result.effectiveRateNL).toBeGreaterThan(0);
    expect(result.effectiveRateNL).toBeLessThan(1);
  });

  it("higher salary results in higher effective rate", () => {
    const low = calculateNLTax({
      ...base,
      annualStatements: [{ taxableWage: 30000, wageTaxWithheld: 0 }],
    });
    const high = calculateNLTax({
      ...base,
      annualStatements: [{ taxableWage: 120000, wageTaxWithheld: 0 }],
    });
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

  it("works for tax year 2026", () => {
    const result = calculateNLTax({ ...base, year: 2026 });
    expect(result.netTaxNL).toBeGreaterThan(0);
    expect(result.brackets.length).toBeGreaterThan(0);
  });

  it("reaches top bracket for very high salary", () => {
    const result = calculateNLTax({
      ...base,
      annualStatements: [{ taxableWage: 200000, wageTaxWithheld: 0 }],
    });
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
    expect(
      calculateNLTax({ ...base, annualStatements: [{ taxableWage: 200000, wageTaxWithheld: 0 }] })
        .algemeneHeffingskorting,
    ).toBe(0);
  });

  it("AHK is at maximum for very low income (below phase-out start)", () => {
    expect(
      calculateNLTax({ ...base, annualStatements: [{ taxableWage: 20000, wageTaxWithheld: 0 }] })
        .algemeneHeffingskorting,
    ).toBe(3068);
  });

  it("above-AOW age uses lower AHK max", () => {
    const under = calculateNLTax({
      ...base,
      annualStatements: [{ taxableWage: 10000, wageTaxWithheld: 0 }],
      belowAOWAge: true,
    });
    const over = calculateNLTax({
      ...base,
      annualStatements: [{ taxableWage: 10000, wageTaxWithheld: 0 }],
      belowAOWAge: false,
    });
    expect(over.algemeneHeffingskorting).toBe(1536);
    expect(over.algemeneHeffingskorting).toBeLessThan(under.algemeneHeffingskorting);
  });

  it("splits the credits by the first-bracket rates into income tax due and premiums due", () => {
    // Fully taxed in the Netherlands: one income basis, so the table credit is simply split.
    const result = calculateNLTax({
      ...base,
      annualStatements: [{ taxableWage: 53299, wageTaxWithheld: 0 }],
    });
    const share = 0.0817 / (0.0817 + 0.2765);
    expect(result.incomeTaxDue + result.premiumsDue).toBeCloseTo(result.netTaxNL, 6);
    expect(result.incomeTaxDue).toBeCloseTo(
      result.taxBeforeCredits - result.totalCredits * share,
      0,
    );
    expect(result.premiumsDue).toBeCloseTo(
      result.volksverzekeringen - result.totalCredits * (1 - share),
      0,
    );
  });

  describe("credit bases when part of the wage is not taxed in the Netherlands", () => {
    // Synthetic figures. Each credit has a tax part on the full wage and a premium part on the
    // income taxed in the Netherlands, each rounded up. The expected values come from the same
    // table lookups made as fully Dutch cases, so they do not depend on the mixed-basis path.
    const ts = 0.0817 / (0.0817 + 0.2765);
    const wage = 90000;
    const dutchIncome = Math.round((wage * 170) / 185);
    const fullyDutch = (taxableWage: number) =>
      calculateNLTax({ ...base, annualStatements: [{ taxableWage, wageTaxWithheld: 0 }] });
    const mixed = calculateNLTax({
      ...base,
      annualStatements: [{ taxableWage: wage, wageTaxWithheld: 0 }],
      daysWorkedNL: 170,
      daysWorkedBE: 15,
    });

    it("takes the tax part of the arbeidskorting from the wage and the premium part from the Dutch income", () => {
      const onWage = fullyDutch(wage).arbeidskorting;
      const onDutch = fullyDutch(dutchIncome).arbeidskorting;
      expect(onDutch).toBeGreaterThan(onWage);
      expect(mixed.arbeidskorting).toBe(Math.ceil(onWage * ts) + Math.ceil(onDutch * (1 - ts)));
      expect(mixed.arbeidskorting).toBeGreaterThan(onWage);
      expect(mixed.arbeidskorting).toBeLessThan(onDutch);
    });

    it("keeps the income tax due and premiums due matching the two credit parts", () => {
      const taxPart = Math.ceil(fullyDutch(wage).arbeidskorting * ts);
      const premiumPart = Math.ceil(fullyDutch(dutchIncome).arbeidskorting * (1 - ts));
      expect(mixed.incomeTaxDue).toBeCloseTo(mixed.taxBeforeCredits - taxPart, 6);
      expect(mixed.premiumsDue).toBeCloseTo(mixed.volksverzekeringen - premiumPart, 6);
      expect(mixed.incomeTaxDue + mixed.premiumsDue).toBeCloseTo(mixed.netTaxNL, 6);
    });

    it("applies the same bases to the algemene heffingskorting", () => {
      // A wage whose Dutch income falls inside the phase-out while the full wage is past it.
      const highWage = 78000;
      const highDutch = Math.round((highWage * 170) / 185);
      expect(fullyDutch(highWage).algemeneHeffingskorting).toBe(0);
      expect(fullyDutch(highDutch).algemeneHeffingskorting).toBeGreaterThan(0);
      const result = calculateNLTax({
        ...base,
        annualStatements: [{ taxableWage: highWage, wageTaxWithheld: 0 }],
        daysWorkedNL: 170,
        daysWorkedBE: 15,
      });
      expect(result.algemeneHeffingskorting).toBe(
        Math.ceil(fullyDutch(highWage).algemeneHeffingskorting * ts) +
          Math.ceil(fullyDutch(highDutch).algemeneHeffingskorting * (1 - ts)),
      );
      expect(result.algemeneHeffingskorting).toBeGreaterThan(0);
    });

    it("leaves a fully Dutch case on the table value", () => {
      expect(fullyDutch(wage).arbeidskorting).toBe(
        calculateNLTax({
          ...base,
          annualStatements: [{ taxableWage: wage, wageTaxWithheld: 0 }],
          daysWorkedNL: 1,
          daysWorkedBE: 0,
        }).arbeidskorting,
      );
    });
  });

  it("keeps income tax and premiums adding up to the net tax when a credit part overflows", () => {
    // Tiny Dutch share: income tax is smaller than the tax part of the credits.
    const result = calculateNLTax({
      ...base,
      annualStatements: [{ taxableWage: 40000, wageTaxWithheld: 0 }],
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

  describe("bracket lines", () => {
    it("return numeric bounds, with null for the open top bracket, and no label", () => {
      const result = calculateNLTax({
        ...base,
        annualStatements: [{ taxableWage: 120000, wageTaxWithheld: 0 }],
      });
      const [first, ...rest] = result.brackets;
      expect(first!.from).toBe(0);
      expect(first!.to).toBeGreaterThan(0);
      expect(rest.at(-1)!.to).toBeNull();
      for (const bracket of result.brackets) {
        expect(bracket).not.toHaveProperty("label");
        expect(typeof bracket.from).toBe("number");
      }
      // Contiguous bounds: each bracket starts where the previous one ends.
      result.brackets.slice(1).forEach((bracket, i) => {
        expect(bracket.from).toBe(result.brackets[i]!.to);
      });
    });

    it("survive a JSON round trip unchanged", () => {
      const { brackets } = calculateNLTax({
        ...base,
        annualStatements: [{ taxableWage: 120000, wageTaxWithheld: 0 }],
      });
      expect(JSON.parse(JSON.stringify(brackets))).toEqual(brackets);
    });
  });

  describe("no workdays", () => {
    const none = { ...base, daysWorkedNL: 0, daysWorkedBE: 0, daysWorkedOther: 0, sickDaysNL: 0 };

    it("charges no premiums and applies no credits on income that is not there", () => {
      const result = calculateNLTax(none);
      expect(result.nlTaxableIncome).toBe(0);
      expect(result.brackets).toEqual([]);
      expect(result.volksverzekeringen).toBe(0);
      expect(result.arbeidskorting).toBe(0);
      expect(result.algemeneHeffingskorting).toBe(0);
      expect(result.totalCredits).toBe(0);
      expect(result.incomeTaxDue).toBe(0);
      expect(result.premiumsDue).toBe(0);
      expect(result.netTaxNL).toBe(0);
      expect(result.deelNietInNLBelast).toBe(none.annualStatements[0]!.taxableWage);
    });

    it("ignores a mortgage deduction there is no income to take it from", () => {
      const result = calculateNLTax(none, 5000, 8000);
      expect(result.mortgageDeduction).toBe(0);
      expect(result.mortgageRateCapSurcharge).toBe(0);
      expect(result.netTaxNL).toBe(0);
    });

    it("only sick days still count as Dutch workdays", () => {
      const result = calculateNLTax({ ...none, sickDaysNL: 10 });
      expect(result.nlTaxableIncome).toBe(none.annualStatements[0]!.taxableWage);
      expect(result.volksverzekeringen).toBeGreaterThan(0);
    });
  });
});
