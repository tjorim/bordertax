/** Where the persisted form inputs live in localStorage. */
export const STORAGE_KEY = "bt-inputs-v2";

/** Key of input schema version 1; read once, migrated to the current key and removed. */
export const V1_STORAGE_KEY = "bt-inputs-v1";

/** Key used before the Bordertax name (same shape as version 1); read once and removed. */
export const LEGACY_STORAGE_KEY = "grensarbeider-tax-inputs-v1";

/** Fields version 1 stored that only have one legal value; version 2 no longer stores them. */
const V1_DROPPED_FIELDS = ["residentCountry", "civilStatus", "belgianRegion", "thirtyPercentRuling"];

/**
 * Version 1 stored the persisted inputs under their unchanged names plus the single-value fields.
 * Returns the version 2 value, or null when the stored text is not a JSON object.
 */
export function migrateV1StoredInputs(raw: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
  const migrated: Record<string, unknown> = { ...parsed };
  for (const field of V1_DROPPED_FIELDS) delete migrated[field];
  return JSON.stringify(migrated);
}

/** Earlier keys, newest first, each with the step from its value to the current one. */
const PREVIOUS_KEYS: readonly { key: string; migrate: (raw: string) => string | null }[] = [
  { key: V1_STORAGE_KEY, migrate: migrateV1StoredInputs },
  { key: LEGACY_STORAGE_KEY, migrate: migrateV1StoredInputs },
];

/**
 * Raw persisted inputs, moving a value saved under an earlier key to the current one once.
 * A value already stored under the current key wins and the earlier ones are simply discarded;
 * otherwise the newest earlier value is migrated. Throws when storage is unavailable; callers
 * fall back to defaults.
 */
export function readSavedInputs(): string | null {
  const current = localStorage.getItem(STORAGE_KEY);
  const previous = PREVIOUS_KEYS.map(({ key, migrate }) => ({
    key,
    migrate,
    value: localStorage.getItem(key),
  })).filter((entry) => entry.value !== null);
  if (previous.length === 0) return current;
  let result = current;
  if (current === null) {
    const newest = previous[0]!;
    result = newest.migrate(newest.value!);
    if (result !== null) {
      try {
        localStorage.setItem(STORAGE_KEY, result);
      } catch {
        // Keep the earlier copies so the next load can try again; still use the value now.
        return result;
      }
    }
  }
  for (const { key } of previous) localStorage.removeItem(key);
  return result;
}
