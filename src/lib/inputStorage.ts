/** Where the persisted form inputs live in localStorage. */
export const STORAGE_KEY = "bt-inputs-v1";

/** Key used before the Bordertax name; read once and removed. */
export const LEGACY_STORAGE_KEY = "grensarbeider-tax-inputs-v1";

/**
 * Raw persisted inputs, moving a value saved under the legacy key to the current one.
 * A value already stored under the current key wins and the legacy one is simply discarded.
 * Throws when storage is unavailable; callers fall back to defaults.
 */
export function readSavedInputs(): string | null {
  const current = localStorage.getItem(STORAGE_KEY);
  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy === null) return current;
  if (current === null) {
    try {
      localStorage.setItem(STORAGE_KEY, legacy);
    } catch {
      // Keep the legacy copy so the next load can try again; still use it now.
      return legacy;
    }
  }
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  return current ?? legacy;
}
