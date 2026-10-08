import type { SearchQuery } from "@/lib/types";
import { readJSON, writeJSON } from "./local";

const KEY = "queries";

/** Loads the local query library. A new device stays empty until onboarding writes one. */
export function loadQueries(): SearchQuery[] {
  return readJSON<SearchQuery[]>(KEY, []);
}

export function saveQueries(qs: SearchQuery[]): void {
  writeJSON(KEY, qs);
}
