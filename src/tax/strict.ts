import { z } from "zod";
import { isThirtyPercentRulingSupportedResident, type TaxYear } from "./constants";
import { TAX_PARAMS } from "./params";
import { TaxInputFields } from "./schema";
import { getMaxDaysInYear, getWorkdayTotals } from "./workdays";

/** The form supports at most ten children, even where parameters allow extrapolation. */
export function getMaxDependentChildren(year: TaxYear): number {
  const params = TAX_PARAMS[year].be;
  return params.extraPerChildAbove4 === null ? params.childExtraAmounts.length - 1 : 10;
}

const fields = TaxInputFields;

/**
 * All core fields are required. Only the mortgage scenario has defaults, and the Dutch
 * assessment figures are optional (both or neither).
 */
export const StrictTaxInputSchema = z
  .strictObject({
    ...fields,
    dependentChildren: fields.dependentChildren.min(0).max(10),
    communalTaxRate: fields.communalTaxRate.min(0).max(15),
    grossSalary: fields.grossSalary.nonnegative(),
    daysWorkedNL: fields.daysWorkedNL.nonnegative(),
    daysWorkedBE: fields.daysWorkedBE.nonnegative(),
    daysWorkedOther: fields.daysWorkedOther.nonnegative(),
    socialContributions: fields.socialContributions.nonnegative(),
    aanvullendPensioen: fields.aanvullendPensioen.nonnegative(),
    dienstencheques: fields.dienstencheques.nonnegative(),
    roerendeVoorheffing: fields.roerendeVoorheffing.nonnegative(),
    withheldTaxNL: fields.withheldTaxNL.nonnegative(),
    sickDays: fields.sickDays.nonnegative(),
    mortgageEnabled: fields.mortgageEnabled.default(false),
    mortgageHomeValue: fields.mortgageHomeValue.nonnegative().optional(),
    mortgageInterest: fields.mortgageInterest.nonnegative().optional(),
    mortgageOwnershipShare: fields.mortgageOwnershipShare.min(0).max(100).optional(),
    incomeOutsideNL: fields.incomeOutsideNL.nonnegative().optional(),
    assessmentIncomeTaxDue: fields.assessmentIncomeTaxDue
      .nonnegative()
      .optional()
      .describe(
        "EUR per year: income tax due on the Dutch assessment, after the heffingskortingen. Give together with assessmentPremiumsDue to replace the estimate in the Belgian calculation (code 1250, O.1/O.2), total tax and net income.",
      ),
    assessmentPremiumsDue: fields.assessmentPremiumsDue
      .nonnegative()
      .optional()
      .describe(
        "EUR per year: premies volksverzekeringen due on the Dutch assessment, after the heffingskortingen. Give together with assessmentIncomeTaxDue.",
      ),
  })
  .superRefine((inputs, ctx) => {
    const issue = (field: keyof typeof inputs, message: string) =>
      ctx.addIssue({ code: "custom", path: [field], message: `${field}: ${message}` });
    const maxDays = getMaxDaysInYear(inputs.year);
    if (getWorkdayTotals(inputs).totalWithSick > maxDays) {
      for (const field of [
        "daysWorkedNL",
        "daysWorkedBE",
        "daysWorkedOther",
        "sickDays",
      ] as const) {
        issue(field, `combined workdays and sickDays must not exceed ${maxDays} in ${inputs.year}`);
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

/** Parse untrusted input and return the effective inputs callers can echo. Errors include field paths. */
export function parseStrictTaxInputs(input: unknown): z.output<typeof StrictTaxInputSchema> {
  return StrictTaxInputSchema.parse(input, {
    error: (issue) => {
      const field = issue.path?.join(".") || "input";
      switch (issue.code) {
        case "invalid_type":
          return `${field}: required ${issue.expected}; provide a finite number for numeric inputs`;
        case "too_small":
          return `${field}: must be at least ${issue.minimum}`;
        case "too_big":
          return `${field}: must be at most ${issue.maximum}`;
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
