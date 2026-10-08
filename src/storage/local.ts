/** Thin localStorage wrapper. Swap this module to migrate to a remote backend. */
export const STORAGE_PREFIX = "qdeck:v1:";
const LEGACY_PREFIX = "searchdeck:v1:";

function storageKey(key: string): string {
  const next = STORAGE_PREFIX + key;
  if (typeof window === "undefined") return next;
  if (window.localStorage.getItem(next) == null) {
    const prev = window.localStorage.getItem(LEGACY_PREFIX + key);
    if (prev != null) window.localStorage.setItem(next, prev);
  }
  return next;
}

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(storageKey(key));
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function hasKey(key: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(storageKey(key)) != null;
}

export function writeJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(key), JSON.stringify(value));
  } catch (e) {
    console.warn("QDECK: failed to persist", key, e);
  }
}

export function removeKey(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_PREFIX + key);
}
