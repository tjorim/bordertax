import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SortHeaderButton } from "@/components/results/SortHeaderButton";

describe("SortHeaderButton", () => {
  it("renders an accessible button that calls onClick", async () => {
    const onClick = vi.fn();
    render(
      <SortHeaderButton sorted={false} onClick={onClick}>
        Gross
      </SortHeaderButton>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Gross" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("shows a decorative arrow only while sorted", () => {
    const { container, rerender } = render(
      <SortHeaderButton sorted={false} onClick={undefined}>
        Gross
      </SortHeaderButton>,
    );
    expect(container.querySelector("svg")).toBeNull();
    rerender(
      <SortHeaderButton sorted="asc" onClick={undefined}>
        Gross
      </SortHeaderButton>,
    );
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
