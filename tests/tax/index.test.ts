import { describe, expect, it } from 'vitest';

import { calculate } from '../../src/tax/index';
import type { TaxInputs } from '../../src/tax/types';

const base: TaxInputs = {
  year: 2025,
  residentCountry: 'NL',
  civilStatus: 'single',
  dependentChildren: 0,
  belowAOWAge: true,
  belgianRegion: 'flemish',
  communalTaxRate: 7,
  grossSalary: 60000,
  daysWorkedNL: 220,
  daysWorkedBE: 0,
  thirtyPercentRuling: false,
};

describe('calculate', () => {
  it('returns zero tax and net income for zero gross salary', () => {
    const result = calculate({ ...base, grossSalary: 0 });

    expect(result.totalTax).toBe(0);
    expect(result.netIncome).toBe(0);
    expect(result.effectiveRateTotal).toBe(0);
    expect(result.be).toBeNull();
  });

  it('returns null be result for NL resident', () => {
    const result = calculate({ ...base, residentCountry: 'NL' });
    expect(result.be).toBeNull();
  });

  it('returns non-null be result for BE resident', () => {
    const result = calculate({ ...base, residentCountry: 'BE', daysWorkedBE: 20 });
    expect(result.be).not.toBeNull();
  });

  it('grossIncome equals grossSalary input', () => {
    const result = calculate({ ...base });
    expect(result.grossIncome).toBe(base.grossSalary);
  });

  it('netIncome equals grossSalary minus totalTax', () => {
    const result = calculate({ ...base });
    expect(result.netIncome).toBeCloseTo(result.grossIncome - result.totalTax, 5);
  });

  it('totalTax equals nl.netTaxNL when residentCountry is NL', () => {
    const result = calculate({ ...base, residentCountry: 'NL' });
    expect(result.totalTax).toBeCloseTo(result.nl.netTaxNL, 5);
  });

  it('totalTax equals nl.netTaxNL + be.netTaxBE for BE resident', () => {
    const result = calculate({ ...base, residentCountry: 'BE', daysWorkedBE: 20 });
    expect(result.totalTax).toBeCloseTo(result.nl.netTaxNL + (result.be?.netTaxBE ?? 0), 5);
  });

  it('effectiveRateTotal is totalTax / grossSalary', () => {
    const result = calculate({ ...base });
    expect(result.effectiveRateTotal).toBeCloseTo(result.totalTax / result.grossIncome, 10);
  });

  it('effectiveRateTotal is 0 when grossSalary is 0', () => {
    const result = calculate({ ...base, grossSalary: 0 });
    expect(result.effectiveRateTotal).toBe(0);
  });

  it('inputs are preserved in result', () => {
    const result = calculate({ ...base });
    expect(result.inputs).toEqual(base);
  });
});
