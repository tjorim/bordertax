import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
} from "@tanstack/react-router";
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
import { LazyLoading, RouteLoadError } from "@/components/LazyBoundary";
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

  describe("chunk loading", () => {
    function buildRouter(load: () => Promise<{ default: () => React.ReactNode }>) {
      const root = createRootRoute();
      const page = createRoute({
        getParentRoute: () => root,
        path: "/page",
        component: lazyRouteComponent(load),
      });
      return createRouter({
        routeTree: root.addChildren([page]),
        history: createMemoryHistory({ initialEntries: ["/page"] }),
        defaultPendingMs: 0,
        defaultPendingComponent: LazyLoading,
        defaultErrorComponent: RouteLoadError,
      });
    }

    it("announces a slow chunk, then renders it", async () => {
      let resolve!: (module: { default: () => React.ReactNode }) => void;
      const slow = buildRouter(() => new Promise((r) => (resolve = r)));
      render(<RouterProvider router={slow} />);
      expect(await screen.findByRole("status", { name: "Loading" })).toBeInTheDocument();
      resolve({ default: () => <p>page loaded</p> });
      expect(await screen.findByText("page loaded")).toBeInTheDocument();
    });

    it("offers recovery when the chunk fails and loads it on retry", async () => {
      const load = vi
        .fn<() => Promise<{ default: () => React.ReactNode }>>()
        .mockRejectedValueOnce(new TypeError("network down"))
        .mockResolvedValue({ default: () => <p>page loaded</p> });
      const flaky = buildRouter(load);
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      try {
        render(<RouterProvider router={flaky} />);
        expect(await screen.findByRole("alert")).toHaveTextContent(
          "This section could not be loaded",
        );
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(await screen.findByText("page loaded")).toBeInTheDocument();
        expect(load).toHaveBeenCalledTimes(2);
      } finally {
        consoleError.mockRestore();
      }
    });
  });
});
