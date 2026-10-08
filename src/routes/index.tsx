import { useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoveragePanel, RecommendedSearches, StaleSearches, StatCard } from "@/components/dashboard";
import { ATS_FAMILIES, FAMILY_LABEL, familyOf } from "@/data/platforms";
import { useNow, useQueries, useSavedJobs, useSearchSession, useSettings } from "@/hooks/useAppData";
import { greeting } from "@/lib/format";
import { isDue, searchedToday } from "@/lib/queryScheduler";
import { rankQueries, recommendedQueries } from "@/lib/queryRanking";
import type { PlatformFamily } from "@/lib/types";
import { startSession } from "@/state/actions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — QDECK" },
      { name: "description", content: "What to search next: due queries, coverage by ATS and lane, and stale searches." },
      { property: "og:title", content: "Dashboard — QDECK" },
      { property: "og:description", content: "What to search next: due queries, coverage by ATS and lane, and stale searches." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const queries = useQueries();
  const jobs = useSavedJobs();
  const settings = useSettings();
  const session = useSearchSession();
  const now = useNow();
  const navigate = useNavigate();

  const due = useMemo(() => queries.filter((q) => isDue(q, now)), [queries, now]);
  const today = useMemo(() => queries.filter((q) => searchedToday(q, now)).length, [queries, now]);
  const recommended = useMemo(() => recommendedQueries(queries, now, settings, 8), [queries, now, settings]);
  const platforms = useMemo(() => new Set(queries.map((q) => familyOf(q.platform)).filter((f) => ATS_FAMILIES.includes(f))).size, [queries]);
  const dueByFamily = useMemo(() => {
    const m = new Map<PlatformFamily, number>();
    for (const q of due) m.set(familyOf(q.platform), (m.get(familyOf(q.platform)) ?? 0) + 1);
    const order: PlatformFamily[] = [...settings.atsPriority, "multi", "web"];
    return order.filter((f) => m.get(f)).map((f) => ({ f, n: m.get(f)! }));
  }, [due, settings.atsPriority]);

  const activeSession = session && !session.completedAt;

  const start = () => {
    if (!activeSession) startSession(rankQueries(due, now, settings).map((q) => q.id), "All due searches");
    navigate({ to: "/session" });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-6 py-5">
      <section className="panel flex flex-wrap items-center justify-between gap-4 px-4 py-3.5">
        <div>
          <div className="text-xs text-muted-foreground">{greeting(now)}</div>
          <div className="text-lg font-semibold tracking-tight">
            {due.length ? (
              <>
                <span className="font-mono text-primary">{due.length}</span> search{due.length === 1 ? " is" : "es are"} due
              </>
            ) : (
              "You're all caught up"
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {dueByFamily.map(({ f, n }) => (
              <span key={f} className="inline-flex h-6 items-center gap-1.5 rounded-md border bg-muted/40 px-2 text-[11px]">
                {FAMILY_LABEL[f]} <span className="font-mono text-st-due">{n}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/session">Customize session</Link>
          </Button>
          <Button size="sm" onClick={start} disabled={!due.length && !activeSession}>
            <Play /> {activeSession ? "Resume session" : "Start Search Session"}
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Queries" value={queries.length} hint={`${queries.filter((q) => q.status === "active").length} active`} />
        <StatCard label="Due today" value={due.length} accent />
        <StatCard label="Searched today" value={today} />
        <StatCard label="Saved jobs" value={jobs.length} />
        <StatCard label="ATS platforms" value={platforms} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecommendedSearches items={recommended} now={now} />
        </div>
        <div className="space-y-4">
          <CoveragePanel queries={queries} now={now} order={settings.atsPriority} />
          <StaleSearches queries={queries} now={now} />
        </div>
      </div>
    </div>
  );
}
