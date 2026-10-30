import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MortgageResult from "@/components/results/MortgageResult";
import SummaryResult from "@/components/results/SummaryResult";
import NLResult from "@/components/results/NLResult";
import { calculate } from "@/tax";
import { setLocale } from "@/paraglide/runtime";
import * as m from "@/paraglide/messages.js";
import { fmt } from "@/components/format";
import { mockInputs } from "../../test-utils/mockData";

const inputs = {
  ...mockInputs,
  mortgageEnabled: true,
  mortgageInterest: 6000,
  daysWorkedBE: 0,
  incomeOutsideNL: 0,
};

describe("MortgageResult", () => {
  beforeEach(() => setLocale("en", { reload: false }));

  it.each([
    ["eligible", { incomeOutsideNL: 0 }, m.mortgage_threshold_met],
    ["ineligible", { incomeOutsideNL: 100000 }, m.mortgage_threshold_not_met],
    ["unknown", { incomeOutsideNL: undefined }, m.mortgage_income_outside_nl_missing],
    ["eligible", { mortgageInterest: 0 }, m.mortgage_no_interest],
  ] as const)("explains %s with %j", (status, overrides, reason) => {
    const result = calculate({ ...inputs, ...overrides }).mortgage!;
    expect(result.status).toBe(status);
    render(<MortgageResult result={result} />);
    expect(screen.getByText(reason())).toBeVisible();
    const annual = screen.getByText(m.mortgage_annual()).closest("tr")!;
    expect(within(annual).getByText(fmt(result.realised.netBenefit))).toBeVisible();
    const monthly = screen.getByText(m.mortgage_monthly()).closest("tr")!;
    expect(within(monthly).getByText(fmt(result.realised.netBenefit / 12))).toBeVisible();
    expect(screen.queryByText(m.mortgage_potential()) !== null).toBe(!result.applied);
    if (result.nlTaxedPercentIsUpperBound) expect(screen.getByText(/at most/)).toBeVisible();
    expect(screen.getByText(m.mortgage_note())).toBeVisible();
    expect(screen.getByText(m.mortgage_qualifying_debt())).toBeVisible();
  });

  it("integrates the mortgage card only when enabled", () => {
    const { rerender } = render(
      <SummaryResult
        result={calculate({ ...inputs, mortgageEnabled: false })}
        onResetInputs={vi.fn()}
      />,
    );
    expect(screen.queryByRole("heading", { name: m.mortgage_title() })).toBeNull();
    rerender(<SummaryResult result={calculate(inputs)} onResetInputs={vi.fn()} />);
    expect(screen.getByRole("heading", { name: m.mortgage_title() })).toBeVisible();
  });

  it("shows the NL deduction and surcharge only for a deduction", () => {
    const { rerender } = render(<NLResult result={calculate(inputs).nl} />);
    expect(screen.getByText(m.mortgage_deduction())).toBeVisible();
    expect(screen.getByText(m.mortgage_surcharge())).toBeVisible();
    rerender(<NLResult result={calculate({ ...inputs, mortgageInterest: 0 }).nl} />);
    expect(screen.queryByText(m.mortgage_deduction())).toBeNull();
    expect(screen.queryByText(m.mortgage_surcharge())).toBeNull();
  });
});
