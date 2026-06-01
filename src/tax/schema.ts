import { z } from "zod";
import {
  VALID_BELGIAN_REGIONS,
  VALID_CIVIL_STATUSES,
  VALID_RESIDENT_COUNTRIES,
  VALID_YEARS,
} from "./constants";

const yearLiterals = VALID_YEARS.map((year) => z.literal(year)) as [
  z.ZodLiteral<(typeof VALID_YEARS)[number]>,
  ...z.ZodLiteral<(typeof VALID_YEARS)[number]>[],
];

export const TaxInputSchema = z.object({
  year: z.union(yearLiterals).catch(VALID_YEARS[VALID_YEARS.length - 1]!),
  residentCountry: z.enum(VALID_RESIDENT_COUNTRIES).catch("BE"),
  civilStatus: z.enum(VALID_CIVIL_STATUSES).catch("single"),
  dependentChildren: z
    .number()
    .int()
    .catch(0)
    .transform((v) => Math.min(10, Math.max(0, v))),
  belowAOWAge: z.boolean().catch(true),
  belgianRegion: z.enum(VALID_BELGIAN_REGIONS).catch("flemish"),
  communalTaxRate: z
    .number()
    .catch(7)
    .transform((v) => Math.min(15, Math.max(0, v))),
  grossSalary: z.number().catch(60000).transform((v) => Math.max(0, v)),
  daysWorkedNL: z.number().catch(200).transform((v) => Math.max(0, v)),
  daysWorkedBE: z.number().catch(20).transform((v) => Math.max(0, v)),
  daysWorkedOther: z.number().catch(0).transform((v) => Math.max(0, v)),
  thirtyPercentRuling: z.boolean().catch(false),
  socialContributions: z.number().catch(0).transform((v) => Math.max(0, v)),
  aanvullendPensioen: z.number().catch(0).transform((v) => Math.max(0, v)),
  dienstencheques: z.number().catch(0).transform((v) => Math.max(0, v)),
  roerendeVoorheffing: z.number().catch(0).transform((v) => Math.max(0, v)),
  withheldTaxNL: z.number().catch(0).transform((v) => Math.max(0, v)),
  sickDays: z.number().catch(0).transform((v) => Math.max(0, v)),
});

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
