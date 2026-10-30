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

// Shared primitive definitions; form recovery stays in TaxInputSchema.
export const TaxInputFields = {
  year: z.union(yearLiterals),
  residentCountry: z.enum(VALID_RESIDENT_COUNTRIES),
  civilStatus: z.enum(VALID_CIVIL_STATUSES),
  dependentChildren: z.number().int(),
  belowAOWAge: z.boolean(),
  belgianRegion: z.enum(VALID_BELGIAN_REGIONS),
  communalTaxRate: z.number(),
  grossSalary: z.number(),
  daysWorkedNL: z.number(),
  daysWorkedBE: z.number(),
  daysWorkedOther: z.number(),
  thirtyPercentRuling: z.boolean(),
  socialContributions: z.number(),
  aanvullendPensioen: z.number(),
  dienstencheques: z.number(),
  roerendeVoorheffing: z.number(),
  withheldTaxNL: z.number(),
  sickDays: z.number(),
  mortgageEnabled: z.boolean(),
  mortgageHomeValue: z.number(),
  mortgageInterest: z.number(),
  mortgageOwnershipShare: z.number(),
  incomeOutsideNL: z.number(),
};

export const TaxInputSchema = z.object({
  year: TaxInputFields.year.catch(VALID_YEARS[VALID_YEARS.length - 1]!),
  residentCountry: TaxInputFields.residentCountry.catch("BE"),
  civilStatus: TaxInputFields.civilStatus.catch("single"),
  dependentChildren: TaxInputFields.dependentChildren
    .catch(0)
    .transform((v) => Math.min(10, Math.max(0, v))),
  belowAOWAge: TaxInputFields.belowAOWAge.catch(true),
  belgianRegion: TaxInputFields.belgianRegion.catch("flemish"),
  communalTaxRate: TaxInputFields.communalTaxRate
    .catch(7)
    .transform((v) => Math.min(15, Math.max(0, v))),
  grossSalary: TaxInputFields.grossSalary.catch(60000).transform((v) => Math.max(0, v)),
  daysWorkedNL: TaxInputFields.daysWorkedNL.catch(200).transform((v) => Math.max(0, v)),
  daysWorkedBE: TaxInputFields.daysWorkedBE.catch(20).transform((v) => Math.max(0, v)),
  daysWorkedOther: TaxInputFields.daysWorkedOther.catch(0).transform((v) => Math.max(0, v)),
  thirtyPercentRuling: TaxInputFields.thirtyPercentRuling.catch(false),
  socialContributions: TaxInputFields.socialContributions.catch(0).transform((v) => Math.max(0, v)),
  aanvullendPensioen: TaxInputFields.aanvullendPensioen.catch(0).transform((v) => Math.max(0, v)),
  dienstencheques: TaxInputFields.dienstencheques.catch(0).transform((v) => Math.max(0, v)),
  roerendeVoorheffing: TaxInputFields.roerendeVoorheffing.catch(0).transform((v) => Math.max(0, v)),
  withheldTaxNL: TaxInputFields.withheldTaxNL.catch(0).transform((v) => Math.max(0, v)),
  sickDays: TaxInputFields.sickDays.catch(0).transform((v) => Math.max(0, v)),
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

// Privacy: salary and day-count inputs are intentionally not persisted across reloads.
export const PersistedInputsSchema = TaxInputSchema.pick({
  year: true,
  residentCountry: true,
  civilStatus: true,
  dependentChildren: true,
  belowAOWAge: true,
  belgianRegion: true,
  communalTaxRate: true,
  thirtyPercentRuling: true,
});

export type TaxInputs = z.infer<typeof TaxInputSchema>;
export type PersistedInputs = z.infer<typeof PersistedInputsSchema>;
