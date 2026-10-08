import { Fragment, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Copy, ExternalLink, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DueBadge, LaneBadge, PriorityBadge, StatusBadge } from "@/components/Badges";
import { PageHeader, Select } from "@/components/Controls";
import { QueryEditor } from "@/components/QueryEditor";
import { QueryMenu } from "@/components/QueryActions";
import { QueryText } from "@/components/QueryText";
import { LANES } from "@/data/lanes";
import { ATS_FAMILIES, FAMILY_LABEL, PLATFORMS, familyOf } from "@/data/platforms";
import { ALL_TECH } from "@/data/presets";
import { useNow, useQueries, useSettings } from "@/hooks/useAppData";
import { fmtStamp, lastSearched } from "@/lib/format";
import { copyQuery } from "@/lib/googleSearch";
import { FREQUENCY_LABEL, getDueState } from "@/lib/queryScheduler";
import { scoreQuery } from "@/lib/queryRanking";
import type { PlatformFamily, SearchQuery } from "@/lib/types";
import { cn } from "@/lib/utils";
import { runQuery, toggleFavorite } from "@/state/actions";

export const Route = createFileRoute("/queries")({
  validateSearch: (s: Record<string, unknown>): { focus?: string | undefined } => ({
    focus: typeof s["focus"] === "string" ? (s["focus"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Query Library — QDECK" },
      { name: "description", content: "Every saved Google job-search query, filterable by lane, ATS, tech and status." },
      { property: "og:title", content: "Query Library — QDECK" },
      { property: "og:description", content: "Every saved Google job-search query, filterable by lane, ATS, tech and status." },
    ],
  }),
  component: QueriesPage,
});

type Opt = { value: string; label: string };
const any = (label: string): Opt => ({ value: "", label });

function QueriesPage() {
  const queries = useQueries();
  const settings = useSettings();
  const now = useNow();
  const { focus } = Route.useSearch();
  const [text, setText] = useState("");
  const [lane, setLane] = useState("");
  const [fam, setFam] = useState("");
  const [tech, setTech] = useState("");
  const [loc, setLoc] = useState("");
  const [status, setStatus] = useState("");
  const [due, setDue] = useState("");
  const [sort, setSort] = useState("recommended");
  const [expanded, setExpanded] = useState<string | null>(focus ?? null);
  const [editing, setEditing] = useState<SearchQuery | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    if (!focus) return;
    setExpanded(focus);
    setTimeout(() => document.getElementById(`q-${focus}`)?.scrollIntoView({ block: "center" }), 50);
  }, [focus]);

  const list = useMemo(() => {
    const t = text.toLowerCase();
    const out = queries.filter(
      (q) =>
        (!t || q.name.toLowerCase().includes(t) || q.query.toLowerCase().includes(t)) &&
        (!lane || q.lane === lane) &&
        (!fam || familyOf(q.platform) === fam) &&
        (!tech || q.technologies.includes(tech)) &&
        (!loc || q.locations.includes(loc) || (loc === "Munich" && q.locations.includes("München"))) &&
        (!status || q.status === status) &&
        (!due || getDueState(q, now) === due),
    );
    const statusRank = (q: SearchQuery) => (q.status === "active" ? 0 : q.status === "paused" ? 1 : 2);
    return out.sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      if (statusRank(a) !== statusRank(b)) return statusRank(a) - statusRank(b);
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "lastRun") return (b.lastRunAt ?? 0) - (a.lastRunAt ?? 0);
      if (sort === "platform") return familyOf(a.platform).localeCompare(familyOf(b.platform)) || a.name.localeCompare(b.name);
      return scoreQuery(b, now, settings) - scoreQuery(a, now, settings);
    });
  }, [queries, text, lane, fam, tech, loc, status, due, sort, now, settings]);

  const filtersActive = [lane, fam, tech, loc, status, due, text].some(Boolean);
  const families: PlatformFamily[] = [...ATS_FAMILIES, "multi", "web"];

  return (
    <div>
      <PageHeader title="Queries" sub={`${list.length} of ${queries.length} queries · favorites first · click a query to open Google`}>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
        >
          <Plus /> New query
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-1.5 border-b px-6 py-2">
        <input className="field h-7 w-52 text-xs" placeholder="Search name or query…" value={text} onChange={(e) => setText(e.target.value)} />
        <Select aria-label="Lane" className="w-auto" value={lane} onChange={setLane} options={[any("All lanes"), ...LANES.map((l) => ({ value: l.id, label: l.name }))]} />
        <Select aria-label="Platform" className="w-auto" value={fam} onChange={setFam} options={[any("All platforms"), ...families.map((f) => ({ value: f, label: FAMILY_LABEL[f] }))]} />
        <Select aria-label="Technology" className="w-auto" value={tech} onChange={setTech} options={[any("Any tech"), ...ALL_TECH.map((t) => ({ value: t, label: t }))]} />
        <Select aria-label="Location" className="w-auto" value={loc} onChange={setLoc} options={[any("Any location"), ...["Germany", "Munich", "Berlin", "Remote Germany"].map((l) => ({ value: l, label: l }))]} />
        <Select aria-label="Status" className="w-auto" value={status} onChange={setStatus} options={[any("Any status"), { value: "active", label: "Active" }, { value: "paused", label: "Paused" }, { value: "archived", label: "Archived" }]} />
        <Select aria-label="Due state" className="w-auto" value={due} onChange={setDue} options={[any("Any schedule"), { value: "never", label: "Never searched" }, { value: "overdue", label: "Overdue" }, { value: "due", label: "Due" }, { value: "fresh", label: "Fresh" }, { value: "manual", label: "Manual" }]} />
        <span className="ml-auto" />
        <Select aria-label="Sort" className="w-auto" value={sort} onChange={setSort} options={[{ value: "recommended", label: "Sort: Recommended" }, { value: "platform", label: "Sort: Platform" }, { value: "name", label: "Sort: Name" }, { value: "lastRun", label: "Sort: Last run" }]} />
        {filtersActive && (
          <Button variant="ghost" size="xs" onClick={() => [setText, setLane, setFam, setTech, setLoc, setStatus, setDue].forEach((f) => f(""))}>
            Clear
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-xs">
          <thead className="border-b bg-surface">
            <tr>
              <th className="th w-8" />
              <th className="th">Name</th>
              <th className="th">Lane</th>
              <th className="th">Platform</th>
              <th className="th">Location</th>
              <th className="th">Frequency</th>
              <th className="th">Last run</th>
              <th className="th">Priority</th>
              <th className="th">Status</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.map((q) => {
              const st = getDueState(q, now);
              const open = expanded === q.id;
              return (
                <Fragment key={q.id}>
                  <tr id={`q-${q.id}`} className={cn("group hover:bg-muted/40", q.status !== "active" && "opacity-55", focus === q.id && "bg-primary/5")}>
                    <td className="td">
                      <button onClick={() => toggleFavorite(q.id)} aria-label="Favorite" className={cn("p-0.5", q.favorite ? "text-st-due" : "text-muted-foreground/40 hover:text-muted-foreground")}>
                        <Star className={cn("size-3.5", q.favorite && "fill-current")} />
                      </button>
                    </td>
                    <td className="td max-w-[420px]">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setExpanded(open ? null : q.id)} className="text-muted-foreground hover:text-foreground" aria-label="Details">
                          <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />
                        </button>
                        <span className="truncate font-medium">{q.name}</span>
                      </div>
                      <button onClick={() => runQuery(q.id)} className="block w-full pl-4.5 text-left hover:underline" title="Open in Google">
                        <QueryText query={q.query} truncate className="text-[11px] text-muted-foreground" />
                      </button>
                    </td>
                    <td className="td"><LaneBadge lane={q.lane} /></td>
                    <td className="td whitespace-nowrap">{PLATFORMS[q.platform].label}</td>
                    <td className="td max-w-[140px] truncate text-muted-foreground">{q.locations.join(", ") || "—"}</td>
                    <td className="td whitespace-nowrap text-muted-foreground">{FREQUENCY_LABEL[q.frequency]}</td>
                    <td className="td whitespace-nowrap">
                      <div>{lastSearched(q.lastRunAt, now)}</div>
                      <div className="text-[10px] text-muted-foreground">{q.runCount} runs</div>
                    </td>
                    <td className="td"><PriorityBadge priority={q.priority} /></td>
                    <td className="td">
                      <div className="flex gap-1">
                        {q.status === "active" ? <DueBadge state={st} /> : <StatusBadge status={q.status} />}
                      </div>
                    </td>
                    <td className="td">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button size="icon-sm" variant="ghost" title="Copy query" onClick={() => copyQuery(q.query)}>
                          <Copy />
                        </Button>
                        <Button size="xs" variant="outline" onClick={() => runQuery(q.id)}>
                          <ExternalLink /> Run
                        </Button>
                        <QueryMenu q={q} onEdit={() => { setEditing(q); setEditorOpen(true); }} />
                      </div>
                    </td>
                  </tr>
                  {open && (
                    <tr className="bg-surface">
                      <td />
                      <td colSpan={9} className="px-2 pt-2 pb-3">
                        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                          <div className="space-y-2">
                            <div className="rounded-md border bg-background p-2.5">
                              <QueryText query={q.query} multiline />
                            </div>
                            <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                              <span>Tech: {q.technologies.join(", ") || "—"}</span>
                              <span>Exclusions: {q.exclusions.join(", ") || "—"}</span>
                              {q.group && <span>Group: {q.group}</span>}
                              {q.notes && <span>Notes: {q.notes}</span>}
                            </div>
                          </div>
                          <div>
                            <div className="label">History · {q.runCount} runs</div>
                            <div className="text-[11px] text-muted-foreground">Last searched: {lastSearched(q.lastRunAt, now)}</div>
                            <ul className="mt-1.5 max-h-32 space-y-0.5 overflow-y-auto font-mono text-[11px]">
                              {q.runHistory.slice(0, 20).map((t) => <li key={t}>{fmtStamp(t)}</li>)}
                              {!q.runHistory.length && <li className="text-muted-foreground">No runs yet</li>}
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {!list.length && <div className="py-12 text-center text-xs text-muted-foreground">No queries match these filters.</div>}
      </div>
      <QueryEditor open={editorOpen} onOpenChange={setEditorOpen} editing={editing} />
    </div>
  );
}
