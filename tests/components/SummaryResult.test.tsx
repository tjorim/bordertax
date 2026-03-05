import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SummaryResult from '@/components/SummaryResult';
import { mockTaxResult, mockTaxResultNLResident } from '../test-utils/mockData';

describe('SummaryResult', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without crashing', () => {
    const onReset = vi.fn();
    render(<SummaryResult result={mockTaxResult} onResetInputs={onReset} />);
  });

  it('shows copy and reset buttons', () => {
    const onReset = vi.fn();
    render(<SummaryResult result={mockTaxResult} onResetInputs={onReset} />);
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  it('calls onResetInputs when reset button is clicked', async () => {
    const onReset = vi.fn();
    render(<SummaryResult result={mockTaxResult} onResetInputs={onReset} />);
    screen.getByRole('button', { name: /reset/i }).click();
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('renders for NL resident (no Belgian tax row)', () => {
    const onReset = vi.fn();
    render(<SummaryResult result={mockTaxResultNLResident} onResetInputs={onReset} />);
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('displays the progress bar', () => {
    const onReset = vi.fn();
    render(<SummaryResult result={mockTaxResult} onResetInputs={onReset} />);
    const progressBars = document.querySelectorAll('.progress-bar');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('shows success alert after copying to clipboard', async () => {
    const onReset = vi.fn();
    render(<SummaryResult result={mockTaxResult} onResetInputs={onReset} />);
    const copyButton = screen.getByRole('button', { name: /copy/i });
    await act(async () => {
      fireEvent.click(copyButton);
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('clears copy status after timeout', async () => {
    vi.useFakeTimers();
    const onReset = vi.fn();
    const { rerender } = render(<SummaryResult result={mockTaxResult} onResetInputs={onReset} />);
    const copyButton = screen.getByRole('button', { name: /copy/i });
    // Click and flush promises (clipboard.writeText resolves immediately)
    await act(async () => {
      fireEvent.click(copyButton);
    });
    // Alert should appear after state update
    expect(screen.getByRole('alert')).toBeInTheDocument();
    // Advance timer to trigger setCopyStatus('idle')
    act(() => {
      vi.runAllTimers();
    });
    rerender(<SummaryResult result={mockTaxResult} onResetInputs={onReset} />);
    expect(screen.queryByRole('alert')).toBeNull();
    vi.useRealTimers();
  });

  it('shows error alert when clipboard fails', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('Not allowed')) },
      writable: true,
      configurable: true,
    });
    const onReset = vi.fn();
    render(<SummaryResult result={mockTaxResult} onResetInputs={onReset} />);
    const copyButton = screen.getByRole('button', { name: /copy/i });
    await act(async () => {
      fireEvent.click(copyButton);
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
