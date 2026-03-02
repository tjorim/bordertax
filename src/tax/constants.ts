import type { BelgianRegion, CivilStatus, ResidentCountry, TaxYear } from './types';

export const VALID_YEARS = [2024, 2025, 2026] as const satisfies readonly TaxYear[];
export const VALID_RESIDENT_COUNTRIES = ['BE', 'NL'] as const satisfies readonly ResidentCountry[];
export const VALID_CIVIL_STATUSES = ['single', 'married'] as const satisfies readonly CivilStatus[];
export const VALID_BELGIAN_REGIONS = ['flemish', 'walloon', 'brussels'] as const satisfies readonly BelgianRegion[];

