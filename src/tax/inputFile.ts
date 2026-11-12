import { z } from "zod";
import { version } from "../../package.json";
import { parseStrictTaxInputs, StrictTaxInputSchema } from "./strict";
import type { TaxInputs } from "./schema";

/** Identifies a Bordertax input file; checked before anything else is read. */
export const INPUT_FILE_FORMAT = "bordertax-inputs";
/** Bump when the file layout changes in a way older readers cannot handle. */
export const INPUT_FILE_SCHEMA_VERSION = 1;
/** Inputs are a few hundred bytes; anything much bigger is not one of our files. */
export const INPUT_FILE_MAX_BYTES = 64 * 1024;

const MORTGAGE_FIELDS = [
  "mortgageInterest",
  "mortgageHomeValue",
  "mortgageOwnershipShare",
  "incomeOutsideNL",
] as const;

export type InputFileError =
  | "too-large"
  | "not-json"
  | "wrong-format"
  | "unsupported-version"
  | "invalid-inputs";

export type InputFileResult =
  | { ok: true; inputs: TaxInputs; year: number; appVersion: string }
  | { ok: false; error: InputFileError };

/**
 * Metadata (`format`, `schemaVersion`, `appVersion`, `year`) wraps an `inputs` object that has
 * exactly the shape of the MCP `calculate_tax` input, so it can be passed to an agent as is.
 */
export function serializeInputFile(
  inputs: TaxInputs,
): { ok: true; json: string; filename: string } | { ok: false } {
  const candidate: Record<string, unknown> = { ...inputs };
  if (!inputs.mortgageEnabled) for (const field of MORTGAGE_FIELDS) delete candidate[field];
  // The strict schema needs both assessment figures or neither; the form may hold only one.
  if (
    (candidate.assessmentIncomeTaxDue === undefined) !==
    (candidate.assessmentPremiumsDue === undefined)
  ) {
    delete candidate.assessmentIncomeTaxDue;
    delete candidate.assessmentPremiumsDue;
  }
  for (const [key, value] of Object.entries(candidate)) {
    if (value === undefined) delete candidate[key];
  }
  const parsed = StrictTaxInputSchema.safeParse(candidate);
  if (!parsed.success) return { ok: false };
  const file = {
    format: INPUT_FILE_FORMAT,
    schemaVersion: INPUT_FILE_SCHEMA_VERSION,
    appVersion: version,
    year: parsed.data.year,
    inputs: candidate,
  };
  return {
    ok: true,
    json: `${JSON.stringify(file, null, 2)}\n`,
    filename: `bordertax-inputs-${parsed.data.year}.json`,
  };
}

const envelopeSchema = z.object({
  format: z.literal(INPUT_FILE_FORMAT),
  schemaVersion: z.number().int(),
  appVersion: z.string().max(40).catch(""),
  inputs: z.unknown(),
});

/** Parses untrusted file text; nothing in it is used until the strict schema accepts it. */
export function parseInputFile(text: string): InputFileResult {
  if (text.length > INPUT_FILE_MAX_BYTES) return { ok: false, error: "too-large" };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "not-json" };
  }
  const envelope = envelopeSchema.safeParse(raw);
  if (!envelope.success) return { ok: false, error: "wrong-format" };
  if (envelope.data.schemaVersion !== INPUT_FILE_SCHEMA_VERSION) {
    return { ok: false, error: "unsupported-version" };
  }
  try {
    const inputs = parseStrictTaxInputs(envelope.data.inputs);
    return { ok: true, inputs, year: inputs.year, appVersion: envelope.data.appVersion };
  } catch {
    return { ok: false, error: "invalid-inputs" };
  }
}
