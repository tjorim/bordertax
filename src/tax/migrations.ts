/**
 * Input schema versions and the migration from version 1.
 *
 * Version 2 renamed the input fields to what they are, in English, moved the wage and the Dutch
 * wage tax into a list of annual statements and split sick days by scheduled country. The MCP
 * tools reject version 1 names with the rename map; an input file saved with version 1 is
 * migrated on import.
 */

/** Version of the `calculate_tax` input shape, reported by `get_capabilities`. */
export const INPUT_SCHEMA_VERSION = 2;

/** Version 1 field → where its value lives in version 2. */
export const V1_FIELD_RENAMES = {
  grossSalary: "annualStatements[].taxableWage",
  withheldTaxNL: "annualStatements[].wageTaxWithheld",
  sickDays: "sickDaysNL (with sickDaysOutsideNL: 0)",
  socialContributions: "healthInsurancePremium",
  aanvullendPensioen: "supplementaryPension",
  dienstencheques: "serviceVouchers",
  roerendeVoorheffing: "reclaimableWithholdingTax",
} as const;

export type V1Field = keyof typeof V1_FIELD_RENAMES;

/** Result fields renamed in version 2 (paths in the `calculate_tax` and `compare_scenarios` output). */
export const V1_RESULT_RENAMES = {
  "result.grossIncome": "result.taxableWage",
  "delta.grossIncome": "delta.taxableWage",
  "result.be.socialContributionsDeducted": "result.be.healthInsurancePremiumDeducted",
} as const;

const V1_FIELDS = Object.keys(V1_FIELD_RENAMES) as V1Field[];

/** The renames as one line, for error messages. */
export const V1_RENAME_SUMMARY = V1_FIELDS.map((field) => `${field} → ${V1_FIELD_RENAMES[field]}`).join(
  "; ",
);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The version 1 field names present in an input object, in rename-map order. */
export function findV1Fields(input: unknown): V1Field[] {
  if (!isRecord(input)) return [];
  return V1_FIELDS.filter((field) => Object.hasOwn(input, field));
}

const SIMPLE_RENAMES = {
  socialContributions: "healthInsurancePremium",
  aanvullendPensioen: "supplementaryPension",
  dienstencheques: "serviceVouchers",
  roerendeVoorheffing: "reclaimableWithholdingTax",
} as const;

/**
 * Rewrites a version 1 input object in version 2 names. Values are carried over unchanged, so the
 * strict schema still validates them; fields the migration does not know are left alone.
 * `grossSalary` and `withheldTaxNL` become a single annual statement, `sickDays` become sick days
 * scheduled in the Netherlands (version 1 treated every sick day that way).
 */
export function migrateV1Inputs(input: unknown): unknown {
  if (!isRecord(input)) return input;
  const { grossSalary, withheldTaxNL, sickDays, ...rest } = input;
  const migrated: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) {
    const renamed = (SIMPLE_RENAMES as Record<string, string>)[key];
    migrated[renamed ?? key] = value;
  }
  if (grossSalary !== undefined || withheldTaxNL !== undefined) {
    migrated.annualStatements = [{ taxableWage: grossSalary, wageTaxWithheld: withheldTaxNL }];
  }
  if (sickDays !== undefined) {
    migrated.sickDaysNL = sickDays;
    migrated.sickDaysOutsideNL = 0;
  }
  return migrated;
}
