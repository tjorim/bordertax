import { render, screen } from "@testing-library/react";
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

import ReferenceOverview from "@/pages/ReferenceOverview";
import SalarySplitReference from "@/pages/SalarySplitReference";
import PensionReference from "@/pages/PensionReference";
import { setLocale } from "@/paraglide/runtime";

describe("ReferenceOverview", () => {
  beforeEach(() => {
    setLocale("en", { reload: false });
  });

  it("renders without crashing", () => {
    render(<ReferenceOverview />);
    expect(document.body).toBeDefined();
  });

  it("shows the page title", () => {
    render(<ReferenceOverview />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("shows links to both reference sections", () => {
    render(<ReferenceOverview />);
    expect(screen.getByRole("link", { name: /salary split/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /pension/i })).toBeInTheDocument();
  });
});

describe("SalarySplitReference", () => {
  beforeEach(() => {
    setLocale("en", { reload: false });
  });

  it("renders without crashing", () => {
    render(<SalarySplitReference />);
    expect(document.body).toBeDefined();
  });

  it("shows the page heading", () => {
    render(<SalarySplitReference />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders the language toggle button", () => {
    render(<SalarySplitReference />);
    expect(
      screen.getByRole("button", { name: /english|nederlands|language|taal|^nl$|^en$/i }),
    ).toBeInTheDocument();
  });

  it("renders the home nav link", () => {
    render(<SalarySplitReference />);
    expect(screen.getByRole("link", { name: /bordertax/i })).toBeInTheDocument();
  });

  it("switches locale and re-renders in Dutch", () => {
    setLocale("nl", { reload: false });
    render(<SalarySplitReference />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });
});

describe("PensionReference", () => {
  beforeEach(() => {
    setLocale("en", { reload: false });
  });

  it("renders without crashing", () => {
    render(<PensionReference />);
    expect(document.body).toBeDefined();
  });

  it("shows the page heading", () => {
    render(<PensionReference />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders the language toggle button", () => {
    render(<PensionReference />);
    expect(
      screen.getByRole("button", { name: /english|nederlands|language|taal|^nl$|^en$/i }),
    ).toBeInTheDocument();
  });

  it("renders the home nav link", () => {
    render(<PensionReference />);
    expect(screen.getByRole("link", { name: /bordertax/i })).toBeInTheDocument();
  });

  it("switches locale and re-renders in Dutch", () => {
    setLocale("nl", { reload: false });
    render(<PensionReference />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });
});

/** Intl may use no-break spaces (€ 3.115); compare on plain spaces. */
const pageText = () => (document.body.textContent ?? "").replace(/\s+/g, " ");

describe("reference figures come from typed data, formatted per locale", () => {
  it("shows the salary-split figures in English", () => {
    setLocale("en", { reload: false });
    render(<SalarySplitReference />);
    const text = pageText();
    // Derived from the 2026 year module (src/tax/years/2026.ts).
    expect(text).toContain("NL Tax Rates 2026");
    expect(text).toContain("€0 – €38,883");
    expect(text).toContain("35.75%");
    expect(text).toContain("37.56%");
    expect(text).toContain("49.50%");
    expect(text).toContain("27.65% SI + 8.10% IT");
    expect(text).toContain("max €3,115");
    expect(text).toContain("Expires at income > €78,426");
    expect(text).toContain("max €5,685");
    expect(text).toContain("Zero at income ≥ €132,920");
    expect(text).toContain("max over €38,883");
    // ACV worked example.
    expect(text).toContain("Net benefit: +€1,037");
    expect(text).toContain("50/205 = 24.4%");
    expect(text).toContain("1 July 2023");
    // Income year and sources in the fixed place.
    expect(text).toContain("Income year 2026");
    expect(text).toContain("Source: ACV information session 24 March 2026, Pelt");
  });

  it("shows the salary-split figures in Dutch", () => {
    setLocale("nl", { reload: false });
    render(<SalarySplitReference />);
    const text = pageText();
    expect(text).toContain("NL Belastingtarieven 2026");
    expect(text).toContain("€ 0 – € 38.883");
    expect(text).toContain("35,75%");
    expect(text).toContain("27,65% VV + 8,10% LB");
    expect(text).toContain("max € 3.115");
    expect(text).toContain("Vervalt bij inkomen > € 78.426");
    expect(text).toContain("Netto voordeel: +€ 1.037");
    expect(text).toContain("50/205 = 24,4%");
    expect(text).toContain("1 juli 2023");
    expect(text).toContain("Inkomstenjaar 2026");
    expect(text).toContain("Bron: ACV-infosessie 24 maart 2026, Pelt");
  });

  it("shows the pension figures in English", () => {
    setLocale("en", { reload: false });
    render(<PensionReference />);
    const text = pageText();
    expect(text).toContain("€1,637.57");
    expect(text).toContain("€106.55 × 12");
    expect(text).toContain("17.9%");
    expect(text).toContain("on max €38,883, included in wage tax");
    expect(text).toContain("67 years + 3 months");
    expect(text).toContain("±€982/month");
    expect(text).toContain("0.5%–2%");
    expect(text).toContain("Income year 2026");
    expect(text).toContain("24 March 2026");
  });

  it("shows the pension figures in Dutch", () => {
    setLocale("nl", { reload: false });
    render(<PensionReference />);
    const text = pageText();
    expect(text).toContain("€ 1.637,57");
    expect(text).toContain("€ 106,55 × 12");
    expect(text).toContain("17,9%");
    expect(text).toContain("over max € 38.883, vervat in loonheffing");
    expect(text).toContain("67 jaar + 3 maanden");
    expect(text).toContain("±€ 982/mnd");
    expect(text).toContain("0,5%–2%");
    expect(text).toContain("Inkomstenjaar 2026");
    expect(text).toContain("24 maart 2026");
  });
});
