import { describe, expect, it } from "vitest";

import { calculate } from "@/tax";
import { DEFAULT_INPUTS } from "@/tax/defaults";
import { compareSourcing } from "@/tax/sourcing";
import type { TaxInputs } from "@/tax/types";

const inputs = (overrides: Partial<TaxInputs>): TaxInputs => ({
  ...DEFAULT_INPUTS,
  annualStatements: [{ taxableWage: 80000, wageTaxWithheld: 0 }],
  daysWorkedNL: 180,
  daysWorkedBE: 20,
  ...overrides,
});

describe("compareSourcing", () => {
  it("shows the issue example: 6,957 untaxed by NL against 8,000 Belgian-taxable", () => {
    // 180 NL / 20 BE / 30 sick days scheduled in NL on an 80,000 wage (#431).
    const result = calculate(inputs({ sickDaysNL: 30 }));
    const sourcing = compareSourcing(result);
    expect(sourcing.applies).toBe(true);
    expect(sourcing.notTaxedInNL).toBe(6957);
    expect(sourcing.belgianTaxableShareOfWage).toBe(8000);
    expect(sourcing.doubleTaxationRisk).toBe(1043);
    expect(sourcing.taxedByNeither).toBe(0);
    expect(sourcing.dutchShareOutsideNL).toBeCloseTo(20 / 230, 12);
    expect(sourcing.belgianShareOutsideNL).toBeCloseTo(20 / 200, 12);
    expect(sourcing.o1).toBe(result.be!.beIncome);
    expect(sourcing.o2).toBeCloseTo(result.be!.declaredIncome - result.be!.beIncome, 2);
  });

  it("reports the part left out of both returns when the sick days fell outside NL", () => {
    const sourcing = compareSourcing(calculate(inputs({ sickDaysOutsideNL: 30 })));
    // Dutch: 50/230 of the wage untaxed = 17,391; Belgian: 20/200 = 8,000 taxable.
    expect(sourcing.notTaxedInNL).toBe(17391);
    expect(sourcing.doubleTaxationRisk).toBe(0);
    expect(sourcing.taxedByNeither).toBe(9391);
  });

  it("does not apply without sick days, where both splits agree", () => {
    const sourcing = compareSourcing(calculate(inputs({})));
    expect(sourcing.applies).toBe(false);
    expect(sourcing.notTaxedInNL).toBe(sourcing.belgianTaxableShareOfWage);
  });

  it("does not apply without workdays", () => {
    const result = calculate(inputs({ daysWorkedNL: 0, daysWorkedBE: 0 }));
    expect(compareSourcing(result).applies).toBe(false);
  });
});

describe("several annual statements", () => {
  it("tax the summed wage exactly as one statement with the total", () => {
    const one = calculate(
      inputs({ annualStatements: [{ taxableWage: 80000, wageTaxWithheld: 15000 }] }),
    );
    const two = calculate(
      inputs({
        annualStatements: [
          { taxableWage: 50000, wageTaxWithheld: 9000 },
          { taxableWage: 30000, wageTaxWithheld: 6000 },
        ],
      }),
    );
    expect(two.taxableWage).toBe(80000);
    expect(two.wageTaxWithheld).toBe(15000);
    const { inputs: _a, ...oneRest } = one;
    const { inputs: _b, ...twoRest } = two;
    expect(twoRest).toEqual(oneRest);
  });
});
