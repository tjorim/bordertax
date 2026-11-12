import { z } from "zod";
import {
  VALID_BELGIAN_REGIONS,
  VALID_CIVIL_STATUSES,
  VALID_RESIDENT_COUNTRIES,
  VALID_YEARS,
} from "./constants";

const yearLiterals = VALID_YEARS.map((year) => z.literal(year)) as [
  z.ZodLiteral<(typeof VALID_YEARS)[number]>,
  z.ZodLiteral<(typeof VALID_YEARS)[number]>,
  ...z.ZodLiteral<(typeof VALID_YEARS)[number]>[],
];

/** One employer's annual tax statement (jaaropgave); the engine sums the statements. */
export const AnnualStatementFields = {
  /** Taxable wage ("Loon", fiscaal loon) on the statement; not the gross salary. */
  taxableWage: z.number(),
  /** Dutch wage tax withheld (loonheffing) on the statement. */
  wageTaxWithheld: z.number(),
};

/** The most annual statements one income year accepts (job changes, agency and direct work). */
export const MAX_ANNUAL_STATEMENTS = 10;

// Shared primitive definitions; form recovery stays in TaxInputSchema.
export const TaxInputFields = {
  year: z.union(yearLiterals),
  residentCountry: z.enum(VALID_RESIDENT_COUNTRIES),
  civilStatus: z.enum(VALID_CIVIL_STATUSES),
  dependentChildren: z.number().int(),
  belowAOWAge: z.boolean(),
  belgianRegion: z.enum(VALID_BELGIAN_REGIONS),
  communalTaxRate: z.number(),
  thirtyPercentRuling: z.boolean(),
  annualStatements: z.array(z.object(AnnualStatementFields)),
  daysWorkedNL: z.number(),
  daysWorkedBE: z.number(),
  daysWorkedOther: z.number(),
  sickDaysNL: z.number(),
  sickDaysOutsideNL: z.number(),
  healthInsurancePremium: z.number(),
  supplementaryPension: z.number(),
  serviceVouchers: z.number(),
  reclaimableWithholdingTax: z.number(),
  assessmentIncomeTaxDue: z.number(),
  assessmentPremiumsDue: z.number(),
  mortgageEnabled: z.boolean(),
  mortgageHomeValue: z.number(),
  mortgageInterest: z.number(),
  mortgageOwnershipShare: z.number(),
  incomeOutsideNL: z.number(),
};

export type TaxInputField = keyof typeof TaxInputFields;

/** The Belgian tax-return code each Belgian input is entered under. Metadata, not part of the name. */
export const BELGIAN_CODES = {
  healthInsurancePremium: "1257",
  supplementaryPension: "1285",
  serviceVouchers: "3364",
  reclaimableWithholdingTax: "1437",
} as const satisfies Partial<Record<TaxInputField, string>>;

/**
 * Inputs grouped by the document a user reads them from, in the order the form, the filing
 * checklist and the MCP schema description present them. `profile` and `home` are the user's own
 * situation rather than a document.
 */
export const INPUT_GROUPS = {
  profile: [
    "year",
    "dependentChildren",
    "belowAOWAge",
    "communalTaxRate",
    "residentCountry",
    "civilStatus",
    "belgianRegion",
    "thirtyPercentRuling",
  ],
  annualTaxStatement: ["annualStatements"],
  workdayRecord: [
    "daysWorkedNL",
    "daysWorkedBE",
    "daysWorkedOther",
    "sickDaysNL",
    "sickDaysOutsideNL",
  ],
  healthInsurer: ["healthInsurancePremium"],
  pensionOrPayslip: ["supplementaryPension"],
  serviceVoucherStatement: ["serviceVouchers"],
  bank: ["reclaimableWithholdingTax"],
  dutchAssessment: ["assessmentIncomeTaxDue", "assessmentPremiumsDue"],
  home: [
    "mortgageEnabled",
    "mortgageInterest",
    "mortgageHomeValue",
    "mortgageOwnershipShare",
    "incomeOutsideNL",
  ],
} as const satisfies Record<string, readonly TaxInputField[]>;

/** The defaults applied when a caller leaves out a field that currently has a single legal value. */
export const SINGLE_VALUE_DEFAULTS = {
  residentCountry: "BE",
  civilStatus: "single",
  belgianRegion: "flemish",
  thirtyPercentRuling: false,
} as const;

/** The wage the form falls back to when the statements cannot be read at all. */
const FALLBACK_STATEMENTS = [{ taxableWage: 60000, wageTaxWithheld: 0 }];

const nonNegativeOr = (schema: z.ZodNumber, fallback: number) =>
  schema.catch(fallback).transform((v) => Math.max(0, v));

const AnnualStatementFormSchema = z.object({
  // An emptied wage or withholding field counts as zero.
  taxableWage: nonNegativeOr(AnnualStatementFields.taxableWage, 0),
  wageTaxWithheld: nonNegativeOr(AnnualStatementFields.wageTaxWithheld, 0),
});

export const TaxInputSchema = z.object({
  year: TaxInputFields.year.catch(VALID_YEARS[VALID_YEARS.length - 1]!),
  residentCountry: TaxInputFields.residentCountry.catch(SINGLE_VALUE_DEFAULTS.residentCountry),
  civilStatus: TaxInputFields.civilStatus.catch(SINGLE_VALUE_DEFAULTS.civilStatus),
  dependentChildren: TaxInputFields.dependentChildren
    .catch(0)
    .transform((v) => Math.min(10, Math.max(0, v))),
  belowAOWAge: TaxInputFields.belowAOWAge.catch(true),
  belgianRegion: TaxInputFields.belgianRegion.catch(SINGLE_VALUE_DEFAULTS.belgianRegion),
  communalTaxRate: TaxInputFields.communalTaxRate
    .catch(7)
    .transform((v) => Math.min(15, Math.max(0, v))),
  thirtyPercentRuling: TaxInputFields.thirtyPercentRuling.catch(
    SINGLE_VALUE_DEFAULTS.thirtyPercentRuling,
  ),
  annualStatements: z
    .array(AnnualStatementFormSchema)
    .min(1)
    .max(MAX_ANNUAL_STATEMENTS)
    .catch(FALLBACK_STATEMENTS),
  daysWorkedNL: nonNegativeOr(TaxInputFields.daysWorkedNL, 200),
  daysWorkedBE: nonNegativeOr(TaxInputFields.daysWorkedBE, 20),
  daysWorkedOther: nonNegativeOr(TaxInputFields.daysWorkedOther, 0),
  sickDaysNL: nonNegativeOr(TaxInputFields.sickDaysNL, 0),
  sickDaysOutsideNL: nonNegativeOr(TaxInputFields.sickDaysOutsideNL, 0),
  healthInsurancePremium: nonNegativeOr(TaxInputFields.healthInsurancePremium, 0),
  supplementaryPension: nonNegativeOr(TaxInputFields.supplementaryPension, 0),
  serviceVouchers: nonNegativeOr(TaxInputFields.serviceVouchers, 0),
  reclaimableWithholdingTax: nonNegativeOr(TaxInputFields.reclaimableWithholdingTax, 0),
  /**
   * Income tax (inkomstenbelasting) due on the Dutch assessment, after the heffingskortingen.
   * Only used together with `assessmentPremiumsDue`; a lone value is ignored by the engine.
   */
  assessmentIncomeTaxDue: TaxInputFields.assessmentIncomeTaxDue
    .transform((v) => Math.max(0, v))
    .optional()
    .catch(undefined),
  /** Premies volksverzekeringen due on the Dutch assessment, after the heffingskortingen. */
  assessmentPremiumsDue: TaxInputFields.assessmentPremiumsDue
    .transform((v) => Math.max(0, v))
    .optional()
    .catch(undefined),
  // Optional home/mortgage scenario (hypotheekrenteaftrek). Never persisted.
  mortgageEnabled: TaxInputFields.mortgageEnabled.optional().catch(undefined),
  /** Whole-home market value at 1 January of the preceding year; undefined = not entered. */
  mortgageHomeValue: TaxInputFields.mortgageHomeValue
    .transform((v) => Math.max(0, v))
    .optional()
    .catch(undefined),
  /** Annual interest paid on the qualifying home debt (eigenwoningschuld), whole loan. */
  mortgageInterest: TaxInputFields.mortgageInterest
    .transform((v) => Math.max(0, v))
    .optional()
    .catch(undefined),
  /** The user's ownership share of the home, in percent (0–100). */
  mortgageOwnershipShare: TaxInputFields.mortgageOwnershipShare
    .transform((v) => Math.min(100, Math.max(0, v)))
    .optional()
    .catch(undefined),
  /** Annual worldwide income not taxed in NL (partner included). Undefined = not entered. */
  incomeOutsideNL: TaxInputFields.incomeOutsideNL
    .transform((v) => Math.max(0, v))
    .optional()
    .catch(undefined),
});

// Privacy: wage, day-count and assessment inputs are intentionally not persisted across reloads.
// Fields with a single legal value are not stored either: they always take their default.
export const PersistedInputsSchema = TaxInputSchema.pick({
  year: true,
  dependentChildren: true,
  belowAOWAge: true,
  communalTaxRate: true,
});

export type TaxInputs = z.infer<typeof TaxInputSchema>;
export type AnnualStatement = TaxInputs["annualStatements"][number];
export type PersistedInputs = z.infer<typeof PersistedInputsSchema>;
