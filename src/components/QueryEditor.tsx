import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LANES } from "@/data/lanes";
import { PLATFORMS, detectPlatform } from "@/data/platforms";
import { FREQUENCIES, PRIORITIES } from "@/data/presets";
import { useQueries } from "@/hooks/useAppData";
import { findDuplicates, type DuplicateResult } from "@/lib/queryNormalizer";
import type { NewQuery, PlatformId, SearchQuery } from "@/lib/types";
import { addQueries, updateQuery } from "@/state/actions";
import { extractMeta } from "@/lib/queryMeta";
import { DuplicateDialog } from "./DuplicateDialog";
import { QueryText } from "./QueryText";

const EMPTY: NewQuery = {
  name: "",
  query: "",
  lane: "highest",
  platform: "web",
  language: "en",
  locations: [],
  technologies: [],
  exclusions: [],
  priority: "high",
  frequency: "every-2-days",
  status: "active",
  favorite: false,
};

export function QueryEditor({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing?: SearchQuery | null;
}) {
  const all = useQueries();
  const [form, setForm] = useState<NewQuery>(EMPTY);
  const [platformTouched, setPlatformTouched] = useState(false);
  const [dup, setDup] = useState<DuplicateResult | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? { ...editing } : EMPTY);
    setPlatformTouched(!!editing);
  }, [open, editing]);

  const set = <K extends keyof NewQuery>(k: K, v: NewQuery[K]) => setForm((f) => ({ ...f, [k]: v }));

  const commit = () => {
    const name = form.name.trim() || form.query.slice(0, 48);
    const meta = extractMeta(form.query);
    if (editing) {
      updateQuery(editing.id, { ...form, name, language: form.language });
      toast.success("Query updated");
    } else {
      addQueries([{ ...form, name, ...meta, language: form.language }]);
      toast.success("Query saved");
    }
    setDup(null);
    onOpenChange(false);
  };

  const save = () => {
    if (!form.query.trim()) {
      toast.error("Query can't be empty");
      return;
    }
    const r = findDuplicates(form.query, all, editing?.id);
    if (r.exact || r.similar.length) setDup(r);
    else commit();
  };

  const field = "field";
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm">{editing ? "Edit query" : "New query"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <label className="label">Name</label>
              <input className={field} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Senior Frontend · Ashby · Vue/Nuxt" />
            </div>
            <div>
              <label className="label">Google query</label>
              <textarea
                className={`${field} h-24 resize-y py-2 font-mono text-xs`}
                value={form.query}
                onChange={(e) => {
                  const q = e.target.value;
                  setForm((f) => ({
                    ...f,
                    query: q,
                    platform: platformTouched ? f.platform : detectPlatform(q),
                    language: extractMeta(q).language,
                  }));
                }}
                placeholder={`site:jobs.ashbyhq.com "Senior Frontend Engineer" TypeScript Germany`}
                autoFocus
              />
              {form.query.trim() && (
                <div className="mt-2 rounded-md border bg-muted/40 p-2">
                  <QueryText query={form.query} multiline />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className="label">Lane</label>
                <select className={field} value={form.lane} onChange={(e) => set("lane", e.target.value as NewQuery["lane"])}>
                  {LANES.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Platform</label>
                <select
                  className={field}
                  value={form.platform}
                  onChange={(e) => {
                    setPlatformTouched(true);
                    set("platform", e.target.value as PlatformId);
                  }}
                >
                  {Object.values(PLATFORMS).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Language</label>
                <select className={field} value={form.language} onChange={(e) => set("language", e.target.value as NewQuery["language"])}>
                  <option value="en">English</option>
                  <option value="de">German</option>
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select className={field} value={form.priority} onChange={(e) => set("priority", e.target.value as NewQuery["priority"])}>
                  {PRIORITIES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Frequency</label>
                <select className={field} value={form.frequency} onChange={(e) => set("frequency", e.target.value as NewQuery["frequency"])}>
                  {FREQUENCIES.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className={field} value={form.status} onChange={(e) => set("status", e.target.value as NewQuery["status"])}>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <input className={field} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={save}>
              {editing ? "Save changes" : "Save query"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DuplicateDialog result={dup} onCancel={() => setDup(null)} onSaveAnyway={commit} />
    </>
  );
}
