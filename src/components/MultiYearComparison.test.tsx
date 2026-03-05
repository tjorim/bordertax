import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import MultiYearComparison from './MultiYearComparison';
import { mockTaxResult } from '../test-utils/mockData';
import { calculate } from '../tax';

const rows = [2024, 2025, 2026].map((year) => ({
  year: year as 2024 | 2025 | 2026,
  result: calculate({ ...mockTaxResult.inputs, year: year as 2024 | 2025 | 2026 }),
}));

describe('MultiYearComparison', () => {
  it('renders without crashing', () => {
    render(<MultiYearComparison rows={rows} activeYear={2025} />);
  });

  it('renders a row for each year', () => {
    render(<MultiYearComparison rows={rows} activeYear={2025} />);
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('2025')).toBeInTheDocument();
    expect(screen.getByText('2026')).toBeInTheDocument();
  });

  it('marks the active year with a badge', () => {
    render(<MultiYearComparison rows={rows} activeYear={2025} />);
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('renders table with column headers', () => {
    render(<MultiYearComparison rows={rows} activeYear={2025} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    const headers = screen.getAllByRole('columnheader');
    expect(headers.length).toBeGreaterThan(3);
  });
});
