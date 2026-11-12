import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FilingChecklist from "@/components/results/FilingChecklist";
import { yearParams } from "@/tax/assessmentYear";
import * as m from "@/paraglide/messages.js";
import { fmt, fmtExact } from "@/components/format";
import { calculate } from "@/tax";
import { DEFAULT_INPUTS } from "@/tax/defaults";
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
          inputs: { ...mockTaxResult.inputs, year: 2024, serviceVouchers: 600 },
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
    expect(
      screen.queryByText(m.filing_be_title(yearParams(mockTaxResult.inputs.year))),
    ).not.toBeInTheDocument();
  });

  it("marks the Belgian figures provisional until the assessment is entered", () => {
    render(<FilingChecklist result={mockTaxResult} />);
    const note = screen.getByText(m.filing_be_provisional());
    expect(note).toHaveAttribute("role", "note");
    expect(screen.queryByText(m.filing_be_final())).not.toBeInTheDocument();
    expect(rowFor(m.filing_be_1250())).toHaveTextContent(m.filing_be_1250_source());
  });

  it("treats the Belgian figures as final once the assessment is in use", () => {
    const assessed = {
      ...mockTaxResult,
      nlCharge: { ...mockTaxResult.nlCharge, source: "assessment" as const },
    };
    render(<FilingChecklist result={assessed} />);
    expect(screen.getByText(m.filing_be_final())).toBeInTheDocument();
    expect(screen.queryByText(m.filing_be_provisional())).not.toBeInTheDocument();
    expect(rowFor(m.filing_be_1250())).toHaveTextContent(m.filing_be_1250_source_assessment());
  });
});

describe("FilingChecklist unused federal reductions", () => {
  const unused = m.be_federal_reductions_unused({ amount: fmtExact(321.5) });

  it("shows the note in the Belgian section only when the unused part is above zero", () => {
    const { rerender } = render(<FilingChecklist result={mockTaxResult} />);
    expect(screen.queryByText(unused)).not.toBeInTheDocument();

    rerender(
      <FilingChecklist
        result={{
          ...mockTaxResult,
          be: { ...mockTaxResult.be!, saldoFederaal: 0, federalReductionsUnused: 321.5 },
        }}
      />,
    );
    expect(screen.getByText(unused)).toBeInTheDocument();
  });
});

describe("FilingChecklist source documents and statements", () => {
  it("lists the documents by source", () => {
    render(<FilingChecklist result={mockTaxResult} />);
    for (const text of [
      m.filing_document_jaaropgave(),
      m.filing_document_workdays(),
      m.filing_document_health_insurer(),
      m.filing_document_pension(),
      m.filing_document_bank(),
      m.filing_document_assessment(),
    ]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
    // Service vouchers only reduce tax up to income year 2024.
    expect(screen.queryByText(m.filing_document_service_vouchers())).toBeNull();
  });

  it("shows Loon and Loonheffing per annual statement when there are several", () => {
    const result = calculate({
      ...DEFAULT_INPUTS,
      annualStatements: [
        { taxableWage: 40000, wageTaxWithheld: 7000 },
        { taxableWage: 20000, wageTaxWithheld: 3000 },
      ],
    });
    render(<FilingChecklist result={result} />);
    expect(within(rowFor("Loon (annual statement 1)")).getByText(fmt(40000))).toBeInTheDocument();
    expect(within(rowFor("Loon (annual statement 2)")).getByText(fmt(20000))).toBeInTheDocument();
    expect(
      within(rowFor("Loonheffing (annual statement 2)")).getByText(fmt(3000)),
    ).toBeInTheDocument();
  });
});

describe("FilingChecklist two workday splits", () => {
  const withSick = (sick: { sickDaysNL?: number; sickDaysOutsideNL?: number }) =>
    calculate({
      ...DEFAULT_INPUTS,
      annualStatements: [{ taxableWage: 80000, wageTaxWithheld: 0 }],
      daysWorkedNL: 180,
      daysWorkedBE: 20,
      ...sick,
    });

  it("is not shown without sick days", () => {
    render(<FilingChecklist result={withSick({})} />);
    expect(screen.queryByRole("heading", { name: m.filing_sourcing_title() })).toBeNull();
  });

  it("shows both amounts side by side with the double-taxation risk", () => {
    render(<FilingChecklist result={withSick({ sickDaysNL: 30 })} />);
    const section = screen
      .getByRole("heading", { name: m.filing_sourcing_title() })
      .closest("section")!;
    expect(within(section).getByText(m.filing_sourcing_nl_title())).toBeInTheDocument();
    expect(within(section).getByText(m.filing_sourcing_be_title())).toBeInTheDocument();
    expect(within(section).getByText(fmt(6957))).toBeInTheDocument();
    expect(within(section).getByText(fmtExact(8000))).toBeInTheDocument();
    expect(
      within(section).getByText(m.filing_sourcing_risk({ amount: fmtExact(1043) })),
    ).toBeInTheDocument();
    expect(within(section).getByText(m.filing_sourcing_manual())).toBeInTheDocument();
  });

  it("names the part taxed by neither country when the sick days fell outside NL", () => {
    render(<FilingChecklist result={withSick({ sickDaysOutsideNL: 30 })} />);
    expect(
      screen.getByText(m.filing_sourcing_neither({ amount: fmtExact(9391) })),
    ).toBeInTheDocument();
  });
});
