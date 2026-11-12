/**
 * Input schema version 2 must not change a single figure for inputs that version 1 could express.
 * The fixture holds headline results of the version 1 engine for every income year and a spread of
 * inputs (sick days, deductions, mortgage, assessment figures, zero workdays). The full results were
 * also compared field by field when the change was made; they differed only in the renamed fields.
 */
import { describe, expect, it } from "vitest";

import { calculate } from "@/tax";
import {
  findV1Fields,
  INPUT_SCHEMA_VERSION,
  migrateV1Inputs,
  V1_FIELD_RENAMES,
} from "@/tax/migrations";
import { parseStrictTaxInputs } from "@/tax/strict";
import type { TaxResult } from "@/tax/types";
import fixture from "./fixtures/v1-inputs-results.json";

const columns: Record<string, (result: TaxResult) => number | null> = {
  "nl.netTaxNL": (r) => r.nl.netTaxNL,
  "nl.deelNietInNLBelast": (r) => r.nl.deelNietInNLBelast,
  "nlCharge.netTaxNL": (r) => r.nlCharge.netTaxNL,
  "be.declaredIncome": (r) => r.be?.declaredIncome ?? null,
  "be.beIncome": (r) => r.be?.beIncome ?? null,
  "be.netTaxBE": (r) => r.be?.netTaxBE ?? null,
  totalTax: (r) => r.totalTax,
  netIncome: (r) => r.netIncome,
  nlFractionDutchMethod: (r) => r.nlFractionDutchMethod,
  nlFractionBelgianMethod: (r) => r.nlFractionBelgianMethod,
  "mortgage.potential.netBenefit": (r) => r.mortgage?.potential.netBenefit ?? null,
};

describe("version 1 inputs after migration", () => {
  const expected = fixture.expected as Record<string, (number | null)[]>;

  it("covers every income year and scenario", () => {
    expect(fixture.columns).toEqual(Object.keys(columns));
    expect(Object.keys(expected)).toHaveLength(7 * Object.keys(fixture.scenarios).length);
  });

  it.each(Object.keys(expected))("%s gives the version 1 figures", (name) => {
    const [year, scenario] = name.split("/") as [string, keyof typeof fixture.scenarios];
    const v1 = { ...fixture.base, year: Number(year), ...fixture.scenarios[scenario] };
    const result = calculate(parseStrictTaxInputs(migrateV1Inputs(v1)));
    expect(Object.values(columns).map((read) => read(result))).toEqual(expected[name]);
    expect(result.taxableWage).toBe(v1.grossSalary);
    expect(result.wageTaxWithheld).toBe(v1.withheldTaxNL);
  });
});

describe("migrateV1Inputs", () => {
  it("renames every version 1 field and keeps the rest", () => {
    const migrated = migrateV1Inputs({
      year: 2024,
      grossSalary: 50000,
      withheldTaxNL: 9000,
      sickDays: 4,
      socialContributions: 10,
      aanvullendPensioen: 20,
      dienstencheques: 30,
      roerendeVoorheffing: 40,
      daysWorkedNL: 100,
    });
    expect(migrated).toEqual({
      year: 2024,
      annualStatements: [{ taxableWage: 50000, wageTaxWithheld: 9000 }],
      sickDaysNL: 4,
      sickDaysOutsideNL: 0,
      healthInsurancePremium: 10,
      supplementaryPension: 20,
      serviceVouchers: 30,
      reclaimableWithholdingTax: 40,
      daysWorkedNL: 100,
    });
    expect(findV1Fields(migrated)).toEqual([]);
  });

  it("leaves non-objects alone", () => {
    expect(migrateV1Inputs(null)).toBeNull();
    expect(migrateV1Inputs([1])).toEqual([1]);
  });

  it("documents a rename for every version 1 field it handles", () => {
    expect(Object.keys(V1_FIELD_RENAMES).sort()).toEqual(
      [
        "aanvullendPensioen",
        "dienstencheques",
        "grossSalary",
        "roerendeVoorheffing",
        "sickDays",
        "socialContributions",
        "withheldTaxNL",
      ].sort(),
    );
    expect(INPUT_SCHEMA_VERSION).toBe(2);
  });
});

describe("version 1 names at the strict boundary", () => {
  it("are rejected with the rename map", () => {
    const v1 = { ...fixture.base, year: 2025 };
    expect(() => parseStrictTaxInputs(v1)).toThrow(
      /grossSalary: renamed in input schema version 2; use annualStatements\[\]\.taxableWage/,
    );
    try {
      parseStrictTaxInputs(v1);
    } catch (error) {
      const message = String(error);
      for (const [from, to] of Object.entries(V1_FIELD_RENAMES)) {
        expect(message).toContain(`${from} → ${to}`);
      }
    }
  });
});
