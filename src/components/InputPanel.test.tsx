import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import InputPanel from './InputPanel';
import { mockInputs } from '../test-utils/mockData';

describe('InputPanel', () => {
  it('renders without crashing', () => {
    const onChange = vi.fn();
    render(<InputPanel inputs={mockInputs} onChange={onChange} />);
  });

  it('shows Belgian region and communal tax fields for BE residents', () => {
    const onChange = vi.fn();
    render(<InputPanel inputs={{ ...mockInputs, residentCountry: 'BE' }} onChange={onChange} />);
    // These fields are only shown for BE residents
    const selects = screen.getAllByRole('combobox');
    // year, residentCountry, civilStatus, belgianRegion – at least 4 dropdowns for BE
    expect(selects.length).toBeGreaterThanOrEqual(4);
  });

  it('hides Belgian region and communal tax fields for NL residents', () => {
    const onChange = vi.fn();
    render(<InputPanel inputs={{ ...mockInputs, residentCountry: 'NL' }} onChange={onChange} />);
    const selects = screen.getAllByRole('combobox');
    // year, residentCountry, civilStatus – 3 dropdowns for NL (no belgianRegion)
    expect(selects.length).toBe(3);
  });

  it('calls onChange when year dropdown is changed', () => {
    const onChange = vi.fn();
    render(<InputPanel inputs={mockInputs} onChange={onChange} />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '2024' } });
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ year: 2024 }));
  });

  it('calls onChange when resident country changes to NL', () => {
    const onChange = vi.fn();
    render(<InputPanel inputs={mockInputs} onChange={onChange} />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'NL' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ residentCountry: 'NL' }));
  });

  it('calls onChange when civil status changes', () => {
    const onChange = vi.fn();
    render(<InputPanel inputs={mockInputs} onChange={onChange} />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[2], { target: { value: 'married' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ civilStatus: 'married' }));
  });

  it('calls onChange when belgian region changes', () => {
    const onChange = vi.fn();
    render(<InputPanel inputs={{ ...mockInputs, residentCountry: 'BE' }} onChange={onChange} />);
    const selects = screen.getAllByRole('combobox');
    // belgianRegion is the 4th dropdown (index 3)
    fireEvent.change(selects[3], { target: { value: 'walloon' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ belgianRegion: 'walloon' }));
  });

  it('calls onChange when communal tax rate changes', () => {
    const onChange = vi.fn();
    render(<InputPanel inputs={{ ...mockInputs, residentCountry: 'BE' }} onChange={onChange} />);
    // For BE resident: spinbuttons are [dependentChildren, communalTaxRate, grossSalary, daysWorkedNL, daysWorkedBE]
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[1], { target: { value: '8' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ communalTaxRate: 8 }));
  });

  it('calls onChange when gross salary is updated', () => {
    const onChange = vi.fn();
    render(<InputPanel inputs={mockInputs} onChange={onChange} />);
    // For BE resident: spinbuttons are [dependentChildren, communalTaxRate, grossSalary, daysWorkedNL, daysWorkedBE]
    const inputs = screen.getAllByRole('spinbutton');
    const grossSalaryInput = inputs[2];
    fireEvent.change(grossSalaryInput, { target: { value: '80000' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ grossSalary: 80000 }));
  });

  it('calls onChange when daysWorkedNL is updated', () => {
    const onChange = vi.fn();
    render(<InputPanel inputs={mockInputs} onChange={onChange} />);
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[3], { target: { value: '150' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ daysWorkedNL: 150 }));
  });

  it('calls onChange when daysWorkedBE is updated', () => {
    const onChange = vi.fn();
    render(<InputPanel inputs={mockInputs} onChange={onChange} />);
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[4], { target: { value: '30' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ daysWorkedBE: 30 }));
  });

  it('calls onChange when AOW checkbox is toggled', () => {
    const onChange = vi.fn();
    render(<InputPanel inputs={mockInputs} onChange={onChange} />);
    const checkbox = screen.getByRole('checkbox', { name: /aow/i });
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ belowAOWAge: false }));
  });

  it('calls onChange when thirty percent ruling is toggled', () => {
    const onChange = vi.fn();
    render(<InputPanel inputs={mockInputs} onChange={onChange} />);
    const checkboxes = screen.getAllByRole('checkbox');
    // thirtyPercentRuling checkbox is the second checkbox
    fireEvent.click(checkboxes[1]);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ thirtyPercentRuling: true }));
  });

  it('calls onChange when dependents count is updated', () => {
    const onChange = vi.fn();
    render(<InputPanel inputs={mockInputs} onChange={onChange} />);
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '2' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ dependentChildren: 2 }));
  });
});
