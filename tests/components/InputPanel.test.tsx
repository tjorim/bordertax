import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useForm } from "@tanstack/react-form";

import InputPanel, { type TaxFormApi } from "@/components/InputPanel";
import type { TaxInputs } from "@/tax/types";
import { setLocale } from "@/paraglide/runtime";
import { mockInputs } from "../test-utils/mockData";

function renderInputPanel(overrides: Partial<TaxInputs> = {}) {
  let formInstance!: TaxFormApi;

  function Wrapper() {
    const form = useForm({ defaultValues: { ...mockInputs, ...overrides } });
    formInstance = form as TaxFormApi;
    return <InputPanel form={formInstance} />;
  }

  render(<Wrapper />);
  return { getForm: () => formInstance };
}

describe("InputPanel", () => {
  beforeEach(() => {
    setLocale("en", { reload: false });
  });

  it("renders without crashing", () => {
    renderInputPanel();
  });

  it("shows communal tax field for BE residents", () => {
    renderInputPanel({ residentCountry: "BE" });
    // Year is the only combobox shown (resident country, civil status and Belgian region
    // dropdowns are hidden when there is only one valid option each)
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBe(1);
    expect(screen.getByText(/municipal tax|communal tax|gemeentebelasting/i)).toBeInTheDocument();
    expect(screen.getAllByRole("spinbutton").length).toBeGreaterThanOrEqual(5);
  });

  it("updates year when dropdown is changed", () => {
    const { getForm } = renderInputPanel();
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0]!, { target: { value: "2024" } });
    expect(getForm().getFieldValue("year")).toBe(2024);
  });

  // TODO: Re-enable when NL-resident support is re-integrated
  it.skip("hides Belgian region and communal tax fields for NL residents", () => {
    renderInputPanel({
      residentCountry: "NL" as unknown as TaxInputs["residentCountry"],
    });
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBe(3);
    expect(screen.queryByText(/municipal tax|communal tax|gemeentebelasting/i)).toBeNull();
    expect(screen.getByRole("spinbutton", { name: /sick days/i })).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton", { name: /municipal tax|communal tax/i })).toBeNull();
  });

  // TODO: Re-enable when NL-resident support is re-integrated
  it.skip("updates resident country to NL", () => {
    const { getForm } = renderInputPanel();
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[1]!, { target: { value: "NL" } });
    expect(getForm().getFieldValue("residentCountry")).toBe("NL");
  });

  // TODO: Re-enable when multiple civil statuses are supported
  it.skip("updates civil status", () => {
    const { getForm } = renderInputPanel();
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[2]!, { target: { value: "married" } });
    expect(getForm().getFieldValue("civilStatus")).toBe("married");
  });

  // TODO: Re-enable when multiple Belgian regions are supported
  it.skip("updates belgian region", () => {
    const { getForm } = renderInputPanel({ residentCountry: "BE" });
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[3]!, { target: { value: "walloon" } });
    expect(getForm().getFieldValue("belgianRegion")).toBe("walloon");
  });

  it("updates communal tax rate", () => {
    const { getForm } = renderInputPanel({ residentCountry: "BE" });
    // For BE resident: spinbuttons are [dependentChildren, communalTaxRate, grossSalary, daysWorkedNL, daysWorkedBE]
    const inputs = screen.getAllByRole("spinbutton");
    fireEvent.change(inputs[1]!, { target: { value: "8" } });
    expect(getForm().getFieldValue("communalTaxRate")).toBe(8);
  });

  it("updates gross salary", () => {
    const { getForm } = renderInputPanel();
    // For BE resident: spinbuttons are [dependentChildren, communalTaxRate, grossSalary, daysWorkedNL, daysWorkedBE]
    const inputs = screen.getAllByRole("spinbutton");
    const grossSalaryInput = inputs[2]!;
    fireEvent.change(grossSalaryInput, { target: { value: "80000" } });
    expect(getForm().getFieldValue("grossSalary")).toBe(80000);
  });

  it("updates daysWorkedNL", () => {
    const { getForm } = renderInputPanel();
    const inputs = screen.getAllByRole("spinbutton");
    fireEvent.change(inputs[4]!, { target: { value: "150" } });
    expect(getForm().getFieldValue("daysWorkedNL")).toBe(150);
  });

  it("updates daysWorkedBE", () => {
    const { getForm } = renderInputPanel();
    const inputs = screen.getAllByRole("spinbutton");
    fireEvent.change(inputs[5]!, { target: { value: "30" } });
    expect(getForm().getFieldValue("daysWorkedBE")).toBe(30);
  });

  it("updates belowAOWAge when checkbox is toggled", () => {
    const { getForm } = renderInputPanel();
    const checkbox = screen.getByRole("checkbox", { name: /aow/i });
    fireEvent.click(checkbox);
    expect(getForm().getFieldValue("belowAOWAge")).toBe(false);
  });

  it("updates thirtyPercentRuling when checkbox is toggled", () => {
    const { getForm } = renderInputPanel();
    const checkboxes = screen.getAllByRole("checkbox");
    // thirtyPercentRuling checkbox is the second checkbox
    fireEvent.click(checkboxes[1]!);
    expect(getForm().getFieldValue("thirtyPercentRuling")).toBe(true);
  });

  it("updates dependents count", () => {
    const { getForm } = renderInputPanel();
    const inputs = screen.getAllByRole("spinbutton");
    fireEvent.change(inputs[0]!, { target: { value: "2" } });
    expect(getForm().getFieldValue("dependentChildren")).toBe(2);
  });

  it("allows out-of-range dependents and surfaces a validation error", () => {
    const { getForm } = renderInputPanel();
    const spinButtons = screen.getAllByRole("spinbutton");
    fireEvent.change(spinButtons[0]!, { target: { value: "99" } });
    // Raw form value is unclamped — clamping happens at the App layer via TaxInputSchema.parse
    expect(getForm().getFieldValue("dependentChildren")).toBe(99);
    // Zod validator marks the input as invalid
    expect(spinButtons[0]).toHaveClass("is-invalid");
  });

  it("shows total workdays count", () => {
    renderInputPanel({ daysWorkedNL: 180, daysWorkedBE: 20, daysWorkedOther: 5 });
    // 180 + 20 + 5 = 205 — shown inline as "Total workdays: 205"
    expect(screen.getByText(/205/)).toBeInTheDocument();
  });

  it("shows a warning when total workdays is zero", () => {
    renderInputPanel({ daysWorkedNL: 0, daysWorkedBE: 0, daysWorkedOther: 0 });
    expect(screen.getByText(/realistic net\/day|realistische netto\/dag/i)).toBeInTheDocument();
  });

  it("shows a warning when workdays total exceeds a typical yearly range", () => {
    renderInputPanel({ daysWorkedNL: 260, daysWorkedBE: 120, daysWorkedOther: 20 });
    expect(screen.getByText(/total workdays|totaal aantal werkdagen/i)).toBeInTheDocument();
    expect(screen.getByText(/double-check|controleer/i)).toBeInTheDocument();
  });

  it("does not show high workdays warning when total is within normal range", () => {
    renderInputPanel({ daysWorkedNL: 200, daysWorkedBE: 20, daysWorkedOther: 0 });
    expect(screen.queryByText(/double-check|controleer/i)).toBeNull();
  });
});
