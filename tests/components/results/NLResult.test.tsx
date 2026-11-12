import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NLResult from "@/components/results/NLResult";
import { fmtBracket, fmtExact, fmtSigned } from "@/components/format";
import { setLocale } from "@/paraglide/runtime";
import * as m from "@/paraglide/messages.js";
import { mockNLResult } from "../../test-utils/mockData";

describe("NLResult", () => {
  it("renders without crashing", () => {
    render(<NLResult result={mockNLResult} />);
  });

  it("displays the brackets", () => {
    render(<NLResult result={mockNLResult} />);
    const rows = screen.getAllByRole("row");
    // Should have at least the bracket rows plus header/summary rows
    expect(rows.length).toBeGreaterThan(2);
  });

  it("shows tax credit values", () => {
    render(<NLResult result={mockNLResult} />);
    // arbeidskorting of 4500 should appear
    expect(screen.getAllByText(/4\.500|4,500/).length).toBeGreaterThan(0);
  });

  it("shows the effective rate", () => {
    render(<NLResult result={mockNLResult} />);
    // effectiveRateNL of 0.2806 → "28.06%"
    expect(screen.getByText("28.06%")).toBeInTheDocument();
  });

  it("shows the estimate as the source when no assessment is in use", () => {
    render(<NLResult result={mockNLResult} />);
    expect(screen.getByText(m.nl_charge_source_estimate())).toBeInTheDocument();
    expect(screen.queryByText(m.nl_charge_col_difference())).not.toBeInTheDocument();
    expect(screen.getByText(m.nl_charge_hint_estimate())).toBeInTheDocument();
  });

  it("shows the assessed figures next to the estimate with their difference", () => {
    const charge = {
      source: "assessment" as const,
      incomeTaxDue: mockNLResult.incomeTaxDue + 100,
      premiumsDue: mockNLResult.premiumsDue - 40,
      netTaxNL: mockNLResult.netTaxNL + 60,
      incomeTaxDifference: 100,
      premiumsDifference: -40,
      netTaxDifference: 60,
    };
    render(<NLResult result={mockNLResult} charge={charge} wageTaxWithheld={30000} />);
    expect(screen.getAllByText(m.nl_charge_source_assessment()).length).toBeGreaterThan(0);
    expect(screen.getByRole("columnheader", { name: m.nl_charge_col_difference() })).toBeVisible();
    const incomeTaxRow = screen.getByText(m.nl_charge_income_tax()).closest("tr")!;
    expect(incomeTaxRow).toHaveTextContent(fmtSigned(100));
    expect(screen.getByText(m.nl_charge_premiums()).closest("tr")).toHaveTextContent(
      fmtSigned(-40),
    );
    expect(screen.getByText(m.nl_charge_hint_assessment())).toBeInTheDocument();
    // The refund follows the assessed amount, not the estimate.
    expect(screen.getByText(m.nl_balance_refund()).closest("tr")).toHaveTextContent(
      fmtExact(30000 - charge.netTaxNL),
    );
  });
});

describe("NLResult bracket labels", () => {
  it("formats the numeric bounds with the locale helpers", () => {
    render(<NLResult result={mockNLResult} />);
    expect(screen.getByText(fmtBracket(0, 38441))).toBeInTheDocument();
    expect(screen.getByText(fmtBracket(38441, 76817))).toBeInTheDocument();
  });

  it("shows the open top bracket as a lower bound", () => {
    const result = {
      ...mockNLResult,
      brackets: [{ from: 76817, to: null, rate: 0.495, taxableAmount: 1000, tax: 495 }],
    };
    render(<NLResult result={result} />);
    expect(screen.getByText(fmtBracket(76817, null))).toBeInTheDocument();
    expect(fmtBracket(76817, null).startsWith("> ")).toBe(true);
  });

  it("formats the bounds in the active locale, not always Dutch", () => {
    setLocale("en", { reload: false });
    expect(fmtBracket(0, 38441)).toContain("38,441");
    setLocale("nl", { reload: false });
    try {
      expect(fmtBracket(0, 38441)).toContain("38.441");
    } finally {
      setLocale("en", { reload: false });
    }
  });
});
