import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BEResult from "@/components/BEResult";
import * as m from "@/paraglide/messages.js";
import { mockBEResult } from "../test-utils/mockData";

describe("BEResult", () => {
  it("shows info alert for NL residents", () => {
    render(<BEResult result={null} residentCountry="NL" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders nothing when result is null for BE resident", () => {
    const { container } = render(<BEResult result={null} residentCountry="BE" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders full result for BE resident with BE income", () => {
    render(<BEResult result={mockBEResult} residentCountry="BE" />);
    const alerts = screen.getAllByRole("alert");
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toHaveTextContent(m.be_warning_note());
    expect(screen.queryByText(m.be_only_residents())).toBeNull();
  });

  it("shows the effective rate for BE", () => {
    render(<BEResult result={mockBEResult} residentCountry="BE" />);
    expect(screen.getByText("4.63%")).toBeInTheDocument();
  });

  it("shows a success alert when beIncome is 0", () => {
    const resultNoBeIncome = { ...mockBEResult, beIncome: 0 };
    render(<BEResult result={resultNoBeIncome} residentCountry="BE" />);
    const alerts = screen.getAllByRole("alert");
    expect(alerts).toHaveLength(2);
    expect(screen.getByText(m.be_no_home_working())).toBeInTheDocument();
  });

  it("displays the beFraction as percentage", () => {
    render(<BEResult result={mockBEResult} residentCountry="BE" />);
    // beFraction of 0.0909 → "9.09%"
    expect(screen.getByText("9.09%")).toBeInTheDocument();
  });
});
