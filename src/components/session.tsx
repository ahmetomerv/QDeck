import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bookmark, Check, Clock, Copy, ExternalLink, Maximize2, Minimize2, SkipForward, Square, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LANES, LANE_BY_ID } from "@/data/lanes";
import { ATS_FAMILIES, FAMILY_LABEL, PLATFORMS, titleWithPlatform } from "@/data/platforms";
import { useNow, useQueries, useSettings } from "@/hooks/useAppData";
import { fmtDuration, lastSearched } from "@/lib/format";
import { copyQuery, openGoogle } from "@/lib/googleSearch";
import { plainKey } from "@/lib/keyboard";
import { FREQUENCY_LABEL } from "@/lib/queryScheduler";
import { EMPTY_FILTERS, currentQueryId, filterSessionQueries, type SessionFilters } from "@/lib/session";
import type { LaneId, PlatformFamily, SearchQuery, SearchSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import { clearSession, endSession, openJobDialog, sessionDone, sessionLater, sessionSkip, startSession } from "@/state/actions";
import { DueBadge, LaneBadge, PlatformBadge } from "./Badges";
import { Chip, Kbd, Segmented } from "./Controls";
import { QueryText } from "./QueryText";
import { getDueState } from "@/lib/queryScheduler";

/* ------------------------------ setup ------------------------------ */

const PRESETS: { label: string; f: Partial<SessionFilters> }[] = [
  { label: "All due searches", f: {} },
  { label: "Only Highest Probability", f: { lanes: ["highest"] } },
  { label: "Only Product Engineering", f: { lanes: ["product"] } },
  { label: "Only OSS / AI", f: { lanes: ["oss-ai"] } },
  { label: "Only Full Stack", f: { lanes: ["fullstack"] } },
  { label: "Only Ashby", f: { families: ["ashby"] } },
  { label: "Only Personio", f: { families: ["personio"] } },
  { label: "Only Munich", f: { location: "Munich" } },
  { label: "Favorites only", f: { favorites: true } },
];

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

function describe(f: SessionFilters): string {
  const parts: string[] = [];
  if (f.lanes.length) parts.push(f.lanes.map((l) => LANE_BY_ID[l].short).join("/"));
  if (f.families.length) parts.push(f.families.map((x) => FAMILY_LABEL[x]).join("/"));
  if (f.location) parts.push(f.location);
  if (f.favorites) parts.push("Favorites");
  const base = f.scope === "due" ? "Due searches" : "All active searches";
  return parts.length ? `${base} · ${parts.join(" · ")}` : base;
}

export function SessionSetup() {
  const queries = useQueries();
  const settings = useSettings();
  const now = useNow();
  const [f, setF] = useState<SessionFilters>(EMPTY_FILTERS);
  const list = useMemo(() => filterSessionQueries(queries, f, now, settings), [queries, f, now, settings]);
  const families: PlatformFamily[] = [...ATS_FAMILIES, "multi", "web"];

  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-6 py-5 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <section className="panel">
          <div className="panel-header">Quick options</div>
          <div className="flex flex-wrap gap-1.5 p-3">
            {PRESETS.map((p) => (
              <button key={p.label} className="chip" onClick={() => setF({ ...EMPTY_FILTERS, scope: f.scope, ...p.f })}>
                {p.label}
              </button>
            ))}
          </div>
        </section>
        <section className="panel space-y-3 p-3">
          <Row label="Scope">
            <Segmented
              value={f.scope}
              onChange={(scope) => setF({ ...f, scope })}
              options={[
                { value: "due", label: "Due only" },
                { value: "all", label: "All active" },
              ]}
            />
          </Row>
          <Row label="Lane">
            {LANES.map((l) => (
              <Chip key={l.id} on={f.lanes.includes(l.id)} onClick={() => setF({ ...f, lanes: toggle<LaneId>(f.lanes, l.id) })}>
                {l.name}
              </Chip>
            ))}
          </Row>
          <Row label="Platform">
            {families.map((x) => (
              <Chip key={x} on={f.families.includes(x)} onClick={() => setF({ ...f, families: toggle(f.families, x) })}>
                {FAMILY_LABEL[x]}
              </Chip>
            ))}
          </Row>
          <Row label="Location">
            {["", "Germany", "Munich", "Berlin", "Remote Germany"].map((l) => (
              <Chip key={l || "any"} on={f.location === l} onClick={() => setF({ ...f, location: l })}>
                {l || "Any"}
              </Chip>
            ))}
          </Row>
          <Row label="Favorites">
            <Chip on={f.favorites} onClick={() => setF({ ...f, favorites: !f.favorites })}>
              ★ Favorites only
            </Chip>
          </Row>
        </section>
      </div>

      <section className="panel flex max-h-[calc(100vh-220px)] flex-col lg:sticky lg:top-5">
        <div className="border-b p-3">
          <div className="text-xs text-muted-foreground">{describe(f)}</div>
          <div className="mt-1 flex items-end justify-between">
            <div>
              <span className="font-mono text-3xl font-semibold text-primary tabular-nums">{list.length}</span>
              <span className="ml-1.5 text-sm text-muted-foreground">search{list.length === 1 ? "" : "es"}</span>
            </div>
            <Button size="sm" disabled={!list.length} onClick={() => startSession(list.map((q) => q.id), describe(f))}>
              Start Session
            </Button>
          </div>
        </div>
        <ol className="flex-1 divide-y overflow-y-auto">
          {list.map((q, i) => (
            <li key={q.id} className="flex items-center gap-2 px-3 py-1.5 text-xs">
              <span className="w-5 font-mono text-[10px] text-muted-foreground">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate">{q.name}</span>
              <span className="text-[11px] text-muted-foreground">{PLATFORMS[q.platform].short}</span>
              <DueBadge state={getDueState(q, now)} compact />
            </li>
          ))}
          {!list.length && <li className="px-3 py-8 text-center text-xs text-muted-foreground">No searches match these filters.</li>}
        </ol>
      </section>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start">
      <div className="label w-20 shrink-0 pt-1.5">{label}</div>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

/* ------------------------------ runner ------------------------------ */

export function SessionRunner({ session }: { session: SearchSession }) {
  const queries = useQueries();
  const byId = useMemo(() => new Map(queries.map((q) => [q.id, q])), [queries]);
  const now = useNow(1000);
  const [focus, setFocus] = useState(false);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const curId = currentQueryId(session);
  const q = curId ? byId.get(curId) : undefined;
  const total = session.queryIds.length;
  const pos = Math.min(session.index + 1, total);
  const opened = openedId === curId;

  const open = () => {
    if (!q) return;
    openGoogle(q.query);
    setOpenedId(q.id);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!plainKey(e) || document.querySelector("[role=dialog]")) return;
      const k = e.key.toLowerCase();
      if (k === "o") open();
      else if (k === "d") sessionDone();
      else if (k === "s" || k === "n") sessionSkip();
      else if (k === "l") sessionLater();
      else if (k === "f") setFocus((x) => !x);
      else if (e.key === "Escape") setFocus(false);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const upcoming = session.queryIds.slice(session.index + 1, session.index + 8).map((id) => byId.get(id)).filter(Boolean) as SearchQuery[];
  const elapsed = fmtDuration(now - session.startedAt);
  const progress = (session.index / total) * 100;

  const card = (
    <QueryCard q={q} opened={opened} onOpen={open} big={focus} isLast={session.index >= total - 1} />
  );

  if (focus) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-background">
        <div className="h-0.5 bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between px-6 py-3 text-xs text-muted-foreground">
          <span className="font-mono text-sm text-foreground tabular-nums">
            {pos} / {total}
          </span>
          <span className="flex items-center gap-3">
            <span className="font-mono tabular-nums">{elapsed}</span>
            <Button variant="ghost" size="xs" onClick={() => setFocus(false)}>
              <Minimize2 /> Exit <Kbd>Esc</Kbd>
            </Button>
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-28">
          <div className="w-full max-w-2xl">{card}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-6 py-5 lg:grid-cols-[1fr_300px]">
      <div className="space-y-3">
        <div className="panel px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] tracking-wide text-muted-foreground uppercase">Today's Search Session</div>
              <div className="text-xs text-muted-foreground">{session.label}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground tabular-nums">
                <Clock className="size-3" /> {elapsed}
              </span>
              <span className="font-mono text-lg font-semibold tabular-nums">
                {pos} <span className="text-muted-foreground">/ {total}</span>
              </span>
            </div>
          </div>
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 flex gap-4 text-[11px] text-muted-foreground">
            <span>
              <span className="text-st-fresh">{session.completedIds.length}</span> searched
            </span>
            <span>{session.skippedIds.length} skipped</span>
            <span>{total - session.index} remaining</span>
          </div>
        </div>
        {card}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button variant="outline" size="xs" onClick={() => setFocus(true)}>
              <Maximize2 /> Focus Mode <Kbd>F</Kbd>
            </Button>
            <Button variant="outline" size="xs" onClick={() => openJobDialog({ source: q ? PLATFORMS[q.platform].short : "" })}>
              <Bookmark /> Save job <Kbd>J</Kbd>
            </Button>
          </div>
          <Button variant="ghost" size="xs" onClick={endSession}>
            <Square /> End session
          </Button>
        </div>
      </div>
      <aside className="panel h-fit">
        <div className="panel-header">Up next</div>
        <ol className="divide-y">
          {upcoming.map((u, i) => (
            <li key={u.id} className="px-3 py-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-[10px] text-muted-foreground">{pos + i + 1}</span>
                <span className="truncate">{u.name}</span>
              </div>
              <div className="pl-5 text-[11px] text-muted-foreground">
                {PLATFORMS[u.platform].short} · {LANE_BY_ID[u.lane].short}
              </div>
            </li>
          ))}
          {!upcoming.length && <li className="px-3 py-4 text-xs text-muted-foreground">Last one!</li>}
        </ol>
      </aside>
    </div>
  );
}

function QueryCard({ q, opened, onOpen, big, isLast }: { q?: SearchQuery | undefined; opened: boolean; onOpen: () => void; big?: boolean; isLast: boolean }) {
  const now = useNow();
  if (!q) {
    return (
      <div className="panel p-6 text-center text-sm text-muted-foreground">
        This query was deleted.
        <div className="mt-3">
          <Button size="sm" variant="outline" onClick={sessionSkip}>
            Skip
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className={cn("panel overflow-hidden", big && "shadow-2xl")}>
      <div className="flex flex-wrap items-center gap-1.5 border-b bg-muted/30 px-4 py-2">
        <PlatformBadge platform={q.platform} />
        <LaneBadge lane={q.lane} full />
        <DueBadge state={getDueState(q, now)} />
        <span className="ml-auto text-[11px] text-muted-foreground">
          {FREQUENCY_LABEL[q.frequency]} · last {lastSearched(q.lastRunAt, now)}
        </span>
      </div>
      <div className={cn("px-4", big ? "py-6" : "py-4")}>
        <div className={cn("font-semibold tracking-tight", big ? "text-xl" : "text-[15px]")}>
          {titleWithPlatform(q.name, q.platform)}
        </div>
        <div className="mt-3 rounded-md border bg-background p-3">
          <QueryText query={q.query} multiline className={big ? "text-[14px]" : "text-[13px]"} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t px-4 py-3">
        <Button size={big ? "default" : "sm"} variant={opened ? "outline" : "default"} onClick={onOpen}>
          <ExternalLink /> Open Google <Kbd>O</Kbd>
        </Button>
        <Button size={big ? "default" : "sm"} variant={opened ? "default" : "secondary"} onClick={sessionDone}>
          <Check /> Done <Kbd>D</Kbd>
        </Button>
        <Button size={big ? "default" : "sm"} variant="ghost" onClick={sessionSkip}>
          <SkipForward /> Skip <Kbd>S</Kbd>
        </Button>
        {!big && (
          <Button size="sm" variant="ghost" onClick={sessionLater} disabled={isLast}>
            <Undo2 /> Save for later <Kbd>L</Kbd>
          </Button>
        )}
        <Button size="icon-sm" variant="ghost" className="ml-auto" title="Copy query" onClick={() => copyQuery(q.query)}>
          <Copy />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------ complete ------------------------------ */

export function SessionComplete({ session }: { session: SearchSession }) {
  const reviewed = session.completedIds.length + session.skippedIds.length;
  const duration = (session.completedAt ?? Date.now()) - session.startedAt;
  const ended = reviewed < session.queryIds.length;
  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="panel p-6 text-center">
        <div className="mx-auto grid size-10 place-items-center rounded-full bg-st-fresh/15 text-st-fresh">
          <Check className="size-5" />
        </div>
        <h2 className="mt-3 text-base font-semibold">{ended ? "Search session ended" : "Search session complete"}</h2>
        <p className="text-xs text-muted-foreground">{session.label}</p>
        <div className="mt-5 grid grid-cols-4 divide-x rounded-md border">
          {[
            ["Reviewed", reviewed],
            ["Searched", session.completedIds.length],
            ["Skipped", session.skippedIds.length],
            ["Duration", fmtDuration(duration)],
          ].map(([l, v]) => (
            <div key={l} className="py-2.5">
              <div className="font-mono text-lg font-semibold tabular-nums">{v}</div>
              <div className="text-[10px] tracking-wide text-muted-foreground uppercase">{l}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/" onClick={clearSession}>
              Back to dashboard
            </Link>
          </Button>
          <Button size="sm" onClick={clearSession}>
            New session
          </Button>
        </div>
      </div>
    </div>
  );
}
