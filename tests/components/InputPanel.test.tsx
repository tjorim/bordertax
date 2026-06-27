import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useForm } from "@tanstack/react-form";

import InputPanel, { type TaxFormApi } from "@/components/InputPanel";
import { fieldError } from "@/components/fields/NumberField";
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
    const year = screen.getByRole("combobox", { name: /tax year/i });
    fireEvent.change(year, { target: { value: "2024" } });
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
    const residentCountry = screen.getByRole("combobox", { name: /country of residence/i });
    fireEvent.change(residentCountry, { target: { value: "NL" } });
    expect(getForm().getFieldValue("residentCountry")).toBe("NL");
  });

  // TODO: Re-enable when multiple civil statuses are supported
  it.skip("updates civil status", () => {
    const { getForm } = renderInputPanel();
    const civilStatus = screen.getByRole("combobox", { name: /civil status/i });
    fireEvent.change(civilStatus, { target: { value: "married" } });
    expect(getForm().getFieldValue("civilStatus")).toBe("married");
  });

  // TODO: Re-enable when multiple Belgian regions are supported
  it.skip("updates belgian region", () => {
    const { getForm } = renderInputPanel({ residentCountry: "BE" });
    const belgianRegion = screen.getByRole("combobox", { name: /belgian region/i });
    fireEvent.change(belgianRegion, { target: { value: "walloon" } });
    expect(getForm().getFieldValue("belgianRegion")).toBe("walloon");
  });

  it("updates communal tax rate", () => {
    const { getForm } = renderInputPanel({ residentCountry: "BE" });
    const communalTaxRate = screen.getByRole("spinbutton", { name: /municipal tax/i });
    fireEvent.change(communalTaxRate, { target: { value: "8" } });
    expect(getForm().getFieldValue("communalTaxRate")).toBe(8);
  });

  it("updates gross salary", () => {
    const { getForm } = renderInputPanel();
    const grossSalaryInput = screen.getByRole("spinbutton", { name: /gross annual salary/i });
    fireEvent.change(grossSalaryInput, { target: { value: "80000" } });
    expect(getForm().getFieldValue("grossSalary")).toBe(80000);
  });

  it("allows numeric fields to be cleared while editing", () => {
    const { getForm } = renderInputPanel({ grossSalary: 60000 });
    const grossSalaryInput = screen.getByRole("spinbutton", { name: /gross annual salary/i });

    fireEvent.change(grossSalaryInput, { target: { value: "" } });

    expect(grossSalaryInput).toHaveValue(null);
    expect(getForm().getFieldValue("grossSalary")).toBeUndefined();
  });

  it("updates daysWorkedNL", () => {
    const { getForm } = renderInputPanel();
    const daysWorkedNL = screen.getByRole("spinbutton", { name: /workdays in.*nl/i });
    fireEvent.change(daysWorkedNL, { target: { value: "150" } });
    expect(getForm().getFieldValue("daysWorkedNL")).toBe(150);
  });

  it("updates daysWorkedBE", () => {
    const { getForm } = renderInputPanel();
    const daysWorkedBE = screen.getByRole("spinbutton", { name: /days worked in.*be/i });
    fireEvent.change(daysWorkedBE, { target: { value: "30" } });
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
    const thirtyPercentRuling = screen.getByRole("checkbox", { name: /30% ruling/i });
    fireEvent.click(thirtyPercentRuling);
    expect(getForm().getFieldValue("thirtyPercentRuling")).toBe(true);
  });

  it("updates dependents count", () => {
    const { getForm } = renderInputPanel();
    const dependentChildren = screen.getByRole("spinbutton", { name: /dependents/i });
    fireEvent.change(dependentChildren, { target: { value: "2" } });
    expect(getForm().getFieldValue("dependentChildren")).toBe(2);
  });

  it("allows out-of-range dependents and surfaces a validation error", () => {
    const { getForm } = renderInputPanel();
    const dependentChildren = screen.getByRole("spinbutton", { name: /dependents/i });
    fireEvent.change(dependentChildren, { target: { value: "99" } });
    // Raw form value is unclamped — clamping happens at the App layer via TaxInputSchema.parse
    expect(getForm().getFieldValue("dependentChildren")).toBe(99);
    // Zod validator marks the input as invalid
    expect(dependentChildren).toHaveClass("is-invalid");
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

  it("includes other-country days in the social-security warning fraction", () => {
    renderInputPanel({ daysWorkedNL: 100, daysWorkedBE: 20, daysWorkedOther: 90 });

    expect(screen.getByText(/above 49% be days|meer dan 49% be-dagen/i)).toBeInTheDocument();
  });
});

describe("fieldError", () => {
  it("joins string, Error-like and nested validation messages", () => {
    expect(
      fieldError([
        "Required",
        { message: "Too low" },
        [{ message: "Must be an integer" }, "Invalid number"],
      ]),
    ).toBe("Required Too low Must be an integer Invalid number");
  });

  it("returns undefined for empty errors", () => {
    expect(fieldError(undefined)).toBeUndefined();
    expect(fieldError([])).toBeUndefined();
  });
});
