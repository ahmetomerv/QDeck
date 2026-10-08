import type { DueState, Frequency, SearchQuery } from "./types";

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

export const FREQUENCY_HOURS: Record<Frequency, number> = {
  daily: 24,
  "every-2-days": 48,
  "twice-weekly": 84,
  weekly: 168,
  manual: Number.POSITIVE_INFINITY,
};

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  daily: "Daily",
  "every-2-days": "Every 2 days",
  "twice-weekly": "Twice weekly",
  weekly: "Weekly",
  manual: "Manual",
};

export function intervalMs(f: Frequency): number {
  return FREQUENCY_HOURS[f] * HOUR;
}

/**
 * never   – has never been run (scheduled frequencies only)
 * due     – interval elapsed
 * overdue – two intervals elapsed
 * fresh   – run within interval
 * manual  – manual frequency, never auto-due
 */
export function getDueState(q: Pick<SearchQuery, "lastRunAt" | "frequency">, now: number): DueState {
  if (q.frequency === "manual") return "manual";
  if (q.lastRunAt == null) return "never";
  const elapsed = now - q.lastRunAt;
  const iv = intervalMs(q.frequency);
  if (elapsed >= iv * 2) return "overdue";
  if (elapsed >= iv) return "due";
  return "fresh";
}

export function isDue(q: SearchQuery, now: number): boolean {
  if (q.status !== "active") return false;
  const s = getDueState(q, now);
  return s === "never" || s === "due" || s === "overdue";
}

export function nextDueAt(q: SearchQuery): number | null {
  if (q.frequency === "manual") return null;
  if (q.lastRunAt == null) return null;
  return q.lastRunAt + intervalMs(q.frequency);
}

export function startOfDay(now: number): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function searchedToday(q: SearchQuery, now: number): boolean {
  return q.lastRunAt != null && q.lastRunAt >= startOfDay(now);
}

export function daysSince(ts: number, now: number): number {
  return Math.floor((now - ts) / DAY);
}
