import { describe, expect, it } from "vitest";
import { cn } from "../src/lib/utils";

describe("cn", () => {
  it("merges Tailwind utilities and conditional classes", () => {
    expect(cn("rounded-sm p-4", false, { "p-0": true })).toBe("rounded-sm p-0");
  });
});

describe("badge typography tokens", () => {
  it("keeps font size and color as independent utilities", () => {
    expect(cn("text-badge", "text-brand-light")).toBe("text-badge text-brand-light");
    expect(cn("text-badge text-text-muted", "text-badge-label")).toBe(
      "text-text-muted text-badge-label",
    );
  });
});
