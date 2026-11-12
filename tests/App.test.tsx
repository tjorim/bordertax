import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    Link: ({
      children,
      to,
      ...props
    }: {
      children: React.ReactNode;
      to: string;
      [key: string]: unknown;
    }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

import App from "@/App";
import { LEGACY_STORAGE_KEY, STORAGE_KEY } from "@/lib/inputStorage";
import { setLocale } from "@/paraglide/runtime";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    setLocale("en", { reload: false });
  });

  it.each(["getItem", "setItem"] as const)("works when storage %s fails", (method) => {
    const spy = vi.spyOn(Storage.prototype, method).mockImplementation(() => {
      throw new DOMException("Storage unavailable", "SecurityError");
    });
    try {
      render(<App />);
      expect(screen.getByRole("tab", { name: /summary/i })).toBeInTheDocument();
      fireEvent.click(screen.getByRole("tab", { name: /year comparison/i }));
      expect(screen.getByRole("tab", { name: /year comparison/i })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    } finally {
      spy.mockRestore();
    }
  });

  it("renders without crashing", () => {
    render(<App />);
    expect(document.body).toBeDefined();
  });

  it("renders the language toggle button", () => {
    render(<App />);
    expect(
      screen.getByRole("button", { name: /english|nederlands|language|taal|^nl$|^en$/i }),
    ).toBeInTheDocument();
  });

  it("switches UI language immediately when toggled", () => {
    render(<App />);
    const initialSummaryTab = screen.getByRole("tab", { name: /summary|overzicht/i });
    const initialLabel = initialSummaryTab.textContent;

    const toggle = screen.getByRole("button", {
      name: /english|nederlands|language|taal|^nl$|^en$/i,
    });
    fireEvent.click(toggle);

    const toggledSummaryTab = screen.getByRole("tab", { name: /summary|overzicht/i });
    expect(toggledSummaryTab.textContent).not.toEqual(initialLabel);
  });

  it("renders input panel and result tabs", () => {
    render(<App />);
    const tabList = screen.getByRole("tablist");
    expect(tabList).toBeInTheDocument();
  });

  it("renders a tab for NL, BE and year comparison", () => {
    render(<App />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBe(7);
    expect(tabs.map((tab) => tab.getAttribute("aria-label"))).toEqual([
      "Summary",
      "Netherlands",
      "Belgium",
      "Filing",
      "Home ratio",
      "Year comparison",
      "Compare",
    ]);
  });

  it("defers the home ratio chart until its tab is requested", async () => {
    render(<App />);
    const panel = screen.getAllByRole("tabpanel", { hidden: true })[4]!; // wfh is the fifth tab
    expect(panel).toBeEmptyDOMElement();

    fireEvent.click(screen.getByRole("tab", { name: /home ratio/i }));
    await waitFor(() => expect(panel).not.toBeEmptyDOMElement(), { timeout: 5000 });
    expect(screen.getByRole("tab", { name: /home ratio/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.click(screen.getByRole("tab", { name: /summary/i }));
    expect(panel).not.toBeEmptyDOMElement();
  });

  it("defers the year comparison until its tab is requested", async () => {
    render(<App />);
    const panel = screen.getAllByRole("tabpanel", { hidden: true })[5]!; // years is the sixth tab
    expect(panel).toBeEmptyDOMElement();

    fireEvent.click(screen.getByRole("tab", { name: /year comparison/i }));
    await waitFor(() => expect(within(panel).getByRole("table")).toBeInTheDocument(), {
      timeout: 5000,
    });
  });

  it("loads saved inputs from localStorage", () => {
    const savedInputs = {
      year: 2024,
      residentCountry: "NL",
      civilStatus: "single",
      dependentChildren: 0,
      belowAOWAge: true,
      belgianRegion: "flemish",
      communalTaxRate: 7,
      annualStatements: [{ taxableWage: 50000, wageTaxWithheld: 0 }],
      daysWorkedNL: 180,
      daysWorkedBE: 40,
      thirtyPercentRuling: false,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedInputs));
    render(<App />);
    expect(screen.getByText("Income year 2024", { exact: true })).toBeInTheDocument();
  });

  it("moves inputs saved under the legacy key to the current key", () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({ year: 2023 }));
    render(<App />);
    expect(screen.getByText("Income year 2023", { exact: true })).toBeInTheDocument();
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toMatchObject({ year: 2023 });
  });

  it("ignores invalid localStorage data and uses defaults", () => {
    localStorage.setItem(STORAGE_KEY, "not valid json{{");
    render(<App />);
    expect(screen.getByText("Income year 2025", { exact: true })).toBeInTheDocument();
  });

  it("loads a saved year 2026 without a provisional alert", () => {
    const savedInputs = {
      year: 2026,
      residentCountry: "BE",
      civilStatus: "single",
      dependentChildren: 0,
      belowAOWAge: true,
      belgianRegion: "flemish",
      communalTaxRate: 7,
      annualStatements: [{ taxableWage: 60000, wageTaxWithheld: 0 }],
      daysWorkedNL: 200,
      daysWorkedBE: 20,
      thirtyPercentRuling: false,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedInputs));
    render(<App />);
    expect(screen.getByText("Income year 2026", { exact: true })).toBeInTheDocument();
    expect(
      screen
        .queryAllByRole("alert")
        .filter((node) => /provisional|indexed amounts/i.test(node.textContent ?? "")),
    ).toHaveLength(0);
  });

  it("sanitizes invalid enum field values from localStorage", () => {
    const badInputs = {
      year: 1990,
      residentCountry: "FR",
      civilStatus: "divorced",
      dependentChildren: -5,
      belowAOWAge: "yes",
      belgianRegion: "unknown",
      communalTaxRate: 999,
      annualStatements: [{ taxableWage: -1000, wageTaxWithheld: 0 }],
      daysWorkedNL: -10,
      daysWorkedBE: -5,
      thirtyPercentRuling: 1,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(badInputs));
    render(<App />);
    // An unsupported year falls back to the latest supported year.
    expect(screen.getByText("Income year 2026", { exact: true })).toBeInTheDocument();
  });

  it("sanitizes non-finite numeric fields from localStorage", () => {
    // JSON null values make Number.isFinite() return false → fall back to defaults
    const inputsWithNulls = {
      year: 2025,
      residentCountry: "BE",
      civilStatus: "single",
      dependentChildren: null,
      belowAOWAge: true,
      belgianRegion: "flemish",
      communalTaxRate: null,
      annualStatements: [{ taxableWage: null, wageTaxWithheld: 0 }],
      daysWorkedNL: null,
      daysWorkedBE: null,
      thirtyPercentRuling: false,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inputsWithNulls));
    render(<App />);
    expect(screen.getByText("Income year 2025", { exact: true })).toBeInTheDocument();
  });

  it("falls back to defaults when localStorage contains null JSON", () => {
    // JSON.parse("null") === null → sanitizeInputs early return → DEFAULT_INPUTS
    localStorage.setItem(STORAGE_KEY, JSON.stringify(null));
    render(<App />);
    expect(screen.getByText("Income year 2025", { exact: true })).toBeInTheDocument();
  });
});
