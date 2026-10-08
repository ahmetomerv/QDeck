import { format } from "date-fns";
import { startOfDay } from "./queryScheduler";

export function relTime(ts: number | null, now: number): string {
  if (ts == null) return "Never";
  const d = Math.max(0, now - ts);
  const m = Math.floor(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

export function lastSearched(ts: number | null, now: number): string {
  if (ts == null) return "Never";
  if (ts >= startOfDay(now)) return `Today at ${format(ts, "HH:mm")}`;
  return relTime(ts, now);
}

export const fmtStamp = (ts: number) => format(ts, "MMM d  HH:mm");
export const fmtDate = (ts: number) => format(ts, "MMM d, yyyy");

export function fmtDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

export function greeting(now: number): string {
  const h = new Date(now).getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** Split a query into display lines at top-level boundaries (sites, groups, phrases). */
export function formatQueryLines(query: string): string[] {
  const tokens: string[] = [];
  let cur = "";
  let depth = 0;
  let inQ = false;
  for (const ch of query.replace(/\s+/g, " ").trim()) {
    if (ch === '"') inQ = !inQ;
    if (!inQ && ch === "(") depth++;
    if (!inQ && ch === ")") depth = Math.max(0, depth - 1);
    if (ch === " " && depth === 0 && !inQ) {
      if (cur) tokens.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (cur) tokens.push(cur);
  const lines: string[] = [];
  let plain: string[] = [];
  const excl: string[] = [];
  const flush = () => {
    if (plain.length) lines.push(plain.join(" "));
    plain = [];
  };
  for (const t of tokens) {
    if (t.startsWith("-") && t.length > 1) excl.push(t);
    else if (t.startsWith("site:") || t.startsWith("(") || t.startsWith('"')) {
      flush();
      lines.push(t);
    } else plain.push(t);
  }
  flush();
  if (excl.length) lines.push(excl.join(" "));
  return lines;
}
