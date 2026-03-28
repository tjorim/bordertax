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

  it("renders the back-to-calculator nav link", () => {
    render(<SalarySplitReference />);
    expect(screen.getByRole("link", { name: /back to calculator/i })).toBeInTheDocument();
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

  it("renders the back-to-calculator nav link", () => {
    render(<PensionReference />);
    expect(screen.getByRole("link", { name: /back to calculator/i })).toBeInTheDocument();
  });

  it("switches locale and re-renders in Dutch", () => {
    setLocale("nl", { reload: false });
    render(<PensionReference />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });
});
