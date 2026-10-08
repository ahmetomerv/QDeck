import { toast } from "sonner";
import type { Seniority } from "@/data/presets";
import { buildPackQueries } from "@/lib/rolePacks";
import { extractMeta } from "@/lib/queryMeta";
import { advanceSession, createSession, currentQueryId, deferCurrent } from "@/lib/session";
import type { NewQuery, Profile, SavedJob, SearchQuery, Settings } from "@/lib/types";
import { uid } from "@/lib/utils";
import { openGoogle } from "@/lib/googleSearch";
import { getState, setState, type AppState } from "./store";

const mapQuery = (id: string, fn: (q: SearchQuery) => SearchQuery) =>
  setState((s) => ({ ...s, queries: s.queries.map((q) => (q.id === id ? fn(q) : q)) }));

/* ---------- queries ---------- */

export function markRun(id: string, at = Date.now()): SearchQuery | undefined {
  const prev = getState().queries.find((q) => q.id === id);
  mapQuery(id, (q) => ({
    ...q,
    lastRunAt: at,
    runCount: q.runCount + 1,
    runHistory: [at, ...q.runHistory].slice(0, 50),
  }));
  return prev;
}

function restoreRun(prev: SearchQuery) {
  mapQuery(prev.id, (q) => ({ ...q, lastRunAt: prev.lastRunAt, runCount: prev.runCount, runHistory: prev.runHistory }));
}

/** Records a run and shows an undo toast. */
export function completeQuery(id: string) {
  const prev = markRun(id);
  if (prev) toast.success(`Marked "${prev.name}" as searched`, { action: { label: "Undo", onClick: () => restoreRun(prev) } });
}

/** Opens Google in a new tab and records the run. */
export function runQuery(id: string) {
  const q = getState().queries.find((x) => x.id === id);
  if (!q) return;
  openGoogle(q.query);
  completeQuery(id);
}

export function buildQuery(input: NewQuery): SearchQuery {
  const meta = extractMeta(input.query);
  return {
    ...input,
    locations: input.locations.length ? input.locations : meta.locations,
    technologies: input.technologies.length ? input.technologies : meta.technologies,
    exclusions: input.exclusions.length ? input.exclusions : meta.exclusions,
    id: uid(),
    createdAt: Date.now(),
    lastRunAt: null,
    runCount: 0,
    runHistory: [],
  };
}

export function addQueries(inputs: NewQuery[]): SearchQuery[] {
  const created = inputs.map(buildQuery);
  setState((s) => ({ ...s, queries: [...created, ...s.queries] }));
  return created;
}

export function updateQuery(id: string, patch: Partial<SearchQuery>) {
  mapQuery(id, (q) => {
    const next = { ...q, ...patch };
    if (patch.query !== undefined) {
      const m = extractMeta(next.query);
      next.locations = m.locations;
      next.technologies = m.technologies;
      next.exclusions = m.exclusions;
    }
    return next;
  });
}

export function deleteQuery(id: string) {
  const s = getState();
  const idx = s.queries.findIndex((q) => q.id === id);
  const q = s.queries[idx];
  if (!q) return;
  setState((st) => ({ ...st, queries: st.queries.filter((x) => x.id !== id) }));
  toast(`Deleted "${q.name}"`, {
    action: {
      label: "Undo",
      onClick: () =>
        setState((st) => {
          const arr = [...st.queries];
          arr.splice(Math.min(idx, arr.length), 0, q);
          return { ...st, queries: arr };
        }),
    },
  });
}

export function duplicateQuery(id: string) {
  const q = getState().queries.find((x) => x.id === id);
  if (!q) return;
  const copy: SearchQuery = { ...q, id: uid(), name: `${q.name} (copy)`, createdAt: Date.now(), lastRunAt: null, runCount: 0, runHistory: [], favorite: false };
  setState((s) => {
    const idx = s.queries.findIndex((x) => x.id === id);
    const arr = [...s.queries];
    arr.splice(idx + 1, 0, copy);
    return { ...s, queries: arr };
  });
  toast.success("Query duplicated");
}

export const toggleFavorite = (id: string) => mapQuery(id, (q) => ({ ...q, favorite: !q.favorite }));
export const setQueryStatus = (id: string, status: SearchQuery["status"]) => mapQuery(id, (q) => ({ ...q, status }));

/** Replaces the library with the chosen starter packs and marks setup complete. */
export function completeOnboarding(input: { packIds: string[]; seniority: Seniority[]; location: string }) {
  const location = input.location.trim() || "Germany";
  const created = buildPackQueries({ packIds: input.packIds, seniority: input.seniority, location }).map(buildQuery);
  const profile: Profile = { onboarded: true, roles: input.packIds, seniority: input.seniority, location };
  setState((s) => ({
    ...s,
    profile,
    queries: created,
    session: null,
    settings: { ...s.settings, defaultLocation: location },
  }));
  toast.success(created.length ? `${created.length} searches ready` : "Empty library ready");
}

/** Returns to setup. The current library stays until setup is finished again. */
export function restartOnboarding() {
  setState((s) => ({ ...s, profile: null }));
}

/* ---------- jobs ---------- */

export function addJob(input: Omit<SavedJob, "id" | "createdAt">): SavedJob {
  const job: SavedJob = { ...input, id: uid(), createdAt: Date.now() };
  setState((s) => ({ ...s, jobs: [job, ...s.jobs] }));
  return job;
}
export const updateJob = (id: string, patch: Partial<SavedJob>) =>
  setState((s) => ({ ...s, jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)) }));
export function deleteJob(id: string) {
  const job = getState().jobs.find((j) => j.id === id);
  setState((s) => ({ ...s, jobs: s.jobs.filter((j) => j.id !== id) }));
  if (job) toast(`Removed "${job.title || job.url}"`, { action: { label: "Undo", onClick: () => setState((s) => ({ ...s, jobs: [job, ...s.jobs] })) } });
}

/* ---------- settings ---------- */

export const updateSettings = (patch: Partial<Settings>) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));

/* ---------- ui ---------- */

export const openJobDialog = (defaults?: Partial<SavedJob>, editId?: string) =>
  setState((s) => ({ ...s, ui: { ...s.ui, jobDialog: { open: true, defaults, editId } } }));
export const closeJobDialog = () => setState((s) => ({ ...s, ui: { ...s.ui, jobDialog: { open: false } } }));
export const setHelpOpen = (helpOpen: boolean) => setState((s) => ({ ...s, ui: { ...s.ui, helpOpen } }));

/* ---------- session ---------- */

export function startSession(ids: string[], label: string) {
  if (!ids.length) {
    toast("No searches match — nothing to do");
    return;
  }
  setState((s) => ({ ...s, session: createSession(ids, label, Date.now()) }));
}

function finishIfDone(s: AppState): AppState {
  if (s.session?.completedAt) {
    return { ...s, sessionHistory: [s.session, ...s.sessionHistory].slice(0, 30) };
  }
  return s;
}

export function sessionDone() {
  const sess = getState().session;
  if (!sess || sess.completedAt) return;
  const id = currentQueryId(sess);
  if (id) markRun(id);
  setState((s) => (s.session ? finishIfDone({ ...s, session: advanceSession(s.session, "done", Date.now()) }) : s));
}

export function sessionSkip() {
  setState((s) => (s.session && !s.session.completedAt ? finishIfDone({ ...s, session: advanceSession(s.session, "skip", Date.now()) }) : s));
}

export function sessionLater() {
  const sess = getState().session;
  if (!sess) return;
  if (sess.index >= sess.queryIds.length - 1) {
    toast("Already the last search in this session");
    return;
  }
  setState((s) => (s.session ? { ...s, session: deferCurrent(s.session) } : s));
  toast("Moved to the end of the queue");
}

export function endSession() {
  setState((s) => {
    if (!s.session) return s;
    if (s.session.completedAt) return { ...s, session: null };
    const ended = { ...s.session, completedAt: Date.now() };
    return { ...s, session: ended, sessionHistory: [ended, ...s.sessionHistory].slice(0, 30) };
  });
}

export const clearSession = () => setState((s) => ({ ...s, session: null }));

/* ---------- import / replace ---------- */

export function replaceAll(data: Pick<AppState, "queries" | "jobs" | "settings" | "sessionHistory">) {
  setState((s) => ({ ...s, ...data, session: null }));
}
