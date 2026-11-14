/**
 * Golden tests: the worked examples of the ACV telework information session
 * (public/docs/ACV-Telewerk-Infosessie-2026.pdf, slides 34–39). Income year 2025, fiscal wage
 * €53,299, loonheffing withheld €12,902, municipal tax 6%, 50 home-working days of 230.
 *
 * ACV's premium/tax split of the Dutch charge differs from the engine's own estimate by about
 * €206. ACV's split matches a 9.32/35.82 tax share of the heffingskortingen (the 2024 tax-part
 * rate); the engine follows the Belastingdienst 2025 split of 8.17/35.82. The total Dutch charge
 * is the same (€8,588), but the premiums feed O.1 and O.2, so the slide figures are reproduced by
 * entering ACV's split as the Dutch assessment (#432). The estimate-only test at the end
 * documents that the engine's own estimate is now about 1,100 euro above ACV's refund (credit
 * bases, docs/tax-model.md).
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
  annualStatements: [{ taxableWage: WAGE, wageTaxWithheld: WITHHELD }],
  daysWorkedOther: 0,
  thirtyPercentRuling: false,
  healthInsurancePremium: 0,
  supplementaryPension: 0,
  serviceVouchers: 0,
  reclaimableWithholdingTax: 0,
  // Every sick day in the session falls on a day scheduled in the Netherlands.
  sickDaysOutsideNL: 0,
};

/** Scenario 1: 180 Dutch days, 50 home days, no sick days. */
const noSick = { ...acvInputs, daysWorkedNL: 180, daysWorkedBE: 50, sickDaysNL: 0 };
/** Scenario 2: 25 sick days. The Belgian fraction becomes 50/205 and the Dutch one 180/230. */
const withSick = { ...acvInputs, daysWorkedNL: 155, daysWorkedBE: 50, sickDaysNL: 25 };

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
    // ACV's premiums are higher than the engine's estimate and its income tax lower. The gap was
    // about 206 euro on the Belastingdienst split of the credits; the engine now also gives the
    // premium part of the credits the income taxed in the Netherlands, which widens it.
    expect(assessed.nlCharge.premiumsDifference).toBeCloseTo(5874.66 - estimate.nl.premiumsDue, 6);
    expect(assessed.nlCharge.premiumsDifference).toBeGreaterThan(150);
    expect(assessed.nlCharge.incomeTaxDifference).toBeLessThan(-150);
    expect(assessed.nlCharge.netTaxDifference).toBeCloseTo(
      assessed.nlCharge.premiumsDifference + assessed.nlCharge.incomeTaxDifference,
      6,
    );
  });

  it("estimate only: the refund is about 1,100 euro above ACV's 4,314 (credit bases)", () => {
    // ACV's refund matches credits worked out on the full wage for both parts, which the engine
    // used until a definitieve aanslag 2024 showed the premium part on the income taxed in the
    // Netherlands (docs/tax-model.md, "Known gaps"). The slide predates that treatment or was
    // worked on the wage basis, so the engine's estimate is now higher than ACV's refund. The
    // assertion documents the gap; the slide figures themselves stay reproducible with the
    // assessment entered (the tests above). Revisit when more real assessments are available.
    for (const inputs of [noSick, withSick]) {
      const result = calculate(parseStrictTaxInputs(inputs));
      expect(result.nlCharge.source).toBe("estimate");
      const refund = WITHHELD - result.nl.netTaxNL;
      expect(refund - ACV_REFUND).toBeGreaterThan(1000);
      expect(refund - ACV_REFUND).toBeLessThan(1200);
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
