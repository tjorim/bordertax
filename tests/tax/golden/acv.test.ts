/**
 * Golden tests: the worked examples of the ACV telework information session
 * (public/docs/ACV-Telewerk-Infosessie-2026.pdf, slides 34–39). Income year 2025, fiscal wage
 * €53,299, loonheffing withheld €12,902, municipal tax 6%, 50 home-working days of 230.
 *
 * ACV's premium/tax split of the Dutch charge differs from the engine's own estimate by about
 * €206. ACV's split matches a 9.32/35.82 tax share of the heffingskortingen (the 2024 tax-part
 * rate); the engine follows the Belastingdienst 2025 split of 8.17/35.82. The total Dutch charge
 * is the same (€8,588), but the premiums feed O.1 and O.2, so the slide figures are reproduced by
 * entering ACV's split as the Dutch assessment (#432). The estimate-only test at the end shows
 * the engine on its own still lands on ACV's refund within €25; the remaining gap is the 181/231
 * day fraction ACV uses on slide 34 instead of 180/230.
 */
import { describe, expect, it } from "vitest";

import { calculate } from "@/tax";
import { parseStrictTaxInputs } from "@/tax/strict";

const WAGE = 53299;
const WITHHELD = 12902;
const ACV_REFUND = 4314;

const acvInputs = {
  year: 2025,
  residentCountry: "BE",
  civilStatus: "single",
  dependentChildren: 0,
  belowAOWAge: true,
  belgianRegion: "flemish",
  communalTaxRate: 6,
  grossSalary: WAGE,
  daysWorkedOther: 0,
  thirtyPercentRuling: false,
  socialContributions: 0,
  aanvullendPensioen: 0,
  dienstencheques: 0,
  roerendeVoorheffing: 0,
  withheldTaxNL: WITHHELD,
};

/** Scenario 1: 180 Dutch days, 50 home days, no sick days. */
const noSick = { ...acvInputs, daysWorkedNL: 180, daysWorkedBE: 50, sickDays: 0 };
/** Scenario 2: 25 sick days. The Belgian fraction becomes 50/205 and the Dutch one 180/230. */
const withSick = { ...acvInputs, daysWorkedNL: 155, daysWorkedBE: 50, sickDays: 25 };

describe("ACV telework session, income year 2025", () => {
  it("scenario 1: reproduces 1250 = 44,711, O.1 = 10,309.64 and O.2 = 34,401.36", () => {
    // Slide 38 gives no split. Total = 53,299 − 44,711 = 8,588; ACV's premiums 5,874.66 are
    // recovered from O.1: (53,299 − P) × 50/230 = 10,309.64.
    const inputs = parseStrictTaxInputs({
      ...noSick,
      assessmentPremiumsDue: 5874.66,
      assessmentIncomeTaxDue: 2713.34,
    });
    const result = calculate(inputs);
    const be = result.be!;

    expect(result.nlCharge.source).toBe("assessment");
    expect(be.declaredIncome).toBeCloseTo(44711.0, 2);
    expect(be.beIncome).toBeCloseTo(10309.64, 2);
    expect(be.declaredIncome - be.beIncome).toBeCloseTo(34401.36, 2);
    // The refund on the Dutch return is withheld tax minus the assessed charge.
    expect(WITHHELD - result.nlCharge.netTaxNL).toBeCloseTo(ACV_REFUND, 2);
  });

  it("scenario 2: reproduces O.1 = 11,560.81 and O.2 = 33,150.19 with the same 1250", () => {
    // Slide 39 shows only O.1 and O.2. They fix the assessment (total charge 8,588 as before):
    //   O.1 = (53,299 − P) × 50/205 = 11,560.81  →  53,299 − P = 47,399.32  →  P ≈ 5,899.68
    //   O.2 = W − O.1 − T = 33,150.19            →  T = 47,399.32 − 11,560.81 − 33,150.19
    //                                                  = 2,688.32
    // and P + T = 8,588.00 = 53,299 − 44,711, consistent with the unchanged 1250.
    const inputs = parseStrictTaxInputs({
      ...withSick,
      assessmentPremiumsDue: 5899.68,
      assessmentIncomeTaxDue: 2688.32,
    });
    const result = calculate(inputs);
    const be = result.be!;

    expect(be.beFraction).toBeCloseTo(50 / 205, 10);
    expect(be.declaredIncome).toBeCloseTo(44711.0, 2);
    expect(be.beIncome).toBeCloseTo(11560.81, 2);
    expect(be.declaredIncome - be.beIncome).toBeCloseTo(33150.19, 2);
    expect(WITHHELD - result.nlCharge.netTaxNL).toBeCloseTo(ACV_REFUND, 2);
  });

  it("the assessment leaves the Dutch estimate untouched and reports the difference", () => {
    const estimate = calculate(parseStrictTaxInputs(noSick));
    const assessed = calculate(
      parseStrictTaxInputs({
        ...noSick,
        assessmentPremiumsDue: 5874.66,
        assessmentIncomeTaxDue: 2713.34,
      }),
    );

    expect(estimate.nlCharge.source).toBe("estimate");
    expect(assessed.nl).toEqual(estimate.nl);
    // ACV's premiums are about 206 higher than the Belastingdienst split, income tax lower.
    expect(assessed.nlCharge.premiumsDifference).toBeCloseTo(5874.66 - estimate.nl.premiumsDue, 6);
    expect(assessed.nlCharge.premiumsDifference).toBeGreaterThan(150);
    expect(assessed.nlCharge.premiumsDifference).toBeLessThan(250);
    expect(assessed.nlCharge.incomeTaxDifference).toBeLessThan(-150);
    expect(assessed.nlCharge.netTaxDifference).toBeCloseTo(
      assessed.nlCharge.premiumsDifference + assessed.nlCharge.incomeTaxDifference,
      6,
    );
  });

  it("estimate only: the refund lands within 25 euro of ACV's 4,314", () => {
    // The gap is ACV's 181/231 fraction on slide 34 against the 180/230 the engine uses.
    for (const inputs of [noSick, withSick]) {
      const result = calculate(parseStrictTaxInputs(inputs));
      expect(result.nlCharge.source).toBe("estimate");
      expect(Math.abs(WITHHELD - result.nl.netTaxNL - ACV_REFUND)).toBeLessThan(25);
    }
  });

  it("returns the Belgian figures in whole cents while the slide figures still match to the cent", () => {
    for (const [scenario, o1, o2] of [
      [noSick, 10309.64, 34401.36],
      [withSick, 11560.81, 33150.19],
    ] as const) {
      const premiums = scenario === noSick ? 5874.66 : 5899.68;
      const tax = scenario === noSick ? 2713.34 : 2688.32;
      const be = calculate(
        parseStrictTaxInputs({
          ...scenario,
          assessmentPremiumsDue: premiums,
          assessmentIncomeTaxDue: tax,
        }),
      ).be!;
      // Rounded to cents, the figures equal the slide values exactly, not just approximately.
      expect(be.declaredIncome).toBe(44711);
      expect(be.beIncome).toBe(o1);
      expect(be.declaredIncome - be.beIncome).toBeCloseTo(o2, 10);
      for (const value of [be.beIncome, be.netTaxBE, be.hoofdsom, be.communalTax]) {
        expect(value).toBe(Math.round(value * 100) / 100);
      }
    }
  });
});
