import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import NLResult from './NLResult';
import { mockNLResult } from '../test-utils/mockData';

describe('NLResult', () => {
  it('renders without crashing', () => {
    render(<NLResult result={mockNLResult} />);
  });

  it('displays the brackets', () => {
    render(<NLResult result={mockNLResult} />);
    const rows = screen.getAllByRole('row');
    // Should have at least the bracket rows plus header/summary rows
    expect(rows.length).toBeGreaterThan(2);
  });

  it('shows tax credit values', () => {
    render(<NLResult result={mockNLResult} />);
    // arbeidskorting of 4500 should appear
    expect(screen.getAllByText(/4\.500|4,500/).length).toBeGreaterThan(0);
  });

  it('shows the effective rate', () => {
    render(<NLResult result={mockNLResult} />);
    // effectiveRateNL of 0.2083 → "20.83%"
    expect(screen.getByText('20.83%')).toBeInTheDocument();
  });
});
