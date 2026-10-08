import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ATS_FAMILIES, FAMILY_LABEL } from "@/data/platforms";
import { JOB_STATUSES } from "@/data/presets";
import { useSavedJobs, useUi } from "@/hooks/useAppData";
import type { SavedJob } from "@/lib/types";
import { addJob, closeJobDialog, updateJob } from "@/state/actions";

type Form = Omit<SavedJob, "id" | "createdAt" | "technologies"> & { technologies: string };

const EMPTY: Form = { title: "", company: "", location: "", url: "", source: "", salary: "", remoteMode: "", technologies: "", notes: "", status: "interesting" };

function sourceFromUrl(url: string): string {
  try {
    const h = new URL(url).hostname;
    if (h.includes("ashbyhq")) return "Ashby";
    if (h.includes("personio")) return "Personio";
    if (h.includes("linkedin")) return "LinkedIn";
    if (h.includes("join.com")) return "JOIN";
    if (h.includes("greenhouse")) return "Greenhouse";
    if (h.includes("lever.co")) return "Lever";
    if (h.includes("workable")) return "Workable";
    if (h.includes("smartrecruiters")) return "SmartRecruiters";
    return h.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function companyFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const seg = u.pathname.split("/").filter(Boolean);
    if (/ashbyhq|lever\.co|greenhouse|workable|smartrecruiters/.test(u.hostname) && seg[0]) return seg[0];
    if (/personio/.test(u.hostname)) return u.hostname.split(".")[0] ?? "";
    if (/join\.com/.test(u.hostname) && seg[1]) return seg[1];
  } catch {
    /* ignore */
  }
  return "";
}

/** Global add/edit job dialog. Only the URL is required. */
export function JobDialog() {
  const { jobDialog } = useUi();
  const jobs = useSavedJobs();
  const [f, setF] = useState<Form>(EMPTY);
  const [more, setMore] = useState(false);
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!jobDialog.open) return;
    const existing = jobDialog.editId ? jobs.find((j) => j.id === jobDialog.editId) : undefined;
    const src = existing ?? { ...EMPTY, ...jobDialog.defaults };
    setF({ ...EMPTY, ...src, technologies: Array.isArray(src.technologies) ? src.technologies.join(", ") : (src.technologies ?? "") });
    setMore(!!existing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobDialog.open, jobDialog.editId]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const url = f.url.trim();
    if (!url) {
      toast.error("URL is required");
      urlRef.current?.focus();
      return;
    }
    const data = {
      ...f,
      url,
      source: f.source || sourceFromUrl(url),
      company: f.company || companyFromUrl(url),
      technologies: f.technologies.split(",").map((t) => t.trim()).filter(Boolean),
    };
    if (jobDialog.editId) {
      updateJob(jobDialog.editId, data);
      toast.success("Job updated");
    } else {
      if (jobs.some((j) => j.url === url)) toast.warning("You already saved this URL — added again");
      addJob(data);
      toast.success("Job saved");
    }
    closeJobDialog();
  };

  return (
    <Dialog open={jobDialog.open} onOpenChange={(o) => !o && closeJobDialog()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">{jobDialog.editId ? "Edit job" : "Save job"}</DialogTitle>
          <DialogDescription className="text-xs">Paste the URL — everything else is optional.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          <div>
            <label className="label">URL *</label>
            <input
              ref={urlRef}
              autoFocus
              className="field font-mono text-xs"
              value={f.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://jobs.ashbyhq.com/company/…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Job title</label>
              <input className="field" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Senior Frontend Engineer" />
            </div>
            <div>
              <label className="label">Company</label>
              <input className="field" value={f.company} onChange={(e) => set("company", e.target.value)} placeholder="Auto from URL" />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="field" value={f.status} onChange={(e) => set("status", e.target.value as Form["status"])}>
                {JOB_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Source</label>
              <input className="field" list="job-sources" value={f.source} onChange={(e) => set("source", e.target.value)} placeholder="Auto from URL" />
              <datalist id="job-sources">
                {ATS_FAMILIES.map((fam) => (
                  <option key={fam} value={FAMILY_LABEL[fam]} />
                ))}
              </datalist>
            </div>
          </div>
          {more ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Location</label>
                  <input className="field" value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="Munich" />
                </div>
                <div>
                  <label className="label">Remote mode</label>
                  <select className="field" value={f.remoteMode} onChange={(e) => set("remoteMode", e.target.value as Form["remoteMode"])}>
                    <option value="">—</option>
                    <option value="onsite">On-site</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
                <div>
                  <label className="label">Salary</label>
                  <input className="field" value={f.salary} onChange={(e) => set("salary", e.target.value)} placeholder="€80–95k" />
                </div>
                <div>
                  <label className="label">Tech</label>
                  <input className="field" value={f.technologies} onChange={(e) => set("technologies", e.target.value)} placeholder="Vue, TypeScript" />
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="field h-16 resize-y py-1.5" value={f.notes} onChange={(e) => set("notes", e.target.value)} />
              </div>
            </>
          ) : (
            <button type="button" onClick={() => setMore(true)} className="justify-self-start text-xs text-muted-foreground hover:text-foreground">
              + Location, remote, salary, tech, notes
            </button>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={closeJobDialog}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {jobDialog.editId ? "Save changes" : "Save job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
