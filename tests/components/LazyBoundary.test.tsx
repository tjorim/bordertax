import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LazyBoundary, lazyView } from "@/components/LazyBoundary";
import { setLocale } from "@/paraglide/runtime";

interface Props {
  label: string;
}

function Loaded({ label }: { label: string }) {
  return <p>{label} loaded</p>;
}

function Harness({ view }: { view: ReturnType<typeof lazyView<Props>> }) {
  const Component = view.Component;
  return (
    <LazyBoundary view={view}>
      <Component label="chart" />
    </LazyBoundary>
  );
}

describe("LazyBoundary", () => {
  beforeEach(() => {
    setLocale("en", { reload: false });
  });

  it("shows an announced loading state while a slow import is pending", async () => {
    let resolve!: (module: { default: typeof Loaded }) => void;
    const view = lazyView<Props>(
      () => new Promise<{ default: typeof Loaded }>((r) => (resolve = r)),
    );
    render(<Harness view={view} />);

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
    expect(screen.queryByText("chart loaded")).not.toBeInTheDocument();

    await act(async () => resolve({ default: Loaded }));
    expect(await screen.findByText("chart loaded")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("recovers from a failed import when the user retries", async () => {
    const load = vi
      .fn<() => Promise<{ default: typeof Loaded }>>()
      .mockRejectedValueOnce(new Error("Failed to fetch dynamically imported module"))
      .mockResolvedValue({ default: Loaded });
    const view = lazyView<Props>(load);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      render(<Harness view={view} />);

      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("This section could not be loaded");
      expect(screen.getByRole("button", { name: "Reload page" })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
      expect(await screen.findByText("chart loaded")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(load).toHaveBeenCalledTimes(2);
    } finally {
      consoleError.mockRestore();
    }
  });

  it("keeps showing the error when the retry fails too", async () => {
    const load = vi
      .fn<() => Promise<{ default: typeof Loaded }>>()
      .mockRejectedValue(new Error("offline"));
    const view = lazyView<Props>(load);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      render(<Harness view={view} />);
      await screen.findByRole("alert");
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
      await screen.findByRole("alert");
      await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    } finally {
      consoleError.mockRestore();
    }
  });

  it("localizes the failure message", async () => {
    setLocale("nl", { reload: false });
    const view = lazyView<Props>(() => Promise.reject(new Error("offline")));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      render(<Harness view={view} />);
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Dit onderdeel kon niet worden geladen",
      );
      expect(screen.getByRole("button", { name: "Opnieuw proberen" })).toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
    }
  });

  it("preloads once without rendering and swallows preload failures", async () => {
    const load = vi
      .fn<() => Promise<{ default: typeof Loaded }>>()
      .mockRejectedValue(new Error("offline"));
    const view = lazyView<Props>(load);
    view.preload();
    await new Promise((r) => setTimeout(r));
    expect(load).toHaveBeenCalledTimes(1);
    view.preload();
    expect(load).toHaveBeenCalledTimes(2);
  });
});
