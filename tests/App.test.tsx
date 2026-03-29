import { fireEvent, render, screen, within } from "@testing-library/react";
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
import { setLocale } from "@/paraglide/runtime";

const STORAGE_KEY = "grensarbeider-tax-inputs-v1";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    setLocale("en", { reload: false });
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
    expect(tabs.length).toBe(5); // summary, NL, BE, years, wfh
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
      grossSalary: 50000,
      daysWorkedNL: 180,
      daysWorkedBE: 40,
      thirtyPercentRuling: false,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedInputs));
    render(<App />);
    expect(screen.getByText(/Tax year.*2024/)).toBeInTheDocument();
  });

  it("ignores invalid localStorage data and uses defaults", () => {
    localStorage.setItem(STORAGE_KEY, "not valid json{{");
    render(<App />);
    expect(screen.getByText(/Tax year.*2025/)).toBeInTheDocument();
  });

  // TODO: Re-enable when 2026 support is re-integrated
  it.skip("shows 2026 provisional alert for year 2026", () => {
    const savedInputs = {
      year: 2026,
      residentCountry: "BE",
      civilStatus: "single",
      dependentChildren: 0,
      belowAOWAge: true,
      belgianRegion: "flemish",
      communalTaxRate: 7,
      grossSalary: 60000,
      daysWorkedNL: 200,
      daysWorkedBE: 20,
      thirtyPercentRuling: false,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedInputs));
    render(<App />);
    expect(screen.getByText(/Tax year.*2026/)).toBeInTheDocument();
    const alert = screen
      .getAllByRole("alert")
      .find((node) => /indexed amounts.*2026/i.test(node.textContent ?? ""));
    expect(alert).toBeDefined();
    expect(alert).toHaveTextContent(/indexed amounts.*2026/i);
    expect(within(alert!).getByText(/indexed amounts.*2026/i)).toBeInTheDocument();
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
      grossSalary: -1000,
      daysWorkedNL: -10,
      daysWorkedBE: -5,
      thirtyPercentRuling: 1,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(badInputs));
    render(<App />);
    expect(screen.getByText(/Tax year.*2025/)).toBeInTheDocument();
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
      grossSalary: null,
      daysWorkedNL: null,
      daysWorkedBE: null,
      thirtyPercentRuling: false,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inputsWithNulls));
    render(<App />);
    expect(screen.getByText(/Tax year.*2025/)).toBeInTheDocument();
  });

  it("falls back to defaults when localStorage contains null JSON", () => {
    // JSON.parse("null") === null → sanitizeInputs early return → DEFAULT_INPUTS
    localStorage.setItem(STORAGE_KEY, JSON.stringify(null));
    render(<App />);
    expect(screen.getByText(/Tax year.*2025/)).toBeInTheDocument();
  });
});
