import { beforeEach, describe, expect, it } from "vitest";

import {
  formatCurrency,
  formatPercent,
  formatRoundedCurrency,
  formatSignedCurrency,
} from "@/components/format";
import { setLocale } from "@/paraglide/runtime";

describe("format helpers", () => {
  beforeEach(() => {
    setLocale("en", { reload: false });
  });

  it("formats currency with the active locale", () => {
    expect(formatCurrency(1234.56)).toBe(
      (1234.56).toLocaleString("en", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2,
      }),
    );

    setLocale("nl", { reload: false });

    expect(formatCurrency(1234.56)).toBe(
      (1234.56).toLocaleString("nl", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2,
      }),
    );
  });

  it("formats rounded and signed currency consistently", () => {
    expect(formatRoundedCurrency(1234.56)).toBe(
      (1234.56).toLocaleString("en", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }),
    );
    expect(formatSignedCurrency(99.4)).toBe(
      `+${(99.4).toLocaleString("en", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      })}`,
    );
    expect(formatSignedCurrency(-99.4)).toBe(
      `−${(99.4).toLocaleString("en", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      })}`,
    );
  });

  it("formats percentages with configurable precision", () => {
    expect(formatPercent(0.1234)).toBe("12.34%");
    expect(formatPercent(0.1234, 1)).toBe("12.3%");
  });
});
