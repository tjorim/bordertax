// @vitest-environment node
import { version } from "../../package.json";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { calculateTax, compareTax, createServer, inputSchema } from "../../mcp/server";
import { calculate } from "../../src/tax/index";
import { DEFAULT_INPUTS } from "../../src/tax/defaults";
import { parseStrictTaxInputs, StrictTaxInputSchema } from "../../src/tax/strict";
import { getCapabilities } from "../../src/tax/capabilities";
import { compareScenarios } from "../../src/tax/compare";

const mortgage = {
  ...DEFAULT_INPUTS,
  mortgageEnabled: true,
  mortgageInterest: 8000,
  incomeOutsideNL: 0,
};
describe("MCP tax adapter", () => {
  it.each([DEFAULT_INPUTS, { ...DEFAULT_INPUTS, year: 2020 }, mortgage])(
    "matches the engine for $year",
    (input) => {
      const response = calculateTax(input);
      const inputs = parseStrictTaxInputs(input);
      expect(response.isError).not.toBe(true);
      expect(response.structuredContent).toEqual({
        inputs,
        result: calculate(inputs),
        caveat: expect.stringContaining("not tax advice"),
      });
      expect(JSON.parse((response.content[0] as { text: string }).text)).toEqual(
        response.structuredContent,
      );
    },
  );
  it("derives every advertised field from the strict schema", () => {
    expect(Object.keys(inputSchema.shape)).toEqual(Object.keys(StrictTaxInputSchema.in.shape));
  });
  it.each([
    [{}, "grossSalary"],
    [{ ...DEFAULT_INPUTS, grossSalary: -1 }, "grossSalary"],
    [{ ...DEFAULT_INPUTS, grossSalary: NaN }, "grossSalary"],
    [{ ...DEFAULT_INPUTS, grossSalary: Infinity }, "grossSalary"],
    [{ ...DEFAULT_INPUTS, year: 2027 }, "year"],
    [{ ...DEFAULT_INPUTS, residentCountry: "NL" }, "residentCountry"],
    [{ ...DEFAULT_INPUTS, daysWorkedNL: 400 }, "daysWorkedNL"],
    [{ ...DEFAULT_INPUTS, surprise: true }, "surprise"],
  ])("rejects invalid inputs with field messages", (input, field) => {
    const response = calculateTax(input);
    expect(response.isError).toBe(true);
    expect(JSON.stringify(response.content)).toContain(field);
  });
  it("accepts the Dutch assessment figures together and reports the source", () => {
    const assessed = {
      ...DEFAULT_INPUTS,
      assessmentIncomeTaxDue: 3000,
      assessmentPremiumsDue: 5000,
    };
    const response = calculateTax(assessed);
    expect(response.isError).not.toBe(true);
    const { result } = response.structuredContent as {
      result: ReturnType<typeof calculate>;
    };
    expect(result.nlCharge.source).toBe("assessment");
    expect(result.nlCharge.netTaxNL).toBe(8000);
    expect(result.nl.netTaxNL).toBe(calculate(parseStrictTaxInputs(DEFAULT_INPUTS)).nl.netTaxNL);
    const lone = calculateTax({ ...DEFAULT_INPUTS, assessmentIncomeTaxDue: 3000 });
    expect(lone.isError).toBe(true);
    expect(JSON.stringify(lone.content)).toContain("assessmentPremiumsDue");
    expect(inputSchema.shape.assessmentIncomeTaxDue.description).toContain("Dutch assessment");
    expect(
      compareTax({ base: DEFAULT_INPUTS, overrides: { assessmentIncomeTaxDue: 3000 } }).isError,
    ).toBe(true);
    expect(
      compareTax({ base: assessed, overrides: { assessmentIncomeTaxDue: 3100 } }).isError,
    ).not.toBe(true);
  });
  it("compares effective scenarios with shared attribution", () => {
    const overrides = { grossSalary: 70000, daysWorkedBE: 10, daysWorkedNL: 210 };
    const base = parseStrictTaxInputs(mortgage);
    const alternative = parseStrictTaxInputs({ ...base, ...overrides });
    expect(compareTax({ base: mortgage, overrides }).structuredContent).toEqual({
      inputs: { base, alternative },
      ...compareScenarios(base, alternative),
      caveat: expect.any(String),
    });
    expect(compareTax({ base: DEFAULT_INPUTS, overrides: { grossSalary: -1 } }).isError).toBe(true);
    expect(compareTax({ base: DEFAULT_INPUTS, overrides: { unknown: 1 } }).isError).toBe(true);
  });
  it("returns numeric bracket bounds without a locale-formatted label", () => {
    const response = calculateTax({ ...DEFAULT_INPUTS, grossSalary: 120000 });
    const json = JSON.parse((response.content[0] as { text: string }).text) as {
      result: { nl: { brackets: Record<string, unknown>[] } };
    };
    const { brackets } = json.result.nl;
    expect(brackets.length).toBeGreaterThan(1);
    for (const bracket of brackets) {
      expect(bracket).not.toHaveProperty("label");
      expect(typeof bracket.from).toBe("number");
    }
    expect(brackets[0]!.to).toEqual(expect.any(Number));
    // The open top bracket is an explicit null (JSON has no Infinity).
    expect(brackets.at(-1)!.to).toBeNull();
  });
  it("returns the Belgian figures in cents and reports unused federal reductions", () => {
    const response = calculateTax({ ...DEFAULT_INPUTS, roerendeVoorheffing: 50000 });
    const { result } = response.structuredContent as { result: ReturnType<typeof calculate> };
    const be = result.be!;
    expect(be.netTaxBE).toBe(Math.round(be.netTaxBE * 100) / 100);
    expect(be.saldoFederaal).toBe(0);
    expect(be.federalReductionsUnused).toBeGreaterThan(0);
    expect(result.noWorkdays).toBe(false);
  });
  it("flags a calculation without workdays and keeps the strict schema accepting it", () => {
    const response = calculateTax({
      ...DEFAULT_INPUTS,
      daysWorkedNL: 0,
      daysWorkedBE: 0,
      daysWorkedOther: 0,
      sickDays: 0,
    });
    expect(response.isError).not.toBe(true);
    const { result } = response.structuredContent as { result: ReturnType<typeof calculate> };
    expect(result.noWorkdays).toBe(true);
    expect(result.nl.netTaxNL).toBe(0);
  });
  it("discovers capabilities and returns validation errors through the SDK", async () => {
    const server = createServer();
    const client = new Client({ name: "test", version: "1" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    try {
      await server.connect(serverTransport);
      await client.connect(clientTransport);
      expect(client.getServerVersion()?.version).toBe(version);
      const tools = (await client.listTools()).tools;
      expect(tools.map((tool) => tool.name)).toEqual([
        "get_capabilities",
        "calculate_tax",
        "compare_scenarios",
      ]);
      for (const tool of tools)
        expect(tool.annotations).toMatchObject({
          readOnlyHint: true,
          idempotentHint: true,
          openWorldHint: false,
        });
      expect(
        (await client.callTool({ name: "get_capabilities", arguments: {} })).structuredContent,
      ).toEqual(getCapabilities());
      expect(
        (
          await client.callTool({
            name: "compare_scenarios",
            arguments: { base: mortgage, overrides: {} },
          })
        ).structuredContent,
      ).toEqual(compareTax({ base: mortgage, overrides: {} }).structuredContent);
      for (const input of [
        {},
        { ...DEFAULT_INPUTS, year: 2027 },
        { ...DEFAULT_INPUTS, grossSalary: -1 },
      ]) {
        const result = await client.callTool({ name: "calculate_tax", arguments: input });
        expect(result.isError).toBe(true);
        expect(JSON.stringify(result.content)).toMatch(/grossSalary|year/);
      }
    } finally {
      await client.close();
      await server.close();
    }
  });
});

const bundle = resolve("dist-mcp/server.mjs");
it.skipIf(!existsSync(bundle))(
  "built stdio server lists tools and calculates (run pnpm mcp:build first; required in CI)",
  async () => {
    const client = new Client({ name: "stdio-test", version: "1" });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [bundle],
      stderr: "pipe",
    });
    let stderr = "";
    transport.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });
    try {
      await client.connect(transport);
      expect(client.getServerVersion()?.version).toBe(version);
      expect((await client.listTools()).tools).toHaveLength(3);
      const result = await client.callTool({ name: "calculate_tax", arguments: DEFAULT_INPUTS });
      expect(result.isError).not.toBe(true);
      expect(result.structuredContent).toEqual(calculateTax(DEFAULT_INPUTS).structuredContent);
      expect(stderr).toBe("");
    } finally {
      await client.close();
    }
  },
  10000,
);
