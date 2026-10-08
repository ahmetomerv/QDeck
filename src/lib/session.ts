import type { LaneId, PlatformFamily, SearchQuery, SearchSession, Settings } from "./types";
import { familyOf } from "@/data/platforms";
import { isDue } from "./queryScheduler";
import { rankQueries } from "./queryRanking";
import { uid } from "./utils";

export interface SessionFilters {
  scope: "due" | "all";
  lanes: LaneId[];
  families: PlatformFamily[];
  location: string; // "" = any
  favorites: boolean;
}

export const EMPTY_FILTERS: SessionFilters = {
  scope: "due",
  lanes: [],
  families: [],
  location: "",
  favorites: false,
};

function matchesLocation(q: SearchQuery, loc: string) {
  if (!loc) return true;
  if (loc === "Munich") return q.locations.some((l) => l === "Munich" || l === "München");
  return q.locations.includes(loc);
}

export function filterSessionQueries(
  qs: SearchQuery[],
  f: SessionFilters,
  now: number,
  settings: Pick<Settings, "atsPriority">,
): SearchQuery[] {
  const list = qs.filter(
    (q) =>
      q.status === "active" &&
      (f.scope === "all" || isDue(q, now)) &&
      (!f.lanes.length || f.lanes.includes(q.lane)) &&
      (!f.families.length || f.families.includes(familyOf(q.platform))) &&
      matchesLocation(q, f.location) &&
      (!f.favorites || q.favorite),
  );
  return rankQueries(list, now, settings);
}

export function createSession(ids: string[], label: string, now: number): SearchSession {
  return { id: uid(), label, startedAt: now, completedAt: null, queryIds: ids, completedIds: [], skippedIds: [], laterIds: [], index: 0 };
}

export function currentQueryId(s: SearchSession): string | null {
  return s.index < s.queryIds.length ? (s.queryIds[s.index] ?? null) : null;
}

export function advanceSession(s: SearchSession, kind: "done" | "skip", now: number): SearchSession {
  const id = currentQueryId(s);
  if (!id) return s;
  const next: SearchSession = {
    ...s,
    index: s.index + 1,
    completedIds: kind === "done" ? [...s.completedIds, id] : s.completedIds,
    skippedIds: kind === "skip" ? [...s.skippedIds, id] : s.skippedIds,
  };
  if (next.index >= next.queryIds.length) next.completedAt = now;
  return next;
}

/** Move the current query to the end of the queue. No-op if it's already last. */
export function deferCurrent(s: SearchSession): SearchSession {
  if (s.index >= s.queryIds.length - 1) return s;
  const ids = [...s.queryIds];
  const id = ids.splice(s.index, 1)[0]!;
  ids.push(id);
  return { ...s, queryIds: ids, laterIds: s.laterIds.includes(id) ? s.laterIds : [...s.laterIds, id] };
}
