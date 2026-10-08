import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/Controls";
import { JOB_STATUSES } from "@/data/presets";
import { useSavedJobs } from "@/hooks/useAppData";
import { fmtDate } from "@/lib/format";
import type { JobStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { deleteJob, openJobDialog, updateJob } from "@/state/actions";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Saved Jobs — QDECK" },
      { name: "description", content: "Lightweight bookmarks of interesting job postings found while searching." },
      { property: "og:title", content: "Saved Jobs — QDECK" },
      { property: "og:description", content: "Lightweight bookmarks of interesting job postings found while searching." },
    ],
  }),
  component: JobsPage,
});

const STATUS_CLS: Record<JobStatus, string> = {
  interesting: "text-st-never",
  review: "text-st-due",
  applied: "text-st-fresh",
  ignore: "text-muted-foreground",
};

function JobsPage() {
  const jobs = useSavedJobs();
  const [status, setStatus] = useState<JobStatus | "">("");
  const [text, setText] = useState("");
  const list = useMemo(() => {
    const t = text.toLowerCase();
    return jobs.filter((j) => (!status || j.status === status) && (!t || [j.title, j.company, j.location, j.url, j.notes].join(" ").toLowerCase().includes(t)));
  }, [jobs, status, text]);

  return (
    <div>
      <PageHeader title="Saved Jobs" sub="Bookmarks from your searches. Not an application tracker.">
        <Button size="sm" onClick={() => openJobDialog()}>
          <Plus /> Add Job
        </Button>
      </PageHeader>
      <div className="flex flex-wrap items-center gap-1.5 border-b px-6 py-2">
        {[{ id: "" as const, label: "All" }, ...JOB_STATUSES].map((s) => (
          <button key={s.id || "all"} onClick={() => setStatus(s.id)} className={cn("chip", status === s.id && "chip-on")}>
            {s.label}
            <span className="font-mono text-[10px]">{s.id ? jobs.filter((j) => j.status === s.id).length : jobs.length}</span>
          </button>
        ))}
        <input className="field ml-auto h-7 w-52 text-xs" placeholder="Search…" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      {!jobs.length ? (
        <div className="py-16 text-center">
          <p className="text-sm">No saved jobs yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Press <kbd className="kbd">J</kbd> anywhere to paste a job URL.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-xs">
            <thead className="border-b bg-surface">
              <tr>
                <th className="th">Job</th>
                <th className="th">Location</th>
                <th className="th">Source</th>
                <th className="th">Tech</th>
                <th className="th">Salary</th>
                <th className="th">Status</th>
                <th className="th">Saved</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((j) => (
                <tr key={j.id} className={cn("hover:bg-muted/40", j.status === "ignore" && "opacity-55")}>
                  <td className="td max-w-[360px]">
                    <div className="truncate font-medium">{j.title || "Untitled role"}{j.company && <span className="text-muted-foreground"> · {j.company}</span>}</div>
                    <a href={j.url} target="_blank" rel="noreferrer" className="block truncate font-mono text-[11px] text-muted-foreground hover:text-primary">{j.url}</a>
                    {j.notes && <div className="truncate text-[11px] text-muted-foreground">{j.notes}</div>}
                  </td>
                  <td className="td text-muted-foreground">{[j.location, j.remoteMode].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="td">{j.source || "—"}</td>
                  <td className="td max-w-[140px] truncate text-muted-foreground">{j.technologies.join(", ") || "—"}</td>
                  <td className="td text-muted-foreground">{j.salary || "—"}</td>
                  <td className="td">
                    <select value={j.status} onChange={(e) => updateJob(j.id, { status: e.target.value as JobStatus })} className={cn("field h-6 w-auto px-1.5 text-[11px]", STATUS_CLS[j.status])}>
                      {JOB_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </td>
                  <td className="td whitespace-nowrap text-muted-foreground">{fmtDate(j.createdAt)}</td>
                  <td className="td">
                    <div className="flex justify-end gap-0.5">
                      <Button size="icon-sm" variant="ghost" asChild title="Open">
                        <a href={j.url} target="_blank" rel="noreferrer"><ExternalLink /></a>
                      </Button>
                      <Button size="icon-sm" variant="ghost" title="Edit" onClick={() => openJobDialog(undefined, j.id)}><Pencil /></Button>
                      <Button size="icon-sm" variant="ghost" title="Delete" onClick={() => deleteJob(j.id)}><Trash2 /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
