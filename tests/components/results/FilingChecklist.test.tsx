import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FilingChecklist from "@/components/results/FilingChecklist";
import * as m from "@/paraglide/messages.js";
import { fmt, fmtExact } from "@/components/format";
import { mockTaxResult, mockTaxResultNoBE } from "../../test-utils/mockData";

const rowFor = (label: string) => screen.getByText(label).closest("tr")!;

describe("FilingChecklist", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
  });

  it("renders the checklist and portal links without an accordion", () => {
    render(<FilingChecklist result={mockTaxResult} />);
    expect(screen.getByRole("heading", { name: m.filing_title() })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /mijn belastingdienst/i })).toBeVisible();
    expect(screen.getByText(/not amounts to type into the returns/i)).toBeInTheDocument();
  });

  it("keeps codes 1285 and 1437 out of the O.2 group", () => {
    render(<FilingChecklist result={mockTaxResult} />);
    const o2Header = screen.getByRole("columnheader", { name: /section o\.2.*netherlands/i });
    const rows = within(o2Header.closest("tbody")!).getAllByRole("row");
    const o2Index = rows.indexOf(o2Header.closest("tr")!);
    const afterO2 = rows.slice(o2Index + 1).map((r) => r.textContent);
    expect(afterO2).toHaveLength(2);
    expect(afterO2.join(" ")).not.toMatch(/1285|1437/);
    const beforeO2 = rows.slice(0, o2Index).map((r) => r.textContent);
    expect(beforeO2.join(" ")).toMatch(/1285/);
    expect(beforeO2.join(" ")).toMatch(/1437/);
  });

  it("states the entry format per row", () => {
    render(<FilingChecklist result={mockTaxResult} />);
    expect(rowFor(m.nl_not_taxed_income())).toHaveTextContent(m.filing_format_whole());
    expect(rowFor(m.nl_not_taxed_income())).toHaveTextContent(
      fmt(mockTaxResult.nl.deelNietInNLBelast),
    );
    expect(rowFor(m.filing_be_1250_nl())).toHaveTextContent(m.filing_format_cents());
    expect(rowFor(m.filing_nl_fully_taxed())).toHaveTextContent(m.filing_format_answer());
  });

  it("lists code 3364 only for income years up to 2024", () => {
    const { rerender } = render(
      <FilingChecklist
        result={{
          ...mockTaxResult,
          inputs: { ...mockTaxResult.inputs, year: 2024, dienstencheques: 600 },
        }}
      />,
    );
    expect(rowFor(m.filing_be_3364())).toHaveTextContent(fmtExact(600));

    rerender(<FilingChecklist result={mockTaxResult} />);
    expect(screen.queryByText(m.filing_be_3364())).not.toBeInTheDocument();
  });

  it("echoes the jaaropgave arbeidskorting beside the app's recalculation", () => {
    render(<FilingChecklist result={mockTaxResult} />);
    expect(rowFor(m.filing_nl_arbeidskorting_statement())).toHaveTextContent(
      m.filing_nl_arbeidskorting_statement_empty(),
    );
    fireEvent.change(screen.getByLabelText(m.filing_nl_arbeidskorting_input()), {
      target: { value: "4321" },
    });
    expect(rowFor(m.filing_nl_arbeidskorting_statement())).toHaveTextContent(fmt(4321));
    expect(rowFor(m.filing_nl_arbeidskorting_calculated())).toHaveTextContent(
      fmt(mockTaxResult.nl.arbeidskorting),
    );
  });

  it("lists the fixed Dutch answers and derives the 90% answer", () => {
    render(<FilingChecklist result={mockTaxResult} />);
    expect(rowFor(m.filing_nl_lives_in_be())).toHaveTextContent(m.filing_answer_yes());
    expect(rowFor(m.filing_nl_insured())).toHaveTextContent(m.filing_answer_yes());
    // 200 of 220 workdays in NL = 90%
    expect(rowFor(m.filing_nl_ninety_percent())).toHaveTextContent(m.filing_answer_yes());
  });

  it("answers no to the 90% question below the threshold", () => {
    render(<FilingChecklist result={{ ...mockTaxResult, nlFractionDutchMethod: 0.5 }} />);
    expect(rowFor(m.filing_nl_ninety_percent())).toHaveTextContent(m.filing_answer_no());
  });

  it("copies the checklist values", async () => {
    render(<FilingChecklist result={mockTaxResult} />);
    fireEvent.click(screen.getByRole("button", { name: m.filing_copy() }));
    expect(await screen.findByText(m.filing_copy_success())).toBeInTheDocument();
    const text = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock
      .calls[0]![0] as string;
    expect(text).toContain(`${m.filing_be_1250()}\t${fmtExact(mockTaxResult.be!.declaredIncome)}`);
  });

  it("omits the Belgian table when there is no Belgian result", () => {
    render(<FilingChecklist result={mockTaxResultNoBE} />);
    expect(screen.queryByText(m.filing_be_title())).not.toBeInTheDocument();
  });
});
