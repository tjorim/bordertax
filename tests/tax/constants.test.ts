import { describe, expect, it } from "vitest";

import {
  VALID_BELGIAN_REGIONS,
  VALID_CIVIL_STATUSES,
  VALID_RESIDENT_COUNTRIES,
  VALID_YEARS,
} from "@/tax/constants";

describe("tax constants", () => {
  it("exports the supported tax years in ascending order", () => {
    expect(VALID_YEARS).toEqual([2020, 2021, 2022, 2023, 2024, 2025, 2026]);
  });

  it("exports the supported resident countries", () => {
    expect(VALID_RESIDENT_COUNTRIES).toEqual(["BE", "NL"]);
  });

  it("exports the supported civil statuses", () => {
    expect(VALID_CIVIL_STATUSES).toEqual(["single", "married"]);
  });

  it("exports the supported Belgian regions", () => {
    expect(VALID_BELGIAN_REGIONS).toEqual(["flemish", "walloon", "brussels"]);
  });
});
