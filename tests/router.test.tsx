import { render, screen, waitFor } from "@testing-library/react";
import { RouterProvider } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/paraglide/runtime", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    shouldRedirect: vi.fn().mockResolvedValue({ shouldRedirect: false }),
    deLocalizeUrl: vi.fn((url: URL) => url),
    localizeUrl: vi.fn((url: URL) => url),
  };
});

import { router } from "@/router";
import { setLocale } from "@/paraglide/runtime";

describe("Router", () => {
  beforeEach(() => {
    localStorage.clear();
    setLocale("en", { reload: false });
  });

  it("renders the index route at /", async () => {
    render(<RouterProvider router={router} />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /english|nederlands|language|taal|^nl$|^en$/i }),
      ).toBeInTheDocument();
    });
  });
});
