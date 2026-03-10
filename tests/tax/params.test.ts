import { describe, expect, it } from "vitest";

import { getBEYearParams, getNLYearParams, getYearParams, TAX_PARAMS } from "@/tax/params";

describe("tax params", () => {
  it("returns the combined year params for a supported year", () => {
    expect(getYearParams(2025)).toBe(TAX_PARAMS[2025]);
  });

  it("returns the NL age-specific params for a supported year", () => {
    expect(getNLYearParams(2025, true)).toBe(TAX_PARAMS[2025].nl.under);
    expect(getNLYearParams(2025, false)).toBe(TAX_PARAMS[2025].nl.over);
  });

  it("returns the BE params for a supported year", () => {
    expect(getBEYearParams(2025)).toBe(TAX_PARAMS[2025].be);
  });

  it("throws for unsupported years", () => {
    expect(() => getYearParams(2030 as never)).toThrow(/Unsupported tax year/);
    expect(() => getNLYearParams(2030 as never, true)).toThrow(/Unsupported tax year/);
    expect(() => getBEYearParams(2030 as never)).toThrow(/Unsupported tax year/);
  });
});
