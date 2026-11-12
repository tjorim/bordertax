import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { version } from "../package.json";
import { calculate } from "../src/tax/index";
import { getCapabilities } from "../src/tax/capabilities";
import { compareScenarios } from "../src/tax/compare";
import { INPUT_SCHEMA_VERSION } from "../src/tax/migrations";
import { assertNoV1Fields, parseStrictTaxInputs, StrictTaxInputSchema } from "../src/tax/strict";

const caveat = "Simplified estimate, not tax advice. Consult a qualified tax adviser.";
const units =
  "Money is EUR per year; communalTaxRate is percent; result rates/shares are fractions unless capability metadata states otherwise; workdays are day counts.";
const schemaNote = `Input schema version ${INPUT_SCHEMA_VERSION}: inputs are grouped by source document (annual tax statements, workday record, health insurer, pension or payslip, service vouchers, bank, Dutch assessment); residentCountry, civilStatus, belgianRegion and thirtyPercentRuling are optional with defaults; version 1 field names are rejected with the rename map (see get_capabilities.inputSchema).`;
const annotations = { readOnlyHint: true, idempotentHint: true, openWorldHint: false };
// Derive discovery and overrides from the strict boundary, including future optional fields.
export const inputSchema = StrictTaxInputSchema.in;
const overridesSchema = z.strictObject(
  Object.fromEntries(
    Object.entries(inputSchema.shape).map(([key, field]) => [
      key,
      (field instanceof z.ZodDefault ? field.removeDefault() : field).optional(),
    ]),
  ),
);
const compareSchema = z.strictObject({ base: inputSchema, overrides: overridesSchema });
const object = z.record(z.string(), z.unknown());

function response(data: Record<string, unknown>): CallToolResult {
  return { structuredContent: data, content: [{ type: "text", text: JSON.stringify(data) }] };
}
function guarded(run: () => Record<string, unknown>): CallToolResult {
  try {
    return response(run());
  } catch (error) {
    // Never echo arbitrary errors or input values into logs or responses.
    const errors =
      error instanceof z.ZodError
        ? error.issues.map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`)
        : ["Calculation failed; check the supported inputs with get_capabilities."];
    return { ...response({ errors }), isError: true };
  }
}
export function calculateTax(input: unknown): CallToolResult {
  return guarded(() => {
    const inputs = parseStrictTaxInputs(input);
    return { inputs, result: calculate(inputs), caveat };
  });
}
export function compareTax(input: unknown): CallToolResult {
  return guarded(() => {
    // Name version 1 fields before the strict checks would only call them unsupported.
    if (typeof input === "object" && input !== null) {
      const { base, overrides } = input as Record<string, unknown>;
      assertNoV1Fields(base, ["base"]);
      assertNoV1Fields(overrides, ["overrides"]);
    }
    // Validate overrides separately without materialising defaults before merging.
    const envelope = z.strictObject({ base: z.unknown(), overrides: overridesSchema }).parse(input);
    const base = parseStrictTaxInputs(envelope.base);
    const alternative = parseStrictTaxInputs({ ...base, ...envelope.overrides });
    return { inputs: { base, alternative }, ...compareScenarios(base, alternative), caveat };
  });
}
export function createServer(): McpServer {
  const server = new McpServer({ name: "bordertax-mcp-server", version });
  server.registerTool(
    "get_capabilities",
    {
      description: `Discover the input schema version, supported years, profiles, required fields, defaults, source documents, units and limitations. ${units}`,
      inputSchema: z.strictObject({}),
      outputSchema: z.looseObject({}),
      annotations,
    },
    () => response(getCapabilities()),
  );
  server.registerTool(
    "calculate_tax",
    {
      description: `Calculate a strict cross-border tax estimate with effective inputs and full breakdown, including mortgage eligibility and effects. Optionally pass assessmentIncomeTaxDue and assessmentPremiumsDue together from the actual Dutch assessment: they replace the estimated Dutch charge in the Belgian figures and totals, and result.nlCharge reports the source and the difference from the estimate. Belgian money figures are rounded to cents (no tax-rounding rule is claimed); result.nl.brackets carry numeric from/to bounds (to is null for the open top bracket) and no label; result.noWorkdays flags zero workdays, where the Dutch and Belgian figures are zero; result.be.federalReductionsUnused is the part of the pension and withholding-tax reductions above the federal tax. ${schemaNote} ${units}`,
      inputSchema,
      outputSchema: z.object({ inputs: object, result: object, caveat: z.string() }),
      annotations,
    },
    (input) => calculateTax(input),
  );
  server.registerTool(
    "compare_scenarios",
    {
      description: `Compare base inputs with a partial overrides object; returns both results, b-minus-a deltas, changed groups and Shapley attribution. An annualStatements override replaces the whole list. ${schemaNote} ${units}`,
      inputSchema: compareSchema,
      outputSchema: z.object({
        inputs: object,
        a: object,
        b: object,
        delta: object,
        changed: z.array(z.string()),
        attribution: object,
        caveat: z.string(),
      }),
      annotations,
    },
    (input) => compareTax(input),
  );
  return server;
}

// Importing the adapter for tests never starts a transport.
if (import.meta.main) {
  await createServer().connect(new StdioServerTransport());
}
