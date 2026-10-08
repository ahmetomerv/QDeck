import { useEffect, useState } from "react";
import { useAppState } from "@/state/store";

export const useQueries = () => useAppState((s) => s.queries);
export const useProfile = () => useAppState((s) => s.profile);
export const useSavedJobs = () => useAppState((s) => s.jobs);
export const useSettings = () => useAppState((s) => s.settings);
export const useSearchSession = () => useAppState((s) => s.session);
export const useSessionHistory = () => useAppState((s) => s.sessionHistory);
export const useUi = () => useAppState((s) => s.ui);

/** Current time, refreshed periodically so due states stay live. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function useHydrated(): boolean {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}
