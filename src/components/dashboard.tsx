import { useMemo } from "react";
import { Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LANES } from "@/data/lanes";
import { FAMILY_LABEL, familyOf, titleWithPlatform } from "@/data/platforms";
import { lastSearched } from "@/lib/format";
import { DAY, FREQUENCY_LABEL, getDueState, isDue } from "@/lib/queryScheduler";
import type { PlatformFamily, SearchQuery } from "@/lib/types";
import { cn } from "@/lib/utils";
import { completeQuery, runQuery } from "@/state/actions";
import { DueBadge, LaneBadge, PlatformBadge } from "./Badges";
import { QueryText } from "./QueryText";

export function StatCard({ label, value, hint, accent }: { label: string; value: number | string; hint?: string; accent?: boolean }) {
  return (
    <div className="panel px-3 py-2.5">
      <div className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</div>
      <div className={cn("mt-0.5 font-mono text-2xl font-semibold tabular-nums", accent && "text-primary")}>{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function RecommendedSearches({ items, now }: { items: SearchQuery[]; now: number }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <span>Recommended searches</span>
        <span className="font-mono normal-case">{items.length} next</span>
      </div>
      {items.length === 0 ? (
        <div className="px-3 py-8 text-center text-xs text-muted-foreground">Nothing is due. Everything is fresh — nice.</div>
      ) : (
        <ol className="divide-y">
          {items.map((q, i) => (
            <li key={q.id} className="group flex items-start gap-3 px-3 py-2.5 hover:bg-muted/40">
              <span className="mt-0.5 w-4 font-mono text-[11px] text-muted-foreground">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[13px] font-medium">{q.name}</span>
                  <PlatformBadge platform={q.platform} />
                  <LaneBadge lane={q.lane} />
                  <DueBadge state={getDueState(q, now)} />
                </div>
                <QueryText query={q.query} truncate className="mt-1 text-muted-foreground" />
                <div className="mt-1 flex gap-3 text-[11px] text-muted-foreground">
                  <span>Last: {lastSearched(q.lastRunAt, now)}</span>
                  <span>{FREQUENCY_LABEL[q.frequency]}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button size="icon-sm" variant="ghost" title="Mark as completed" aria-label="Mark as completed" onClick={() => completeQuery(q.id)}>
                  <Check />
                </Button>
                <Button size="xs" variant="outline" onClick={() => runQuery(q.id)}>
                  <ExternalLink /> Run
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Bar({ value, total }: { value: number; total: number }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full", pct === 100 ? "bg-st-fresh" : "bg-primary/70")} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Coverage = share of scheduled active queries that are currently not due. */
export function CoveragePanel({ queries, now, order }: { queries: SearchQuery[]; now: number; order: PlatformFamily[] }) {
  const scheduled = useMemo(() => queries.filter((q) => q.status === "active" && q.frequency !== "manual"), [queries]);
  const fams = useMemo(() => {
    const all: PlatformFamily[] = [...order, "multi", "web"];
    return all
      .map((f) => {
        const qs = scheduled.filter((q) => familyOf(q.platform) === f);
        return { f, total: qs.length, done: qs.filter((q) => !isDue(q, now)).length };
      })
      .filter((x) => x.total);
  }, [scheduled, now, order]);
  const lanes = LANES.map((l) => {
    const qs = scheduled.filter((q) => q.lane === l.id);
    const done = qs.filter((q) => !isDue(q, now)).length;
    return { l, total: qs.length, done, pct: qs.length ? Math.round((done / qs.length) * 100) : 0 };
  });
  return (
    <section className="panel">
      <div className="panel-header">Today's coverage</div>
      <div className="space-y-1.5 px-3 py-2.5">
        {fams.map(({ f, total, done }) => (
          <div key={f} className="flex items-center gap-3 text-xs">
            <span className="w-28 truncate">{FAMILY_LABEL[f]}</span>
            <Bar value={done} total={total} />
            <span className="w-10 text-right font-mono text-[11px] text-muted-foreground tabular-nums">
              {done} / {total}
            </span>
          </div>
        ))}
      </div>
      <div className="space-y-1.5 border-t px-3 py-2.5">
        {lanes.map(({ l, done, total, pct }) => (
          <div key={l.id} className="flex items-center gap-3 text-xs">
            <span className="w-28 truncate" title={l.name}>
              {l.short}
            </span>
            <Bar value={done} total={total} />
            <span className="w-10 text-right font-mono text-[11px] text-muted-foreground tabular-nums">{pct}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function StaleSearches({ queries, now }: { queries: SearchQuery[]; now: number }) {
  const items = useMemo(() => {
    return queries
      .filter((q) => q.status === "active" && q.frequency !== "manual")
      .map((q) => ({ q, state: getDueState(q, now), days: q.lastRunAt ? Math.floor((now - q.lastRunAt) / DAY) : Infinity }))
      .filter((x) => x.state === "overdue" || x.state === "never" || (x.state === "due" && x.days >= 3))
      .sort((a, b) => {
        const rank = (s: string) => (s === "overdue" ? 0 : s === "due" ? 1 : 2);
        return rank(a.state) - rank(b.state) || b.days - a.days || a.q.name.localeCompare(b.q.name);
      });
  }, [queries, now]);
  const shown = items.slice(0, 6);
  return (
    <section className="panel">
      <div className="panel-header">
        <span>Needs attention</span>
        <span className="font-mono normal-case">{items.length}</span>
      </div>
      {shown.length === 0 ? (
        <div className="px-3 py-6 text-center text-xs text-muted-foreground">No stale searches.</div>
      ) : (
        <ul className="divide-y">
          {shown.map(({ q, state, days }) => (
            <li key={q.id} className="flex items-center gap-2 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">
                  {titleWithPlatform(q.name, q.platform)}
                </div>
                <div className={cn("text-[11px]", state === "overdue" ? "text-st-overdue" : state === "never" ? "text-st-never" : "text-st-due")}>
                  {state === "never" ? "Never searched" : `Not searched for ${days} day${days === 1 ? "" : "s"}`}
                </div>
              </div>
              <Button size="xs" variant="ghost" onClick={() => runQuery(q.id)}>
                Run now
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
