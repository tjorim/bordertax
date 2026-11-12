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
    expect(serializeInputFile({ ...mockInputs, grossSalary: undefined as never }).ok).toBe(false);
    expect(serializeInputFile({ ...mockInputs, daysWorkedNL: 9999 }).ok).toBe(false);
  });

  it.each([
    ["not json", "{nope", "not-json"],
    ["a JSON array", "[]", "wrong-format"],
    ["another format", wrap(mockInputs, { format: "other" }), "wrong-format"],
    ["a newer schema", wrap(mockInputs, { schemaVersion: 2 }), "unsupported-version"],
    ["a missing field", wrap({ ...mockInputs, grossSalary: undefined }), "invalid-inputs"],
    ["a string number", wrap({ ...mockInputs, grossSalary: "60000" }), "invalid-inputs"],
    ["a negative number", wrap({ ...mockInputs, grossSalary: -1 }), "invalid-inputs"],
    ["an unknown field", wrap({ ...mockInputs, extra: 1 }), "invalid-inputs"],
    ["an unsupported year", wrap({ ...mockInputs, year: 1999 }), "invalid-inputs"],
    ["a null payload", wrap(null), "invalid-inputs"],
  ])("rejects %s", (_name, text, error) => {
    expect(parseInputFile(text)).toEqual({ ok: false, error });
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
});
