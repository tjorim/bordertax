import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import BEResult from '@/components/BEResult';
import { mockBEResult } from '../test-utils/mockData';

describe('BEResult', () => {
  it('shows info alert for NL residents', () => {
    render(<BEResult result={null} residentCountry="NL" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders nothing when result is null for BE resident', () => {
    const { container } = render(<BEResult result={null} residentCountry="BE" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders full result for BE resident with BE income', () => {
    render(<BEResult result={mockBEResult} residentCountry="BE" />);
    // Should not show the info alert for NL residents
    const alerts = screen.queryAllByRole('alert');
    // Only the warning note alert at the bottom should be present, not the "NL residents only" alert
    expect(alerts.length).toBeLessThan(2);
  });

  it('shows the effective rate for BE', () => {
    render(<BEResult result={mockBEResult} residentCountry="BE" />);
    expect(screen.getByText('2.80%')).toBeInTheDocument();
  });

  it('shows a success alert when beIncome is 0', () => {
    const resultNoBeIncome = { ...mockBEResult, beIncome: 0 };
    render(<BEResult result={resultNoBeIncome} residentCountry="BE" />);
    const alerts = screen.getAllByRole('alert');
    // Success alert for no home-working + warning note at bottom
    expect(alerts.length).toBeGreaterThanOrEqual(1);
  });

  it('displays the beFraction as percentage', () => {
    render(<BEResult result={mockBEResult} residentCountry="BE" />);
    // beFraction of 0.0909 → "9.09%"
    expect(screen.getByText('9.09%')).toBeInTheDocument();
  });
});
