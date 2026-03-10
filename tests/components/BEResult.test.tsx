import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BEResult from "@/components/BEResult";
import * as m from "@/paraglide/messages.js";
import { mockBEResult } from "../test-utils/mockData";

describe("BEResult", () => {
  it("shows a warning when result is null", () => {
    render(<BEResult result={null} />);
    expect(screen.getByRole("alert")).toHaveTextContent(m.be_result_unavailable());
  });

  it("renders full result with BE income", () => {
    render(<BEResult result={mockBEResult} />);
    const alerts = screen.getAllByRole("alert");
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toHaveTextContent(m.be_warning_note());
  });

  it("shows the effective rate for BE", () => {
    render(<BEResult result={mockBEResult} />);
    expect(screen.getByText("4.63%")).toBeInTheDocument();
  });

  it("shows a success alert when beIncome is 0", () => {
    const resultNoBeIncome = { ...mockBEResult, beIncome: 0 };
    render(<BEResult result={resultNoBeIncome} />);
    const alerts = screen.getAllByRole("alert");
    expect(alerts).toHaveLength(2);
    expect(screen.getByText(m.be_no_home_working())).toBeInTheDocument();
  });

  it("displays the beFraction as percentage", () => {
    render(<BEResult result={mockBEResult} />);
    // beFraction of 0.0909 → "9.09%"
    expect(screen.getByText("9.09%")).toBeInTheDocument();
  });
});
