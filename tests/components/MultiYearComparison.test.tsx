import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MultiYearComparison from "@/components/MultiYearComparison";
import type { TaxYear } from "@/tax/constants";
import { mockTaxResult } from "../test-utils/mockData";
import { calculate } from "@/tax";

const rows = [2024, 2025].map((year) => ({
  year: year as 2024 | 2025,
  result: calculate({ ...mockTaxResult.inputs, year: year as 2024 | 2025 }),
}));

describe("MultiYearComparison", () => {
  it("renders without crashing", () => {
    render(<MultiYearComparison rows={rows} activeYear={2025} />);
  });

  it("renders a row for each year", () => {
    render(<MultiYearComparison rows={rows} activeYear={2025} />);
    expect(screen.getAllByText("2024").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2025").length).toBeGreaterThan(0);
  });

  // TODO: Re-enable when 2026 support is re-integrated
  it.skip("renders a row for year 2026", () => {
    const rowsWith2026 = [...rows, {
      year: 2026 as unknown as TaxYear,
      result: calculate({ ...mockTaxResult.inputs, year: 2026 as unknown as TaxYear }),
    }];
    render(<MultiYearComparison rows={rowsWith2026} activeYear={2025} />);
    expect(screen.getAllByText("2026").length).toBeGreaterThan(0);
  });

  it("marks the active year with a badge", () => {
    render(<MultiYearComparison rows={rows} activeYear={2025} />);
    // Year appears in both the chart label and the table cell; find the table cell specifically
    const activeYearCell = screen
      .getAllByText("2025")
      .map((el) => el.closest("td"))
      .find((el) => el !== null);
    const activeRow = activeYearCell?.closest("tr");
    expect(activeRow).toHaveClass("table-primary");
  });

  it("renders table with column headers", () => {
    render(<MultiYearComparison rows={rows} activeYear={2025} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    const headers = screen.getAllByRole("columnheader");
    expect(headers.length).toBeGreaterThan(3);
  });
});
