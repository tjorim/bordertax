import {
  MAX_COMMUNAL_TAX_RATE,
  MAX_DEPENDENT_CHILDREN,
  VALID_BELGIAN_REGIONS,
  VALID_CIVIL_STATUSES,
  VALID_RESIDENT_COUNTRIES,
  VALID_YEARS,
} from "../tax/constants";
import type { TaxInputs } from "../tax/types";

export const DEFAULT_INPUTS: TaxInputs = {
  year: 2025,
  residentCountry: "BE",
  civilStatus: "single",
  dependentChildren: 0,
  belowAOWAge: true,
  belgianRegion: "flemish",
  communalTaxRate: 7,
  grossSalary: 60000,
  daysWorkedNL: 200,
  daysWorkedBE: 20,
  daysWorkedOther: 0,
  thirtyPercentRuling: false,
  socialContributions: 0,
  aanvullendPensioen: 0,
  dienstencheques: 0,
  roerendeVoorheffing: 0,
  withheldTaxNL: 0,
};

export const STORAGE_KEY = "grensarbeider-tax-inputs-v1";

export interface StoredInputsState {
  inputs: TaxInputs;
  resetCorruptStorage: boolean;
}

export function sanitizeInputs(raw: unknown): TaxInputs {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_INPUTS;
  }

  const input = raw as Partial<TaxInputs>;

  const isOneOf = <T>(value: unknown, options: readonly T[]): value is T =>
    options.includes(value as T);

  const sanitizeNonNegative = (value: unknown, defaultValue: number): number =>
    Number.isFinite(value) ? Math.max(0, Number(value)) : defaultValue;

  return {
    year: isOneOf(input.year, VALID_YEARS) ? input.year : DEFAULT_INPUTS.year,
    residentCountry: isOneOf(input.residentCountry, VALID_RESIDENT_COUNTRIES)
      ? input.residentCountry
      : DEFAULT_INPUTS.residentCountry,
    civilStatus: isOneOf(input.civilStatus, VALID_CIVIL_STATUSES)
      ? input.civilStatus
      : DEFAULT_INPUTS.civilStatus,
    dependentChildren: Number.isFinite(input.dependentChildren)
      ? Math.min(MAX_DEPENDENT_CHILDREN, Math.max(0, Number(input.dependentChildren)))
      : DEFAULT_INPUTS.dependentChildren,
    belowAOWAge:
      typeof input.belowAOWAge === "boolean" ? input.belowAOWAge : DEFAULT_INPUTS.belowAOWAge,
    belgianRegion: isOneOf(input.belgianRegion, VALID_BELGIAN_REGIONS)
      ? input.belgianRegion
      : DEFAULT_INPUTS.belgianRegion,
    communalTaxRate: Number.isFinite(input.communalTaxRate)
      ? Math.min(MAX_COMMUNAL_TAX_RATE, Math.max(0, Number(input.communalTaxRate)))
      : DEFAULT_INPUTS.communalTaxRate,
    grossSalary: Number.isFinite(input.grossSalary)
      ? Math.max(0, Number(input.grossSalary))
      : DEFAULT_INPUTS.grossSalary,
    daysWorkedNL: sanitizeNonNegative(input.daysWorkedNL, DEFAULT_INPUTS.daysWorkedNL),
    daysWorkedBE: sanitizeNonNegative(input.daysWorkedBE, DEFAULT_INPUTS.daysWorkedBE),
    daysWorkedOther: sanitizeNonNegative(input.daysWorkedOther, DEFAULT_INPUTS.daysWorkedOther),
    thirtyPercentRuling:
      typeof input.thirtyPercentRuling === "boolean"
        ? input.thirtyPercentRuling
        : DEFAULT_INPUTS.thirtyPercentRuling,
    socialContributions: sanitizeNonNegative(
      input.socialContributions,
      DEFAULT_INPUTS.socialContributions,
    ),
    aanvullendPensioen: sanitizeNonNegative(
      input.aanvullendPensioen,
      DEFAULT_INPUTS.aanvullendPensioen,
    ),
    dienstencheques: sanitizeNonNegative(input.dienstencheques, DEFAULT_INPUTS.dienstencheques),
    roerendeVoorheffing: sanitizeNonNegative(
      input.roerendeVoorheffing,
      DEFAULT_INPUTS.roerendeVoorheffing,
    ),
    withheldTaxNL: sanitizeNonNegative(input.withheldTaxNL, DEFAULT_INPUTS.withheldTaxNL),
  };
}

export function loadStoredInputs(storage: Storage): StoredInputsState {
  const saved = storage.getItem(STORAGE_KEY);
  if (!saved) {
    return { inputs: DEFAULT_INPUTS, resetCorruptStorage: false };
  }

  try {
    return {
      inputs: sanitizeInputs(JSON.parse(saved)),
      resetCorruptStorage: false,
    };
  } catch {
    storage.removeItem(STORAGE_KEY);
    return { inputs: DEFAULT_INPUTS, resetCorruptStorage: true };
  }
}
