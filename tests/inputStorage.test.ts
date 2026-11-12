import { describe, expect, it, vi } from "vitest";
import {
  LEGACY_STORAGE_KEY,
  STORAGE_KEY,
  V1_STORAGE_KEY,
  migrateV1StoredInputs,
  readSavedInputs,
} from "@/lib/inputStorage";

const v1Value = JSON.stringify({
  year: 2022,
  residentCountry: "BE",
  civilStatus: "single",
  dependentChildren: 2,
  belowAOWAge: true,
  belgianRegion: "flemish",
  communalTaxRate: 8,
  thirtyPercentRuling: false,
});
const v2Value = JSON.stringify({
  year: 2022,
  dependentChildren: 2,
  belowAOWAge: true,
  communalTaxRate: 8,
});

describe("readSavedInputs", () => {
  it("uses a version 2 key", () => {
    expect(STORAGE_KEY).toBe("bt-inputs-v2");
    expect(V1_STORAGE_KEY).toBe("bt-inputs-v1");
  });

  it("returns null when nothing is saved", () => {
    expect(readSavedInputs()).toBeNull();
  });

  it("reads the current key without touching anything else", () => {
    localStorage.setItem(STORAGE_KEY, '{"year":2024}');
    expect(readSavedInputs()).toBe('{"year":2024}');
  });

  it("migrates the version 1 value to the current key once and removes the old key", () => {
    localStorage.setItem(V1_STORAGE_KEY, v1Value);
    expect(readSavedInputs()).toBe(v2Value);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(v2Value);
    expect(localStorage.getItem(V1_STORAGE_KEY)).toBeNull();
    expect(readSavedInputs()).toBe(v2Value);
  });

  it("migrates the pre-Bordertax value the same way", () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, v1Value);
    expect(readSavedInputs()).toBe(v2Value);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(v2Value);
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
  });

  it("prefers the version 1 key over the older legacy key and removes both", () => {
    localStorage.setItem(V1_STORAGE_KEY, JSON.stringify({ year: 2023 }));
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({ year: 2021 }));
    expect(readSavedInputs()).toBe('{"year":2023}');
    expect(localStorage.getItem(V1_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
  });

  it("prefers the current value and discards the earlier ones", () => {
    localStorage.setItem(STORAGE_KEY, '{"year":2024}');
    localStorage.setItem(V1_STORAGE_KEY, v1Value);
    localStorage.setItem(LEGACY_STORAGE_KEY, '{"year":2022}');
    expect(readSavedInputs()).toBe('{"year":2024}');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{"year":2024}');
    expect(localStorage.getItem(V1_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
  });

  it("drops an unreadable earlier value", () => {
    localStorage.setItem(V1_STORAGE_KEY, "{not json");
    expect(readSavedInputs()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(V1_STORAGE_KEY)).toBeNull();
  });

  it("keeps the earlier copy when the current key cannot be written", () => {
    localStorage.setItem(V1_STORAGE_KEY, v1Value);
    const spy = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    try {
      expect(readSavedInputs()).toBe(v2Value);
    } finally {
      spy.mockRestore();
    }
    expect(localStorage.getItem(V1_STORAGE_KEY)).toBe(v1Value);
  });
});

describe("migrateV1StoredInputs", () => {
  it("drops the single-value fields and keeps the rest", () => {
    expect(migrateV1StoredInputs(v1Value)).toBe(v2Value);
  });

  it("rejects values that are not a JSON object", () => {
    expect(migrateV1StoredInputs("[1]")).toBeNull();
    expect(migrateV1StoredInputs("null")).toBeNull();
    expect(migrateV1StoredInputs("nope")).toBeNull();
  });
});
