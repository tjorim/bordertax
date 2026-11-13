import { describe, expect, it } from "vitest";

import { calculate } from "@/tax/index";
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

describe("calculate", () => {
  it("returns zero tax and net income for zero gross salary", () => {
    const result = calculate({
      ...base,
      annualStatements: [{ taxableWage: 0, wageTaxWithheld: 0 }],
    });

    expect(result.totalTax).toBe(0);
    expect(result.netIncome).toBe(0);
    expect(result.effectiveRateTotal).toBe(0);
  });

  // TODO: Re-enable when NL-resident support is re-integrated
  it.skip("returns null be result for NL resident", () => {
    const result = calculate({
      ...base,
      residentCountry: "NL" as unknown as TaxInputs["residentCountry"],
    });
    expect(result.be).toBeNull();
  });

  it("returns non-null be result for BE resident", () => {
    const result = calculate({ ...base, residentCountry: "BE", daysWorkedBE: 20 });
    expect(result.be).not.toBeNull();
  });

  it("grossIncome equals grossSalary input", () => {
    const result = calculate({ ...base });
    expect(result.taxableWage).toBe(base.annualStatements[0]!.taxableWage);
  });

  it("netIncome equals grossSalary minus totalTax", () => {
    const result = calculate({ ...base });
    expect(result.netIncome).toBeCloseTo(result.taxableWage - result.totalTax, 5);
  });

  // TODO: Re-enable when NL-resident support is re-integrated
  it.skip("totalTax equals nl.netTaxNL when residentCountry is NL", () => {
    const result = calculate({
      ...base,
      residentCountry: "NL" as unknown as TaxInputs["residentCountry"],
    });
    expect(result.totalTax).toBeCloseTo(result.nl.netTaxNL, 5);
  });

  it("totalTax equals nl.netTaxNL + be.netTaxBE for BE resident", () => {
    const result = calculate({ ...base, residentCountry: "BE", daysWorkedBE: 20 });
    expect(result.totalTax).toBeCloseTo(result.nl.netTaxNL + (result.be?.netTaxBE ?? 0), 5);
  });

  it("effectiveRateTotal is totalTax / grossSalary", () => {
    const result = calculate({ ...base });
    expect(result.effectiveRateTotal).toBeCloseTo(result.totalTax / result.taxableWage, 10);
  });

  it("effectiveRateTotal is 0 when grossSalary is 0", () => {
    const result = calculate({
      ...base,
      annualStatements: [{ taxableWage: 0, wageTaxWithheld: 0 }],
    });
    expect(result.effectiveRateTotal).toBe(0);
  });

  it("inputs are preserved in result", () => {
    const result = calculate({ ...base });
    expect(result.inputs).toEqual(base);
  });

  describe("sick days sourcing fractions", () => {
    it("nlFractionDutchMethod adds sick days to numerator and includes them in denominator", () => {
      // NL method: sick days count as NL workdays
      // (200 + 10) / (200 + 20 + 10) = 210/230
      const result = calculate({ ...base, daysWorkedNL: 200, daysWorkedBE: 20, sickDaysNL: 10 });
      expect(result.nlFractionDutchMethod).toBeCloseTo(210 / 230, 10);
    });

    it("nlFractionBelgianMethod excludes sick days from both numerator and denominator", () => {
      // BE method: sick days excluded entirely
      // 200 / (200 + 20) = 200/220
      const result = calculate({ ...base, daysWorkedNL: 200, daysWorkedBE: 20, sickDaysNL: 10 });
      expect(result.nlFractionBelgianMethod).toBeCloseTo(200 / 220, 10);
    });

    it("nlFractionDutchMethod and nlFractionBelgianMethod are equal when sickDays is 0", () => {
      const result = calculate({ ...base, daysWorkedNL: 200, daysWorkedBE: 20, sickDaysNL: 0 });
      expect(result.nlFractionDutchMethod).toBeCloseTo(result.nlFractionBelgianMethod, 10);
    });

    it("nlFractionDutchMethod is greater than nlFractionBelgianMethod when sickDays > 0", () => {
      // NL method gives sick days to NL, so NL fraction is higher than BE method
      const result = calculate({ ...base, daysWorkedNL: 200, daysWorkedBE: 20, sickDaysNL: 10 });
      expect(result.nlFractionDutchMethod).toBeGreaterThan(result.nlFractionBelgianMethod);
    });

    it("both fractions are 0 when all days are 0", () => {
      const result = calculate({ ...base, daysWorkedNL: 0, daysWorkedBE: 0, sickDaysNL: 0 });
      expect(result.nlFractionDutchMethod).toBe(0);
      expect(result.nlFractionBelgianMethod).toBe(0);
    });

    it("nlFractionBelgianMethod is 0 when NL days are 0 but there are sick days", () => {
      // BE method: 0 / (0 + 20) = 0
      const result = calculate({ ...base, daysWorkedNL: 0, daysWorkedBE: 20, sickDaysNL: 5 });
      expect(result.nlFractionBelgianMethod).toBe(0);
    });

    it("nlFractionDutchMethod is 1 when all worked days are NL days", () => {
      const result = calculate({ ...base, daysWorkedNL: 220, daysWorkedBE: 0, sickDaysNL: 0 });
      expect(result.nlFractionDutchMethod).toBe(1);
    });

    it("nlFractionDutchMethod denominator includes daysWorkedOther and sickDays", () => {
      // NL method: (200 + 0) / (200 + 20 + 10 + 0) = 200/230 (no sick)
      const result = calculate({
        ...base,
        daysWorkedNL: 200,
        daysWorkedBE: 20,
        daysWorkedOther: 10,
        sickDaysNL: 0,
        sickDaysOutsideNL: 0,
      });
      expect(result.nlFractionDutchMethod).toBeCloseTo(200 / 230, 10);
      expect(result.nlFractionBelgianMethod).toBeCloseTo(200 / 230, 10);
    });

    it("nlFractionDutchMethod adds sick days to NL numerator; nlFractionBelgianMethod excludes sick days", () => {
      // NL method: (200 + 5) / (200 + 20 + 10 + 5) = 205/235
      // BE method: 200 / (200 + 20 + 10) = 200/230
      const result = calculate({
        ...base,
        daysWorkedNL: 200,
        daysWorkedBE: 20,
        daysWorkedOther: 10,
        sickDaysNL: 5,
        sickDaysOutsideNL: 0,
      });
      expect(result.nlFractionDutchMethod).toBeCloseTo(205 / 235, 10);
      expect(result.nlFractionBelgianMethod).toBeCloseTo(200 / 230, 10);
    });
  });

  describe("Dutch assessment", () => {
    const gross = { ...base, daysWorkedNL: 180, daysWorkedBE: 40, sickDaysNL: 0 };
    const assessment = { assessmentIncomeTaxDue: 3000, assessmentPremiumsDue: 5000 };

    it("uses the estimate and reports no difference when no assessment is entered", () => {
      const result = calculate(gross);
      expect(result.nlCharge).toEqual({
        source: "estimate",
        incomeTaxDue: result.nl.incomeTaxDue,
        premiumsDue: result.nl.premiumsDue,
        netTaxNL: result.nl.netTaxNL,
        incomeTaxDifference: 0,
        premiumsDifference: 0,
        netTaxDifference: 0,
      });
      expect(result.be!.declaredIncome).toBe(
        gross.annualStatements[0]!.taxableWage - result.nl.netTaxNL,
      );
    });

    it("feeds 1250, O.1 and O.2 from the assessed figures and keeps the Dutch estimate", () => {
      const estimate = calculate(gross);
      const result = calculate({ ...gross, ...assessment });
      const be = result.be!;
      const w = gross.annualStatements[0]!.taxableWage - 5000;

      expect(result.nl).toEqual(estimate.nl);
      expect(result.nlCharge.source).toBe("assessment");
      expect(result.nlCharge.netTaxNL).toBe(8000);
      expect(be.declaredIncome).toBe(gross.annualStatements[0]!.taxableWage - 8000);
      expect(be.beIncome).toBeCloseTo(w * be.beFraction, 8);
      expect(be.declaredIncome - be.beIncome).toBeCloseTo(w - w * be.beFraction - 3000, 8);
      expect(result.nlCharge.incomeTaxDifference).toBeCloseTo(3000 - estimate.nl.incomeTaxDue, 8);
      expect(result.nlCharge.premiumsDifference).toBeCloseTo(5000 - estimate.nl.premiumsDue, 8);
    });

    it("uses the assessed Dutch amount in total tax and net income", () => {
      const result = calculate({ ...gross, ...assessment });
      expect(result.totalTax).toBe(8000 + result.be!.netTaxBE);
      expect(result.netIncome).toBe(gross.annualStatements[0]!.taxableWage - result.totalTax);
    });

    it("ignores a lone assessment figure", () => {
      const estimate = calculate(gross);
      expect(calculate({ ...gross, assessmentIncomeTaxDue: 3000 })).toEqual({
        ...estimate,
        inputs: { ...gross, assessmentIncomeTaxDue: 3000 },
      });
      expect(calculate({ ...gross, assessmentPremiumsDue: 5000 }).nlCharge.source).toBe("estimate");
    });

    it("measures the mortgage effect on the estimate, not on the fixed assessment", () => {
      const mortgage = {
        ...gross,
        mortgageEnabled: true,
        mortgageInterest: 8000,
        mortgageOwnershipShare: 100,
        mortgageHomeValue: 300000,
        incomeOutsideNL: 0,
      };
      const estimate = calculate(mortgage);
      const assessed = calculate({ ...mortgage, ...assessment });
      expect(assessed.mortgage!.potential).toEqual(estimate.mortgage!.potential);
      expect(assessed.mortgage!.realised).toEqual(estimate.mortgage!.realised);
    });
  });

  describe("no workdays state", () => {
    const none = { ...base, daysWorkedNL: 0, daysWorkedBE: 0, daysWorkedOther: 0, sickDaysNL: 0 };

    it("is flagged, with zero Dutch figures and no Belgian tax", () => {
      const result = calculate(none);
      expect(result.noWorkdays).toBe(true);
      expect(result.nl.netTaxNL).toBe(0);
      expect(result.nlCharge.netTaxNL).toBe(0);
      expect(result.be!.beIncome).toBe(0);
      expect(result.be!.netTaxBE).toBe(0);
      expect(result.totalTax).toBe(0);
      expect(result.netIncome).toBe(none.annualStatements[0]!.taxableWage);
    });

    it("is not flagged once any workday or sick day is entered", () => {
      expect(calculate(base).noWorkdays).toBe(false);
      expect(calculate({ ...none, daysWorkedOther: 1 }).noWorkdays).toBe(false);
      expect(calculate({ ...none, sickDaysNL: 1 }).noWorkdays).toBe(false);
    });

    it("keeps an entered assessment as the Dutch charge", () => {
      const result = calculate({
        ...none,
        assessmentIncomeTaxDue: 1000,
        assessmentPremiumsDue: 500,
      });
      expect(result.noWorkdays).toBe(true);
      expect(result.nlCharge.source).toBe("assessment");
      expect(result.nlCharge.netTaxNL).toBe(1500);
    });
  });

  describe("Belgian rounding at the boundary", () => {
    it("returns cent-clean totals", () => {
      const result = calculate({
        ...base,
        annualStatements: [{ taxableWage: 61234.57, wageTaxWithheld: 0 }],
        daysWorkedNL: 191,
        daysWorkedBE: 29,
      });
      expect(result.be!.netTaxBE).toBe(Math.round(result.be!.netTaxBE * 100) / 100);
      expect(result.totalTax).toBe(Math.round(result.totalTax * 100) / 100);
      expect(result.totalTax).toBeCloseTo(result.nlCharge.netTaxNL + result.be!.netTaxBE, 6);
      expect(result.netIncome).toBe(Math.round(result.netIncome * 100) / 100);
    });
  });
});
