import { describe, expect, it } from "vitest";
import { cn } from "../src/lib/utils";

describe("cn during the Bootstrap migration", () => {
  it("merges prefixed Tailwind utilities without removing Bootstrap classes", () => {
    expect(cn("btn p-3 tw:p-4", false, { "tw:p-0": true })).toBe("btn p-3 tw:p-0");
  });
});

describe("badge typography tokens", () => {
  it("keeps font size and color as independent utilities", () => {
    expect(cn("tw:text-badge", "tw:text-brand-light")).toBe("tw:text-badge tw:text-brand-light");
    expect(cn("tw:text-badge tw:text-text-muted", "tw:text-badge-label")).toBe(
      "tw:text-text-muted tw:text-badge-label",
    );
  });
});
