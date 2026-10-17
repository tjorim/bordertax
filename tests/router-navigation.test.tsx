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

describe("Lazy reference routes", () => {
  beforeEach(() => {
    setLocale("en", { reload: false });
  });

  it("loads reference pages on direct navigation and across back/forward", async () => {
    await router.navigate({ to: "/reference" });
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/reference");

    await router.navigate({ to: "/reference/pension" });
    await waitFor(() => expect(router.state.location.pathname).toBe("/reference/pension"));
    await waitFor(() => expect(document.querySelector("h1")).not.toBeNull());

    router.history.back();
    await waitFor(() => expect(router.state.location.pathname).toBe("/reference"));
    router.history.forward();
    await waitFor(() => expect(router.state.location.pathname).toBe("/reference/pension"));
  });
});
