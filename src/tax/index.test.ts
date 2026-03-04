import { describe, expect, it } from 'vitest';

import { calculate } from './index';

describe('calculate', () => {
  it('returns zero tax and net income for zero gross salary', () => {
    const result = calculate({
      year: 2025,
      residentCountry: 'NL',
      civilStatus: 'single',
      dependentChildren: 0,
      belowAOWAge: true,
      belgianRegion: 'flemish',
      communalTaxRate: 7,
      grossSalary: 0,
      daysWorkedNL: 260,
      daysWorkedBE: 0,
      thirtyPercentRuling: false,
    });

    expect(result.totalTax).toBe(0);
    expect(result.netIncome).toBe(0);
    expect(result.effectiveRateTotal).toBe(0);
    expect(result.be).toBeNull();
  });
});
