import { z } from "zod";
import { isThirtyPercentRulingSupportedResident, type TaxYear } from "./constants";
import { findV1Fields, INPUT_SCHEMA_VERSION, V1_FIELD_RENAMES, V1_RENAME_SUMMARY } from "./migrations";
import { TAX_PARAMS } from "./params";
import {
  AnnualStatementFields,
  BELGIAN_CODES,
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

const DOCUMENT = {
  profile: "Profile",
  annualTaxStatement: "Annual tax statement (jaaropgave)",
  workdayRecord: "Workday record or cross-border workday statement",
  healthInsurer: "Health insurer's annual statement",
  pensionOrPayslip: "December payslip or pension statement",
  serviceVoucherStatement: "Service-voucher annual statement",
  bank: "Bank's annual tax statement",
  dutchAssessment: "Dutch assessment (aanslag)",
  home: "Home and mortgage",
} as const satisfies Record<keyof typeof INPUT_GROUPS, string>;

const code = (field: keyof typeof BELGIAN_CODES) => `Belgian code ${BELGIAN_CODES[field]}`;

/** One annual tax statement; the engine sums them. */
export const StrictAnnualStatementSchema = z.strictObject({
  taxableWage: AnnualStatementFields.taxableWage
    .nonnegative()
    .describe(
      "EUR per year: Taxable wage (Loon, fiscaal loon) on this annual tax statement. Not the gross salary.",
    ),
  wageTaxWithheld: AnnualStatementFields.wageTaxWithheld
    .nonnegative()
    .describe(
      "EUR per year: Dutch wage tax withheld (loonheffing) on this statement. Only used for the settlement against the Dutch charge.",
    ),
});

/**
 * Core fields are required except those with a single legal value (`residentCountry`,
 * `civilStatus`, `belgianRegion`, `thirtyPercentRuling`), which default. The mortgage scenario has
 * defaults, and the Dutch assessment figures are optional (both or neither).
 */
export const StrictTaxInputSchema = z
  .strictObject({
    year: fields.year.describe(`${DOCUMENT.profile}: income year.`),
    dependentChildren: fields.dependentChildren
      .min(0)
      .max(10)
      .describe(`${DOCUMENT.profile}: dependent children.`),
    belowAOWAge: fields.belowAOWAge.describe(
      `${DOCUMENT.profile}: below the Dutch AOW pension age.`,
    ),
    communalTaxRate: fields.communalTaxRate
      .min(0)
      .max(15)
      .describe(`${DOCUMENT.profile}: Belgian municipal tax rate in percent.`),
    residentCountry: fields.residentCountry
      .describe(`${DOCUMENT.profile}: country of residence; only BE is supported.`)
      .default(SINGLE_VALUE_DEFAULTS.residentCountry),
    civilStatus: fields.civilStatus
      .describe(`${DOCUMENT.profile}: civil status; only single is supported.`)
      .default(SINGLE_VALUE_DEFAULTS.civilStatus),
    belgianRegion: fields.belgianRegion
      .describe(`${DOCUMENT.profile}: Belgian region; only flemish is supported.`)
      .default(SINGLE_VALUE_DEFAULTS.belgianRegion),
    thirtyPercentRuling: fields.thirtyPercentRuling
      .describe(`${DOCUMENT.profile}: Dutch 30% ruling; must be false for Belgian residents.`)
      .default(SINGLE_VALUE_DEFAULTS.thirtyPercentRuling),
    annualStatements: z
      .array(StrictAnnualStatementSchema)
      .min(1)
      .max(MAX_ANNUAL_STATEMENTS)
      .describe(
        `${DOCUMENT.annualTaxStatement}: one entry per statement for the income year (job change, agency and direct employment), at least one. The wages are summed; the heffingskortingen and premiums are computed on the total.`,
      ),
    daysWorkedNL: fields.daysWorkedNL
      .nonnegative()
      .describe(`${DOCUMENT.workdayRecord}: days worked in the Netherlands.`),
    daysWorkedBE: fields.daysWorkedBE
      .nonnegative()
      .describe(`${DOCUMENT.workdayRecord}: days worked in Belgium, home working included.`),
    daysWorkedOther: fields.daysWorkedOther
      .nonnegative()
      .describe(`${DOCUMENT.workdayRecord}: days worked in a third country.`),
    sickDaysNL: fields.sickDaysNL
      .nonnegative()
      .describe(
        `${DOCUMENT.workdayRecord}: sick days on days scheduled to be worked in the Netherlands. Dutch method: NL workdays. Belgian method: left out of both counts.`,
      ),
    sickDaysOutsideNL: fields.sickDaysOutsideNL
      .nonnegative()
      .describe(
        `${DOCUMENT.workdayRecord}: sick days on days scheduled to be worked in Belgium or a third country. Dutch method: days outside NL, so part of deel niet in NL belast. Belgian method: left out of both counts.`,
      ),
    healthInsurancePremium: fields.healthInsurancePremium
      .nonnegative()
      .describe(
        `${DOCUMENT.healthInsurer}: EUR per year, net Dutch basic health-insurance premium (${code("healthInsurancePremium")}).`,
      ),
    supplementaryPension: fields.supplementaryPension
      .nonnegative()
      .describe(
        `${DOCUMENT.pensionOrPayslip}: EUR per year, personal supplementary pension contributions (${code("supplementaryPension")}).`,
      ),
    serviceVouchers: fields.serviceVouchers
      .nonnegative()
      .describe(
        `${DOCUMENT.serviceVoucherStatement}: EUR per year paid for service vouchers (${code("serviceVouchers")}); reduces tax for income years up to 2024 only.`,
      ),
    reclaimableWithholdingTax: fields.reclaimableWithholdingTax
      .nonnegative()
      .describe(
        `${DOCUMENT.bank}: EUR per year, reclaimable Belgian withholding tax on eligible dividends (${code("reclaimableWithholdingTax")}). Not the Dutch wage tax.`,
      ),
    assessmentIncomeTaxDue: fields.assessmentIncomeTaxDue
      .nonnegative()
      .optional()
      .describe(
        `${DOCUMENT.dutchAssessment}: EUR per year, income tax due after the heffingskortingen. Give together with assessmentPremiumsDue to replace the estimate in the Belgian calculation (code 1250, O.1/O.2), total tax and net income.`,
      ),
    assessmentPremiumsDue: fields.assessmentPremiumsDue
      .nonnegative()
      .optional()
      .describe(
        `${DOCUMENT.dutchAssessment}: EUR per year, premies volksverzekeringen due after the heffingskortingen. Give together with assessmentIncomeTaxDue.`,
      ),
    mortgageEnabled: fields.mortgageEnabled
      .describe(`${DOCUMENT.home}: estimate the mortgage interest deduction.`)
      .default(false),
    mortgageHomeValue: fields.mortgageHomeValue
      .nonnegative()
      .optional()
      .describe(
        `${DOCUMENT.home}: EUR, whole-home market value at 1 January of the preceding year.`,
      ),
    mortgageInterest: fields.mortgageInterest
      .nonnegative()
      .optional()
      .describe(`${DOCUMENT.home}: EUR per year, interest on the whole qualifying loan.`),
    mortgageOwnershipShare: fields.mortgageOwnershipShare
      .min(0)
      .max(100)
      .optional()
      .describe(`${DOCUMENT.home}: ownership share in percent.`),
    incomeOutsideNL: fields.incomeOutsideNL
      .nonnegative()
      .optional()
      .describe(
        `${DOCUMENT.home}: EUR per year, worldwide income not taxed in NL (partner included).`,
      ),
  })
  .superRefine((inputs, ctx) => {
    const issue = (field: keyof typeof inputs, message: string) =>
      ctx.addIssue({ code: "custom", path: [field], message: `${field}: ${message}` });
    const maxDays = getMaxDaysInYear(inputs.year);
    if (getWorkdayTotals(inputs).totalWithSick > maxDays) {
      for (const field of INPUT_GROUPS.workdayRecord) {
        issue(field, `combined workdays and sick days must not exceed ${maxDays} in ${inputs.year}`);
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
    ...found.map(
      (field): z.core.$ZodIssue => ({
        code: "custom",
        input: undefined,
        path: [...path, field],
        message: `${prefix}${field}: renamed in input schema version ${INPUT_SCHEMA_VERSION}; use ${V1_FIELD_RENAMES[field]}`,
      }),
    ),
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
