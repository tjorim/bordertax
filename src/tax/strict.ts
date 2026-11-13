import { z } from "zod";
import { isThirtyPercentRulingSupportedResident, type TaxYear } from "./constants";
import {
  findV1Fields,
  INPUT_SCHEMA_VERSION,
  V1_FIELD_RENAMES,
  V1_RENAME_SUMMARY,
} from "./migrations";
import { TAX_PARAMS } from "./params";
import {
  AnnualStatementFields,
  INPUT_GROUPS,
  MAX_ANNUAL_STATEMENTS,
  SINGLE_VALUE_DEFAULTS,
  TaxInputFields,
} from "./schema";
import { getMaxDaysInYear, getWorkdayTotals } from "./workdays";

/** The form supports at most ten children, even where parameters allow extrapolation. */
export function getMaxDependentChildren(year: TaxYear): number {
  const params = TAX_PARAMS[year].be;
  return params.extraPerChildAbove4 === null ? params.childExtraAmounts.length - 1 : 10;
}

const fields = TaxInputFields;

/** One annual tax statement; the engine sums them. */
export const StrictAnnualStatementSchema = z.strictObject({
  taxableWage: AnnualStatementFields.taxableWage.nonnegative(),
  wageTaxWithheld: AnnualStatementFields.wageTaxWithheld.nonnegative(),
});

/**
 * Core fields are required except those with a single legal value (`residentCountry`,
 * `civilStatus`, `belgianRegion`, `thirtyPercentRuling`), which default. The mortgage scenario has
 * defaults, and the Dutch assessment figures are optional (both or neither).
 */
export const StrictTaxInputSchema = z
  .strictObject({
    year: fields.year,
    dependentChildren: fields.dependentChildren.min(0).max(10),
    belowAOWAge: fields.belowAOWAge,
    communalTaxRate: fields.communalTaxRate.min(0).max(15),
    residentCountry: fields.residentCountry.default(SINGLE_VALUE_DEFAULTS.residentCountry),
    civilStatus: fields.civilStatus.default(SINGLE_VALUE_DEFAULTS.civilStatus),
    belgianRegion: fields.belgianRegion.default(SINGLE_VALUE_DEFAULTS.belgianRegion),
    thirtyPercentRuling: fields.thirtyPercentRuling.default(
      SINGLE_VALUE_DEFAULTS.thirtyPercentRuling,
    ),
    annualStatements: z.array(StrictAnnualStatementSchema).min(1).max(MAX_ANNUAL_STATEMENTS),
    daysWorkedNL: fields.daysWorkedNL.nonnegative(),
    daysWorkedBE: fields.daysWorkedBE.nonnegative(),
    daysWorkedOther: fields.daysWorkedOther.nonnegative(),
    sickDaysNL: fields.sickDaysNL.nonnegative(),
    sickDaysOutsideNL: fields.sickDaysOutsideNL.nonnegative(),
    healthInsurancePremium: fields.healthInsurancePremium.nonnegative(),
    supplementaryPension: fields.supplementaryPension.nonnegative(),
    exchangedGrossWage: fields.exchangedGrossWage.nonnegative().default(0),
    commutingAllowance: fields.commutingAllowance.nonnegative().default(0),
    serviceVouchers: fields.serviceVouchers.nonnegative(),
    reclaimableWithholdingTax: fields.reclaimableWithholdingTax.nonnegative(),
    assessmentIncomeTaxDue: fields.assessmentIncomeTaxDue.nonnegative().optional(),
    assessmentPremiumsDue: fields.assessmentPremiumsDue.nonnegative().optional(),
    mortgageEnabled: fields.mortgageEnabled.default(false),
    mortgageHomeValue: fields.mortgageHomeValue.nonnegative().optional(),
    mortgageInterest: fields.mortgageInterest.nonnegative().optional(),
    mortgageOwnershipShare: fields.mortgageOwnershipShare.min(0).max(100).optional(),
    incomeOutsideNL: fields.incomeOutsideNL.nonnegative().optional(),
  })
  .superRefine((inputs, ctx) => {
    const issue = (field: keyof typeof inputs, message: string) =>
      ctx.addIssue({ code: "custom", path: [field], message: `${field}: ${message}` });
    const maxDays = getMaxDaysInYear(inputs.year);
    if (getWorkdayTotals(inputs).totalWithSick > maxDays) {
      for (const field of INPUT_GROUPS.workdayRecord) {
        issue(
          field,
          `combined workdays and sick days must not exceed ${maxDays} in ${inputs.year}`,
        );
      }
    }
    const maxChildren = getMaxDependentChildren(inputs.year);
    if (inputs.dependentChildren > maxChildren) {
      issue("dependentChildren", `at most ${maxChildren} supported for year ${inputs.year}`);
    }
    if (
      inputs.thirtyPercentRuling &&
      !isThirtyPercentRulingSupportedResident(inputs.residentCountry)
    ) {
      issue("thirtyPercentRuling", `must be false for residentCountry ${inputs.residentCountry}`);
    }
    // The two assessment figures only make sense together: income tax or premiums alone would
    // leave the other half of the Dutch charge as an estimate inside an "assessed" total.
    if (
      (inputs.assessmentIncomeTaxDue === undefined) !==
      (inputs.assessmentPremiumsDue === undefined)
    ) {
      const missing =
        inputs.assessmentIncomeTaxDue === undefined
          ? "assessmentIncomeTaxDue"
          : "assessmentPremiumsDue";
      const given =
        missing === "assessmentIncomeTaxDue" ? "assessmentPremiumsDue" : "assessmentIncomeTaxDue";
      issue(missing, `required when ${given} is given; provide both assessment figures or neither`);
    }
    if (!inputs.mortgageEnabled) {
      for (const field of [
        "mortgageInterest",
        "mortgageOwnershipShare",
        "mortgageHomeValue",
        "incomeOutsideNL",
      ] as const) {
        if (inputs[field] !== undefined) issue(field, "requires mortgageEnabled=true");
      }
    }
  })
  .transform((inputs) =>
    inputs.mortgageEnabled
      ? {
          ...inputs,
          mortgageInterest: inputs.mortgageInterest ?? 0,
          mortgageOwnershipShare: inputs.mortgageOwnershipShare ?? 100,
        }
      : inputs,
  );

/**
 * Issues for version 1 field names, one per name found plus one listing every rename. Empty when
 * the object uses no version 1 name. `path` prefixes the issue paths (for compare overrides).
 */
export function v1FieldIssues(input: unknown, path: readonly string[] = []): z.core.$ZodIssue[] {
  const found = findV1Fields(input);
  if (found.length === 0) return [];
  const prefix = path.length > 0 ? `${path.join(".")}.` : "";
  return [
    ...found.map((field): z.core.$ZodIssue => ({
      code: "custom",
      input: undefined,
      path: [...path, field],
      message: `${prefix}${field}: renamed in input schema version ${INPUT_SCHEMA_VERSION}; use ${V1_FIELD_RENAMES[field]}`,
    })),
    {
      code: "custom",
      input: undefined,
      path: [...path],
      message: `${prefix || "input: "}input schema version ${INPUT_SCHEMA_VERSION} renamed these fields: ${V1_RENAME_SUMMARY}. See get_capabilities.inputSchema.`,
    },
  ];
}

/** Throws a validation error naming the renames when the object uses version 1 field names. */
export function assertNoV1Fields(input: unknown, path: readonly string[] = []): void {
  const issues = v1FieldIssues(input, path);
  if (issues.length > 0) throw new z.ZodError(issues);
}

/**
 * Parse untrusted input and return the effective inputs callers can echo. Errors include field
 * paths; version 1 field names are rejected with the rename map.
 */
export function parseStrictTaxInputs(input: unknown): z.output<typeof StrictTaxInputSchema> {
  assertNoV1Fields(input);
  return StrictTaxInputSchema.parse(input, {
    error: (issue) => {
      const field = issue.path?.join(".") || "input";
      switch (issue.code) {
        case "invalid_type":
          return issue.expected === "number"
            ? `${field}: required number; provide a finite number`
            : `${field}: required ${issue.expected}`;
        case "too_small":
          return issue.origin === "array"
            ? `${field}: provide at least ${issue.minimum} entry`
            : `${field}: must be at least ${issue.minimum}`;
        case "too_big":
          return issue.origin === "array"
            ? `${field}: at most ${issue.maximum} entries supported`
            : `${field}: must be at most ${issue.maximum}`;
        case "invalid_value":
          return `${field}: supported values are ${issue.values.join(", ")}`;
        case "invalid_union":
          return `${field}: provide a supported year from TAX_PARAMS`;
        case "unrecognized_keys":
          return `${field}: unsupported fields ${issue.keys.join(", ")}; remove them`;
        default:
          return `${field}: ${issue.message ?? "invalid value"}`;
      }
    },
  });
}
