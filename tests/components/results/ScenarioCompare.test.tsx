import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ScenarioCompare from "@/components/results/ScenarioCompare";
import { compareScenarios } from "@/tax/compare";
import { fmt, fmtSigned } from "@/components/format";
import { mockInputs } from "../../test-utils/mockData";

const mortgageInputs = {
  ...mockInputs,
  daysWorkedNL: 220,
  daysWorkedBE: 0,
  mortgageEnabled: true,
  mortgageInterest: 6000,
  incomeOutsideNL: 0,
};

describe("ScenarioCompare", () => {
  it("renders signed tax and net deltas and income attribution, and resets to current inputs", async () => {
    const user = userEvent.setup();
    render(<ScenarioCompare inputs={mockInputs} />);
    fireEvent.change(screen.getByLabelText("B: gross annual salary"), {
      target: { value: "70000" },
    });
    const comparison = compareScenarios(mockInputs, { ...mockInputs, grossSalary: 70000 });
    for (const [label, delta] of [
      ["Dutch tax", comparison.delta.nlTax],
      ["Belgian tax", comparison.delta.beTax],
      ["Total tax", comparison.delta.totalTax],
      ["Net income per year", comparison.delta.netIncome],
      ["Net income per month", comparison.delta.netIncomeMonthly],
    ] as const) {
      expect(
        within(screen.getByRole("row", { name: new RegExp(label) })).getByText(fmtSigned(delta)),
      ).toBeInTheDocument();
    }
    const causes = screen.getByRole("region", {
      name: "What caused the difference in annual net income",
    });
    expect(causes).toHaveTextContent("Gross salary");
    expect(causes).toHaveTextContent(fmtSigned(comparison.attribution.netIncome.income!));
    await user.click(screen.getByRole("button", { name: "Copy current situation" }));
    expect(screen.getByText("Both scenarios are identical.")).toBeInTheDocument();
    expect(screen.getByLabelText("B: gross annual salary")).toHaveValue(60000);
  });

  it("shows mortgage eligibility changes caused by workdays", () => {
    render(<ScenarioCompare inputs={mortgageInputs} />);
    fireEvent.change(screen.getByLabelText("B: days worked in Belgium"), {
      target: { value: "100" },
    });
    expect(screen.getByText("Mortgage status: eligible → ineligible.")).toBeInTheDocument();
    expect(screen.getByRole("region")).toHaveTextContent("Workday split");
  });

  it("warns when either mortgage assessment is unknown", () => {
    render(<ScenarioCompare inputs={{ ...mortgageInputs, incomeOutsideNL: undefined }} />);
    expect(screen.getByText(/Comparison incomplete: other income/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("B: days worked in Belgium"), {
      target: { value: "100" },
    });
    expect(screen.getByText("Mortgage status: unknown → ineligible.")).toBeInTheDocument();
    expect(screen.getByText(/Comparison incomplete: other income/)).toBeInTheDocument();
  });

  it("compares mortgage interest and allows disabling the alternative deduction", async () => {
    const user = userEvent.setup();
    render(<ScenarioCompare inputs={mortgageInputs} />);
    fireEvent.change(screen.getByLabelText("B: annual mortgage interest"), {
      target: { value: "9000" },
    });
    const expected = compareScenarios(mortgageInputs, {
      ...mortgageInputs,
      mortgageInterest: 9000,
    });
    expect(screen.getByRole("region")).toHaveTextContent(
      fmtSigned(expected.attribution.netIncome.mortgage!),
    );
    await user.click(
      screen.getByRole("checkbox", { name: "B: include mortgage interest deduction" }),
    );
    expect(screen.getByText("Mortgage status: eligible → disabled.")).toBeInTheDocument();
  });

  it("keeps only overrides when current inputs change", () => {
    const { rerender } = render(<ScenarioCompare inputs={mockInputs} />);
    fireEvent.change(screen.getByLabelText("B: gross annual salary"), {
      target: { value: "70000" },
    });
    rerender(<ScenarioCompare inputs={{ ...mockInputs, daysWorkedBE: 50, grossSalary: 65000 }} />);
    expect(screen.getByLabelText("B: days worked in Belgium")).toHaveValue(50);
    expect(screen.getByLabelText("B: gross annual salary")).toHaveValue(70000);
    expect(screen.getByRole("table")).toHaveTextContent(
      fmt(
        compareScenarios(
          { ...mockInputs, grossSalary: 65000, daysWorkedBE: 50 },
          { ...mockInputs, grossSalary: 70000, daysWorkedBE: 50 },
        ).a.netIncome,
      ),
    );
    expect(screen.queryByLabelText("B: annual mortgage interest")).not.toBeInTheDocument();
  });
});
