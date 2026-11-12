import { describe, expect, it } from "vitest";

import { calculate } from "@/tax";
import { VALID_YEARS } from "@/tax/constants";
import { getEigenwoningforfait } from "@/tax/mortgage";
import { calculateNLTax } from "@/tax/nl";
import type { TaxInputs } from "@/tax/types";

// Figures: Belastingdienst Fiscale informatie 2026 (heffingskortingen, eigen woning), FOD Financiën
// inkomstenjaar 2026 / aanslagjaar 2027. See `src/tax/years/2026.ts` for the exact pages.
const base: TaxInputs = {
  year: 2026,
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
  serviceVouchers: 0,
  reclaimableWithholdingTax: 0,
  sickDaysNL: 0,
  sickDaysOutsideNL: 0,
};

const nl = (overrides: Partial<TaxInputs>) => calculateNLTax({ ...base, ...overrides });

describe("income year 2026", () => {
  it("is a supported year", () => {
    expect(VALID_YEARS).toContain(2026);
  });

  describe("Dutch result", () => {
    it("charges 8.10% income tax and 27.65% premiums up to the €38,883 ceiling", () => {
      const result = nl({ annualStatements: [{ taxableWage: 38883, wageTaxWithheld: 0 }] });
      expect(result.taxBeforeCredits).toBe(3149); // floor(38,883 × 8.10%)
      expect(result.volksverzekeringen).toBe(10751); // floor(38,883 × 27.65%)
    });

    it("stops charging premiums above the ceiling and applies 37.56% in the second bracket", () => {
      const result = nl({ annualStatements: [{ taxableWage: 60000, wageTaxWithheld: 0 }] });
      expect(result.volksverzekeringen).toBe(10751);
      expect(result.taxBeforeCredits).toBe(11080); // 3,149 + floor(21,117 × 37.56%)
    });

    it("applies 49.50% above €78,426", () => {
      const result = nl({ annualStatements: [{ taxableWage: 100000, wageTaxWithheld: 0 }] });
      // 3,149 + floor(39,543 × 37.56%) + floor(21,574 × 49.50%)
      expect(result.taxBeforeCredits).toBe(28680);
      expect(result.brackets.at(-1)?.rate).toBe(0.495);
    });

    it("gives the full algemene heffingskorting up to €29,736 and phases it out to zero at €78,426", () => {
      expect(
        nl({ annualStatements: [{ taxableWage: 29736, wageTaxWithheld: 0 }] })
          .algemeneHeffingskorting,
      ).toBe(3115);
      expect(
        nl({ annualStatements: [{ taxableWage: 60000, wageTaxWithheld: 0 }] })
          .algemeneHeffingskorting,
      ).toBe(1179);
      expect(
        nl({ annualStatements: [{ taxableWage: 78426, wageTaxWithheld: 0 }] })
          .algemeneHeffingskorting,
      ).toBe(0);
      expect(
        nl({ annualStatements: [{ taxableWage: 120000, wageTaxWithheld: 0 }] })
          .algemeneHeffingskorting,
      ).toBe(0);
    });

    it("builds up and phases out the arbeidskorting at the published stage joins", () => {
      expect(
        nl({ annualStatements: [{ taxableWage: 11965, wageTaxWithheld: 0 }] }).arbeidskorting,
      ).toBe(996);
      expect(
        nl({ annualStatements: [{ taxableWage: 20000, wageTaxWithheld: 0 }] }).arbeidskorting,
      ).toBe(3488);
      expect(
        nl({ annualStatements: [{ taxableWage: 25845, wageTaxWithheld: 0 }] }).arbeidskorting,
      ).toBe(5300);
      expect(
        nl({ annualStatements: [{ taxableWage: 45592, wageTaxWithheld: 0 }] }).arbeidskorting,
      ).toBe(5685);
      expect(
        nl({ annualStatements: [{ taxableWage: 60000, wageTaxWithheld: 0 }] }).arbeidskorting,
      ).toBe(4748);
      expect(
        nl({ annualStatements: [{ taxableWage: 132920, wageTaxWithheld: 0 }] }).arbeidskorting,
      ).toBe(0);
    });

    it("uses the whole-year-AOW credit tables from AOW age", () => {
      const over = (taxableWage: number) =>
        nl({ annualStatements: [{ taxableWage, wageTaxWithheld: 0 }], belowAOWAge: false });
      expect(over(10000).algemeneHeffingskorting).toBe(1556);
      expect(over(60000).algemeneHeffingskorting).toBe(590);
      expect(over(11965).arbeidskorting).toBe(498);
      expect(over(30000).arbeidskorting).toBe(2688);
      expect(over(45592).arbeidskorting).toBe(2840);
      expect(over(132920).arbeidskorting).toBe(0);
    });

    it("charges no AOW premium from AOW age, so the first bracket is 17.85% in total", () => {
      const result = nl({
        annualStatements: [{ taxableWage: 38883, wageTaxWithheld: 0 }],
        belowAOWAge: false,
      });
      expect(result.taxBeforeCredits).toBe(3149);
      expect(result.volksverzekeringen).toBe(Math.floor(38883 * 0.0975));
    });
  });

  describe("Belgian result", () => {
    const beResult = (overrides: Partial<TaxInputs> = {}) =>
      calculate({ ...base, daysWorkedNL: 200, daysWorkedBE: 20, ...overrides }).be!;

    it("caps the professional-expenses forfait at €6,070", () => {
      const result = beResult({ annualStatements: [{ taxableWage: 200000, wageTaxWithheld: 0 }] });
      expect(result.professionalExpenses).toBe(6070);
    });

    it.each([[60000], [200000]])(
      "computes the progressive tax with the 2026 brackets (gross %i)",
      (grossSalary) => {
        const result = beResult({
          annualStatements: [{ taxableWage: grossSalary, wageTaxWithheld: 0 }],
        });
        const income = result.netProfessionalIncome;
        const expected =
          Math.min(income, 16720) * 0.25 +
          Math.max(0, Math.min(income, 29510) - 16720) * 0.4 +
          Math.max(0, Math.min(income, 51070) - 29510) * 0.45 +
          Math.max(0, income - 51070) * 0.5;
        expect(income).toBeGreaterThan(grossSalary === 60000 ? 29510 : 51070);
        expect(result.basisbelasting).toBeCloseTo(expected, 6);
      },
    );

    it.each([
      [0, 11550],
      [1, 11550 + 2030],
      [2, 11550 + 5230],
      [3, 11550 + 11720],
      [4, 11550 + 18970],
      [5, 11550 + 18970 + 7240],
    ])("reduces the tax by 25% of the allowance with %i children", (children, allowance) => {
      const result = beResult({ dependentChildren: children });
      expect(result.belastingvrijeSomReduction).toBeCloseTo(allowance * 0.25, 6);
    });

    it("no longer reduces the regional tax for dienstencheques (Flemish reduction abolished)", () => {
      const without = beResult({ serviceVouchers: 0 });
      const withCheques = beResult({ serviceVouchers: 1000 });
      expect(withCheques.netTaxBE).toBeCloseTo(without.netTaxBE, 6);
    });
  });

  describe("mortgage", () => {
    const home = (mortgageHomeValue: number) =>
      getEigenwoningforfait({ ...base, mortgageEnabled: true, mortgageHomeValue });

    it("applies the 2026 eigenwoningforfait bands, threshold €1,350,000 and €4,725 base", () => {
      expect(home(12500)).toBe(0);
      expect(home(25000)).toBeCloseTo(25);
      expect(home(50000)).toBeCloseTo(100);
      expect(home(75000)).toBeCloseTo(187.5);
      expect(home(300000)).toBeCloseTo(1050);
      expect(home(1350000)).toBeCloseTo(4725);
      expect(home(1450000)).toBeCloseTo(4725 + 2350);
    });

    it("limits the deduction in the highest bracket to 37.56%", () => {
      const result = calculate({
        ...base,
        annualStatements: [{ taxableWage: 120000, wageTaxWithheld: 0 }],
        mortgageEnabled: true,
        mortgageHomeValue: 400000,
        mortgageInterest: 10000,
        mortgageOwnershipShare: 100,
        incomeOutsideNL: 0,
      });
      expect(result.mortgage?.realised.netBenefit).toBeGreaterThan(0);
      expect(result.nl.mortgageRateCapSurcharge).toBeGreaterThan(0);
    });
  });
});
