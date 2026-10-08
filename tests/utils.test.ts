import { describe, expect, it } from "vitest";
import { cn } from "../src/lib/utils";

describe("cn", () => {
  it("merges prefixed Tailwind utilities and conditional classes", () => {
    expect(cn("tw:rounded-sm tw:p-4", false, { "tw:p-0": true })).toBe("tw:rounded-sm tw:p-0");
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
