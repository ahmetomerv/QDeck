import type { SearchQuery } from "./types";

/** Canonical form for exact duplicate detection. */
export function normalizeQuery(q: string): string {
  return q
    .replace(/[“”„«»]/g, '"')
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
    .toLowerCase();
}

/** Token set (order-insensitive) used for fuzzy similarity. */
export function tokenSet(q: string): Set<string> {
  const n = normalizeQuery(q).replace(/[()]/g, " ");
  const tokens = n.match(/"[^"]*"|\S+/g) ?? [];
  return new Set(tokens.filter((t) => t !== "or"));
}

export function similarity(a: string, b: string): number {
  const A = tokenSet(a);
  const B = tokenSet(b);
  if (!A.size && !B.size) return 1;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

export interface DuplicateResult {
  exact?: SearchQuery | undefined;
  similar: SearchQuery[];
}

export function findDuplicates(query: string, all: SearchQuery[], excludeId?: string): DuplicateResult {
  const norm = normalizeQuery(query);
  const pool = all.filter((q) => q.id !== excludeId);
  const exact = pool.find((q) => normalizeQuery(q.query) === norm);
  const similar = exact
    ? []
    : pool
        .map((q) => ({ q, s: similarity(query, q.query) }))
        .filter((x) => x.s >= 0.8)
        .sort((a, b) => b.s - a.s)
        .slice(0, 3)
        .map((x) => x.q);
  return { exact, similar };
}
