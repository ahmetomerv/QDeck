import { useEffect, useMemo, type ReactNode } from "react";
import { useNow, useQueries, useSavedJobs, useSearchSession, useSettings } from "@/hooks/useAppData";
import { isDue } from "@/lib/queryScheduler";
import { plainKey } from "@/lib/keyboard";
import { openJobDialog, setHelpOpen } from "@/state/actions";
import { Dock } from "./Dock";
import { JobDialog } from "./JobDialog";
import { ShortcutsDialog } from "./ShortcutsDialog";

export function AppShell({ children }: { children: ReactNode }) {
  const queries = useQueries();
  const jobs = useSavedJobs();
  const settings = useSettings();
  const session = useSearchSession();
  const now = useNow();
  const due = useMemo(() => queries.filter((q) => isDue(q, now)).length, [queries, now]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.theme === "dark");
  }, [settings.theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!plainKey(e)) return;
      if (e.key === "?") {
        e.preventDefault();
        setHelpOpen(true);
      } else if (e.key === "j" || e.key === "J") {
        if (document.querySelector("[role=dialog]")) return;
        e.preventDefault();
        openJobDialog();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const counts: Record<string, number | undefined> = {
    "/session": session && !session.completedAt ? session.queryIds.length - session.index : due,
    "/queries": queries.length,
    "/jobs": jobs.length,
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="min-w-0 pb-32">{children}</main>
      <Dock counts={counts} />
      <JobDialog />
      <ShortcutsDialog />
    </div>
  );
}
