import { LANE_BY_ID } from "@/data/lanes";
import { familyOf } from "@/data/platforms";
import { getDueState, intervalMs, isDue } from "./queryScheduler";
import type { Priority, SearchQuery, Settings } from "./types";

const PRIORITY_SCORE: Record<Priority, number> = { critical: 25, high: 15, normal: 5, low: 0 };

/** Deterministic usefulness score. Higher = run sooner. Paused/archived = -Infinity. */
export function scoreQuery(q: SearchQuery, now: number, settings: Pick<Settings, "atsPriority">): number {
  if (q.status !== "active") return Number.NEGATIVE_INFINITY;
  const state = getDueState(q, now);
  let s = 0;
  if (state === "never") s += 50;
  else if (state === "overdue") s += 30;
  else if (state === "due") s += 20;
  else if (state === "manual") s -= 30;
  else if (state === "fresh" && q.lastRunAt != null) {
    const frac = Math.min(1, (now - q.lastRunAt) / intervalMs(q.frequency));
    s -= 10 + 40 * (1 - frac); // just searched → strong penalty, fades toward due
  }
  s += PRIORITY_SCORE[q.priority];
  s += LANE_BY_ID[q.lane]?.weight ?? 0;
  const fam = familyOf(q.platform);
  const idx = settings.atsPriority.indexOf(fam);
  if (idx >= 0) s += settings.atsPriority.length - idx;
  else if (fam === "multi") s += 4;
  else s += 3;
  if (fam === "ashby") s += 5;
  if (q.favorite) s += 5;
  return s;
}

export function rankQueries(
  qs: SearchQuery[],
  now: number,
  settings: Pick<Settings, "atsPriority">,
): SearchQuery[] {
  return qs
    .filter((q) => q.status === "active")
    .map((q) => ({ q, s: scoreQuery(q, now, settings) }))
    .sort((a, b) => b.s - a.s || a.q.name.localeCompare(b.q.name))
    .map((x) => x.q);
}

export function recommendedQueries(
  qs: SearchQuery[],
  now: number,
  settings: Pick<Settings, "atsPriority">,
  limit = 8,
): SearchQuery[] {
  return rankQueries(qs.filter((q) => isDue(q, now)), now, settings).slice(0, limit);
}
