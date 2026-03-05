import { describe, expect, it } from 'vitest';

import { calculateBETax } from './be';
import type { TaxInputs } from './types';

const baseNL: TaxInputs = {
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

const baseBE: TaxInputs = {
  ...baseNL,
  residentCountry: 'BE',
};

describe('calculateBETax', () => {
  it('returns null for NL resident', () => {
    expect(calculateBETax(baseNL)).toBeNull();
  });

  it('returns an object for BE resident', () => {
    const result = calculateBETax({ ...baseBE, daysWorkedBE: 20 });
    expect(result).not.toBeNull();
  });

  it('returns non-zero tax for BE resident with some BE days', () => {
    const result = calculateBETax({ ...baseBE, daysWorkedNL: 200, daysWorkedBE: 20 });
    expect(result!.netTaxBE).toBeGreaterThan(0);
  });

  it('returns zero netTaxBE when beFraction is 0 (all NL days)', () => {
    const result = calculateBETax({ ...baseBE, daysWorkedNL: 220, daysWorkedBE: 0 });
    expect(result!.beFraction).toBe(0);
    expect(result!.federalTax).toBe(0);
    expect(result!.netTaxBE).toBe(0);
  });

  it('returns zero netTaxBE when both day counts are 0', () => {
    const result = calculateBETax({ ...baseBE, daysWorkedNL: 0, daysWorkedBE: 0 });
    expect(result!.beFraction).toBe(0);
    expect(result!.netTaxBE).toBe(0);
  });

  it('beFraction equals 1 when all days are worked in BE', () => {
    const result = calculateBETax({ ...baseBE, daysWorkedNL: 0, daysWorkedBE: 220 });
    expect(result!.beFraction).toBe(1);
  });

  it('communal tax increases with higher communalTaxRate', () => {
    const low = calculateBETax({ ...baseBE, daysWorkedNL: 200, daysWorkedBE: 20, communalTaxRate: 5 });
    const high = calculateBETax({ ...baseBE, daysWorkedNL: 200, daysWorkedBE: 20, communalTaxRate: 9 });
    expect(high!.communalTax).toBeGreaterThan(low!.communalTax);
  });

  it('communal tax is proportional to federal tax', () => {
    const result = calculateBETax({ ...baseBE, daysWorkedNL: 200, daysWorkedBE: 20, communalTaxRate: 7 });
    expect(result!.communalTax).toBeCloseTo(result!.federalTax * 0.07, 5);
  });

  it('netTaxBE equals federalTax + communalTax', () => {
    const result = calculateBETax({ ...baseBE, daysWorkedNL: 200, daysWorkedBE: 20 });
    expect(result!.netTaxBE).toBeCloseTo(result!.federalTax + result!.communalTax, 5);
  });

  it('effectiveRateBE is between 0 and 1 for normal inputs', () => {
    const result = calculateBETax({ ...baseBE, daysWorkedNL: 200, daysWorkedBE: 20 });
    expect(result!.effectiveRateBE).toBeGreaterThan(0);
    expect(result!.effectiveRateBE).toBeLessThan(1);
  });

  it('effectiveRateBE is 0 when grossSalary is 0', () => {
    const result = calculateBETax({ ...baseBE, grossSalary: 0 });
    expect(result!.effectiveRateBE).toBe(0);
  });

  it('dependent children reduce the tax through higher personal exemption', () => {
    const noChildren = calculateBETax({ ...baseBE, daysWorkedNL: 200, daysWorkedBE: 20, dependentChildren: 0 });
    const twoChildren = calculateBETax({ ...baseBE, daysWorkedNL: 200, daysWorkedBE: 20, dependentChildren: 2 });
    expect(twoChildren!.belastingvrijeSomReduction).toBeGreaterThan(noChildren!.belastingvrijeSomReduction);
    expect(twoChildren!.netTaxBE).toBeLessThan(noChildren!.netTaxBE);
  });

  it('handles 5+ dependent children via extraPerChildAbove4', () => {
    const four = calculateBETax({ ...baseBE, daysWorkedNL: 200, daysWorkedBE: 20, dependentChildren: 4 });
    const five = calculateBETax({ ...baseBE, daysWorkedNL: 200, daysWorkedBE: 20, dependentChildren: 5 });
    expect(five!.belastingvrijeSomReduction).toBeGreaterThan(four!.belastingvrijeSomReduction);
  });

  it('professional expenses are capped at forfaitMax', () => {
    // Very high income: expenses should hit the forfait cap
    const result = calculateBETax({ ...baseBE, grossSalary: 200000, daysWorkedNL: 0, daysWorkedBE: 220 });
    expect(result!.professionalExpenses).toBe(5930); // 2025 forfaitMax
  });

  it('professional expenses for low income are a fraction of beIncome', () => {
    // beIncome is small, so forfait rate * beIncome < forfaitMax
    const result = calculateBETax({ ...baseBE, grossSalary: 10000, daysWorkedNL: 0, daysWorkedBE: 220 });
    expect(result!.professionalExpenses).toBeCloseTo(10000 * 0.3, 1);
  });

  it('nlExemptIncome + beIncome equals grossSalary', () => {
    const result = calculateBETax({ ...baseBE, daysWorkedNL: 200, daysWorkedBE: 20 });
    expect(result!.nlExemptIncome + result!.beIncome).toBeCloseTo(baseBE.grossSalary, 5);
  });

  it('works for tax year 2024', () => {
    const result = calculateBETax({ ...baseBE, year: 2024, daysWorkedNL: 200, daysWorkedBE: 20 });
    expect(result).not.toBeNull();
    expect(result!.netTaxBE).toBeGreaterThan(0);
  });

  it('works for tax year 2026', () => {
    const result = calculateBETax({ ...baseBE, year: 2026, daysWorkedNL: 200, daysWorkedBE: 20 });
    expect(result).not.toBeNull();
    expect(result!.netTaxBE).toBeGreaterThan(0);
  });

  it('returns correct result structure', () => {
    const result = calculateBETax({ ...baseBE, daysWorkedNL: 200, daysWorkedBE: 20 });
    expect(result).toHaveProperty('beIncome');
    expect(result).toHaveProperty('nlExemptIncome');
    expect(result).toHaveProperty('professionalExpenses');
    expect(result).toHaveProperty('netTotalIncome');
    expect(result).toHaveProperty('taxOnTotalIncome');
    expect(result).toHaveProperty('belastingvrijeSomReduction');
    expect(result).toHaveProperty('taxAfterPersonalExemption');
    expect(result).toHaveProperty('beFraction');
    expect(result).toHaveProperty('federalTax');
    expect(result).toHaveProperty('communalTax');
    expect(result).toHaveProperty('netTaxBE');
    expect(result).toHaveProperty('effectiveRateBE');
  });

  it('taxAfterPersonalExemption is never negative', () => {
    // Very low income where personal allowance exceeds tax
    const result = calculateBETax({ ...baseBE, grossSalary: 5000, daysWorkedNL: 0, daysWorkedBE: 220 });
    expect(result!.taxAfterPersonalExemption).toBeGreaterThanOrEqual(0);
  });
});
