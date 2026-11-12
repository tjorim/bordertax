import { describe, expect, it, vi } from "vitest";
import { LEGACY_STORAGE_KEY, STORAGE_KEY, readSavedInputs } from "@/lib/inputStorage";

describe("readSavedInputs", () => {
  it("returns null when nothing is saved", () => {
    expect(readSavedInputs()).toBeNull();
  });

  it("reads the current key without touching anything else", () => {
    localStorage.setItem(STORAGE_KEY, '{"year":2024}');
    expect(readSavedInputs()).toBe('{"year":2024}');
  });

  it("copies the legacy value to the current key and removes the legacy key", () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, '{"year":2022}');
    expect(readSavedInputs()).toBe('{"year":2022}');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{"year":2022}');
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    expect(readSavedInputs()).toBe('{"year":2022}');
  });

  it("prefers the current value and discards the legacy one", () => {
    localStorage.setItem(STORAGE_KEY, '{"year":2024}');
    localStorage.setItem(LEGACY_STORAGE_KEY, '{"year":2022}');
    expect(readSavedInputs()).toBe('{"year":2024}');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{"year":2024}');
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
  });

  it("keeps the legacy copy when the current key cannot be written", () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, '{"year":2022}');
    const spy = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    try {
      expect(readSavedInputs()).toBe('{"year":2022}');
    } finally {
      spy.mockRestore();
    }
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBe('{"year":2022}');
  });
});
