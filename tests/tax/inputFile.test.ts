import { describe, expect, it } from "vitest";
import { version } from "../../package.json";
import {
  INPUT_FILE_FORMAT,
  INPUT_FILE_MAX_BYTES,
  INPUT_FILE_SCHEMA_VERSION,
  parseInputFile,
  serializeInputFile,
} from "@/tax/inputFile";
import { parseStrictTaxInputs } from "@/tax/strict";
import { mockInputs } from "../test-utils/mockData";

function wrap(inputs: unknown, overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    format: INPUT_FILE_FORMAT,
    schemaVersion: INPUT_FILE_SCHEMA_VERSION,
    appVersion: "1",
    inputs,
    ...overrides,
  });
}

describe("input file", () => {
  it("records year, app version and schema version, and keeps inputs in MCP shape", () => {
    const file = serializeInputFile({ ...mockInputs, year: 2024 });
    if (!file.ok) throw new Error("export failed");
    expect(file.filename).toBe("bordertax-inputs-2024.json");
    const parsed = JSON.parse(file.json);
    expect(parsed).toMatchObject({
      format: INPUT_FILE_FORMAT,
      schemaVersion: INPUT_FILE_SCHEMA_VERSION,
      appVersion: version,
      year: 2024,
    });
    expect(() => parseStrictTaxInputs(parsed.inputs)).not.toThrow();
  });

  it("round-trips inputs, including the mortgage scenario", () => {
    const inputs = {
      ...mockInputs,
      mortgageEnabled: true,
      mortgageInterest: 6000,
      mortgageHomeValue: 400000,
      mortgageOwnershipShare: 50,
      incomeOutsideNL: 1000,
    };
    const file = serializeInputFile(inputs);
    if (!file.ok) throw new Error("export failed");
    const result = parseInputFile(file.json);
    if (!result.ok) throw new Error(result.error);
    expect(result.inputs).toMatchObject(inputs);
    expect(result.year).toBe(inputs.year);
  });

  it("drops mortgage values when the scenario is off", () => {
    const file = serializeInputFile({ ...mockInputs, mortgageEnabled: false, mortgageInterest: 5 });
    if (!file.ok) throw new Error("export failed");
    expect(JSON.parse(file.json).inputs).not.toHaveProperty("mortgageInterest");
  });

  it("refuses to export incomplete inputs", () => {
    expect(
      serializeInputFile({
        ...mockInputs,
        annualStatements: [{ taxableWage: undefined as never, wageTaxWithheld: 0 }],
      }).ok,
    ).toBe(false);
    expect(serializeInputFile({ ...mockInputs, daysWorkedNL: 9999 }).ok).toBe(false);
  });

  it.each([
    ["not json", "{nope", "not-json"],
    ["a JSON array", "[]", "wrong-format"],
    ["another format", wrap(mockInputs, { format: "other" }), "wrong-format"],
    ["a newer schema", wrap(mockInputs, { schemaVersion: 3 }), "unsupported-version"],
    ["schema version 0", wrap(mockInputs, { schemaVersion: 0 }), "unsupported-version"],
    [
      "a missing field",
      wrap({ ...mockInputs, annualStatements: [{ taxableWage: undefined, wageTaxWithheld: 0 }] }),
      "invalid-inputs",
    ],
    [
      "a string number",
      wrap({ ...mockInputs, annualStatements: [{ taxableWage: "60000", wageTaxWithheld: 0 }] }),
      "invalid-inputs",
    ],
    [
      "a negative number",
      wrap({ ...mockInputs, annualStatements: [{ taxableWage: -1, wageTaxWithheld: 0 }] }),
      "invalid-inputs",
    ],
    ["an unknown field", wrap({ ...mockInputs, extra: 1 }), "invalid-inputs"],
    ["an unsupported year", wrap({ ...mockInputs, year: 1999 }), "invalid-inputs"],
    ["a null payload", wrap(null), "invalid-inputs"],
  ])("rejects %s", (_name, text, error) => {
    expect(parseInputFile(text)).toEqual({ ok: false, error });
  });

  it("leaves the single-value fields out of an exported file", () => {
    const file = serializeInputFile(mockInputs);
    if (!file.ok) throw new Error("export failed");
    const exported = JSON.parse(file.json).inputs;
    for (const field of [
      "residentCountry",
      "civilStatus",
      "belgianRegion",
      "thirtyPercentRuling",
    ]) {
      expect(exported).not.toHaveProperty(field);
    }
  });

  it("round-trips several annual statements and split sick days", () => {
    const inputs = {
      ...mockInputs,
      annualStatements: [
        { taxableWage: 30000, wageTaxWithheld: 5000 },
        { taxableWage: 25000.5, wageTaxWithheld: 4000 },
      ],
      sickDaysNL: 4,
      sickDaysOutsideNL: 2,
    };
    const file = serializeInputFile(inputs);
    if (!file.ok) throw new Error("export failed");
    const result = parseInputFile(file.json);
    if (!result.ok) throw new Error(result.error);
    expect(result.inputs).toEqual(parseStrictTaxInputs(inputs));
  });

  describe("schema version 1 files", () => {
    const v1Inputs = {
      year: 2024,
      residentCountry: "BE",
      civilStatus: "single",
      dependentChildren: 1,
      belowAOWAge: true,
      belgianRegion: "flemish",
      communalTaxRate: 7.5,
      grossSalary: 58000,
      daysWorkedNL: 190,
      daysWorkedBE: 25,
      daysWorkedOther: 2,
      thirtyPercentRuling: false,
      socialContributions: 1500,
      aanvullendPensioen: 800,
      dienstencheques: 300,
      roerendeVoorheffing: 40,
      withheldTaxNL: 11000,
      sickDays: 6,
      mortgageEnabled: true,
      mortgageInterest: 7000,
    };
    const v1File = (inputs: unknown) => wrap(inputs, { schemaVersion: 1, appVersion: "2026.10.1" });

    it("are migrated to the version 2 names on import", () => {
      const result = parseInputFile(v1File(v1Inputs));
      if (!result.ok) throw new Error(result.error);
      expect(result).toMatchObject({ year: 2024, appVersion: "2026.10.1" });
      expect(result.inputs).toMatchObject({
        annualStatements: [{ taxableWage: 58000, wageTaxWithheld: 11000 }],
        sickDaysNL: 6,
        sickDaysOutsideNL: 0,
        healthInsurancePremium: 1500,
        supplementaryPension: 800,
        serviceVouchers: 300,
        reclaimableWithholdingTax: 40,
        mortgageInterest: 7000,
        mortgageOwnershipShare: 100,
      });
      for (const field of ["grossSalary", "withheldTaxNL", "sickDays", "socialContributions"]) {
        expect(result.inputs).not.toHaveProperty(field);
      }
    });

    it("still reject invalid values after migration", () => {
      expect(parseInputFile(v1File({ ...v1Inputs, grossSalary: -1 }))).toEqual({
        ok: false,
        error: "invalid-inputs",
      });
      expect(parseInputFile(v1File({ ...v1Inputs, surprise: 1 }))).toEqual({
        ok: false,
        error: "invalid-inputs",
      });
    });

    it("are not accepted with version 2 names left out under a version 2 header", () => {
      expect(parseInputFile(wrap(v1Inputs))).toEqual({ ok: false, error: "invalid-inputs" });
    });
  });

  it("rejects oversized files before parsing", () => {
    expect(parseInputFile(" ".repeat(INPUT_FILE_MAX_BYTES + 1))).toEqual({
      ok: false,
      error: "too-large",
    });
  });

  it("does not let prototype keys through", () => {
    const text = `{"format":"${INPUT_FILE_FORMAT}","schemaVersion":1,"inputs":{"__proto__":{"x":1}}}`;
    expect(parseInputFile(text).ok).toBe(false);
  });

  describe("Dutch assessment figures", () => {
    const assessment = { assessmentIncomeTaxDue: 2713.34, assessmentPremiumsDue: 5874.66 };

    it("keeps absent figures absent so files without them stay valid", () => {
      const file = serializeInputFile(mockInputs);
      if (!file.ok) throw new Error("export failed");
      const exported = JSON.parse(file.json).inputs;
      expect(exported).not.toHaveProperty("assessmentIncomeTaxDue");
      expect(exported).not.toHaveProperty("assessmentPremiumsDue");
      const result = parseInputFile(file.json);
      if (!result.ok) throw new Error(result.error);
      expect(result.inputs).not.toHaveProperty("assessmentIncomeTaxDue");
    });

    it("round-trips both figures at schema version 2", () => {
      const file = serializeInputFile({ ...mockInputs, ...assessment });
      if (!file.ok) throw new Error("export failed");
      expect(JSON.parse(file.json).schemaVersion).toBe(2);
      const result = parseInputFile(file.json);
      if (!result.ok) throw new Error(result.error);
      expect(result.inputs).toMatchObject(assessment);
    });

    it("exports without a lone figure and rejects a file that contains one", () => {
      const file = serializeInputFile({ ...mockInputs, assessmentIncomeTaxDue: 100 });
      if (!file.ok) throw new Error("export failed");
      expect(JSON.parse(file.json).inputs).not.toHaveProperty("assessmentIncomeTaxDue");
      expect(parseInputFile(wrap({ ...mockInputs, assessmentIncomeTaxDue: 100 }))).toEqual({
        ok: false,
        error: "invalid-inputs",
      });
    });
  });
});
