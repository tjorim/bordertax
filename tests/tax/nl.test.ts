import { describe, expect, it } from 'vitest';

import { calculateNLTax } from '@/tax/nl';
import type { TaxInputs } from '@/tax/types';

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

describe('calculateNLTax', () => {
  it('returns zero tax for zero gross salary', () => {
    const result = calculateNLTax({ ...base, grossSalary: 0 });
    expect(result.netTaxNL).toBe(0);
    expect(result.nlTaxableIncome).toBe(0);
    expect(result.effectiveRateNL).toBe(0);
  });

  it('returns zero taxable income when no NL workdays', () => {
    const result = calculateNLTax({ ...base, daysWorkedNL: 0, daysWorkedBE: 220 });
    expect(result.nlTaxableIncome).toBe(0);
    expect(result.netTaxNL).toBe(0);
    expect(result.effectiveRateNL).toBe(0);
  });

  it('returns zero taxable income when total days are zero', () => {
    const result = calculateNLTax({ ...base, daysWorkedNL: 0, daysWorkedBE: 0 });
    expect(result.nlTaxableIncome).toBe(0);
    expect(result.netTaxNL).toBe(0);
  });

  it('computes NL fraction correctly when working split days', () => {
    const result = calculateNLTax({ ...base, daysWorkedNL: 110, daysWorkedBE: 110 });
    expect(result.nlTaxableIncome).toBeCloseTo(30000, 0);
  });

  it('applies 30% ruling by taxing only 70% of the NL income', () => {
    const withRuling = calculateNLTax({ ...base, thirtyPercentRuling: true });
    const withoutRuling = calculateNLTax({ ...base, thirtyPercentRuling: false });
    expect(withRuling.nlTaxableIncome).toBeCloseTo(withoutRuling.nlTaxableIncome * 0.7, 1);
    expect(withRuling.netTaxNL).toBeLessThan(withoutRuling.netTaxNL);
  });

  it('uses lower bracket rate for above-AOW-age taxpayers', () => {
    const under = calculateNLTax({ ...base, belowAOWAge: true });
    const over = calculateNLTax({ ...base, belowAOWAge: false });
    expect(over.taxBeforeCredits).toBeLessThan(under.taxBeforeCredits);
  });

  it('does not return negative netTaxNL', () => {
    // Very low salary where credits exceed tax
    const result = calculateNLTax({ ...base, grossSalary: 5000 });
    expect(result.netTaxNL).toBeGreaterThanOrEqual(0);
  });

  it('totalCredits does not exceed taxBeforeCredits', () => {
    const result = calculateNLTax({ ...base, grossSalary: 5000 });
    expect(result.totalCredits).toBeLessThanOrEqual(result.taxBeforeCredits);
  });

  it('brackets array is non-empty for positive income', () => {
    const result = calculateNLTax({ ...base });
    expect(result.brackets.length).toBeGreaterThan(0);
  });

  it('brackets sum matches taxBeforeCredits', () => {
    const result = calculateNLTax({ ...base, grossSalary: 100000 });
    const sum = result.brackets.reduce((acc, b) => acc + b.tax, 0);
    expect(sum).toBeCloseTo(result.taxBeforeCredits, 1);
  });

  it('effectiveRateNL is between 0 and 1 for normal salary', () => {
    const result = calculateNLTax({ ...base });
    expect(result.effectiveRateNL).toBeGreaterThan(0);
    expect(result.effectiveRateNL).toBeLessThan(1);
  });

  it('higher salary results in higher effective rate', () => {
    const low = calculateNLTax({ ...base, grossSalary: 30000 });
    const high = calculateNLTax({ ...base, grossSalary: 120000 });
    expect(high.effectiveRateNL).toBeGreaterThan(low.effectiveRateNL);
  });

  it('works for tax year 2024', () => {
    const result = calculateNLTax({ ...base, year: 2024 });
    expect(result.netTaxNL).toBeGreaterThan(0);
    expect(result.brackets.length).toBeGreaterThan(0);
  });

  it('works for tax year 2026', () => {
    const result = calculateNLTax({ ...base, year: 2026 });
    expect(result.netTaxNL).toBeGreaterThan(0);
    expect(result.brackets.length).toBeGreaterThan(0);
  });

  it('reaches top bracket for very high salary', () => {
    const result = calculateNLTax({ ...base, grossSalary: 200000 });
    const topBracket = result.brackets.find((b) => b.rate === 0.495);
    expect(topBracket).toBeDefined();
    expect(topBracket!.tax).toBeGreaterThan(0);
  });

  it('AHK is zero for very high income (above phase-out end)', () => {
    const result = calculateNLTax({ ...base, grossSalary: 200000 });
    expect(result.algemeneHeffingskorting).toBe(0);
  });

  it('AHK is at maximum for very low income (below phase-out start)', () => {
    const result = calculateNLTax({ ...base, grossSalary: 20000 });
    expect(result.algemeneHeffingskorting).toBe(3068);
  });

  it('returns correct structure', () => {
    const result = calculateNLTax({ ...base });
    expect(result).toHaveProperty('nlTaxableIncome');
    expect(result).toHaveProperty('taxBeforeCredits');
    expect(result).toHaveProperty('brackets');
    expect(result).toHaveProperty('algemeneHeffingskorting');
    expect(result).toHaveProperty('arbeidskorting');
    expect(result).toHaveProperty('totalCredits');
    expect(result).toHaveProperty('netTaxNL');
    expect(result).toHaveProperty('effectiveRateNL');
  });

  it('above-AOW age uses lower AHK max', () => {
    const under = calculateNLTax({ ...base, grossSalary: 10000, belowAOWAge: true });
    const over = calculateNLTax({ ...base, grossSalary: 10000, belowAOWAge: false });
    expect(over.algemeneHeffingskorting).toBeLessThan(under.algemeneHeffingskorting);
  });
});
