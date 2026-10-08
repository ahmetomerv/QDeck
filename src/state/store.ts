import { useSyncExternalStore } from "react";
import type { Profile, SavedJob, SearchQuery, SearchSession, Settings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/data/presets";
import { loadQueries, saveQueries } from "@/storage/queries";
import { loadJobs, saveJobs } from "@/storage/jobs";
import { loadProfile, saveProfile } from "@/storage/profile";
import { loadSettings, saveSettings } from "@/storage/settings";
import { loadActiveSession, loadSessionHistory, saveActiveSession, saveSessionHistory } from "@/storage/sessions";

export interface UiState {
  jobDialog: { open: boolean; editId?: string | undefined; defaults?: Partial<SavedJob> | undefined };
  helpOpen: boolean;
}

export interface AppState {
  queries: SearchQuery[];
  jobs: SavedJob[];
  settings: Settings;
  profile: Profile | null;
  session: SearchSession | null;
  sessionHistory: SearchSession[];
  ui: UiState;
}

const EMPTY: AppState = {
  queries: [],
  jobs: [],
  settings: DEFAULT_SETTINGS,
  profile: null,
  session: null,
  sessionHistory: [],
  ui: { jobDialog: { open: false }, helpOpen: false },
};

let state: AppState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function ensure(): AppState {
  if (!loaded && typeof window !== "undefined") {
    state = {
      ...EMPTY,
      queries: loadQueries(),
      jobs: loadJobs(),
      settings: loadSettings(),
      profile: loadProfile(),
      session: loadActiveSession(),
      sessionHistory: loadSessionHistory(),
    };
    loaded = true;
  }
  return state;
}

function persist(prev: AppState, next: AppState) {
  if (prev.queries !== next.queries) saveQueries(next.queries);
  if (prev.jobs !== next.jobs) saveJobs(next.jobs);
  if (prev.settings !== next.settings) saveSettings(next.settings);
  if (prev.profile !== next.profile) saveProfile(next.profile);
  if (prev.session !== next.session) saveActiveSession(next.session);
  if (prev.sessionHistory !== next.sessionHistory) saveSessionHistory(next.sessionHistory);
}

export function getState(): AppState {
  return ensure();
}

export function setState(fn: (s: AppState) => AppState): void {
  const prev = ensure();
  const next = fn(prev);
  if (next === prev) return;
  state = next;
  persist(prev, next);
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Selector must return a stable reference (a slice of state), not a derived new object. */
export function useAppState<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(ensure()),
    () => selector(EMPTY),
  );
}
