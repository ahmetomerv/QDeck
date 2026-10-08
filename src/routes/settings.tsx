import { useRef, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Download, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChipListEditor, PageHeader, Segmented } from "@/components/Controls";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FAMILY_LABEL } from "@/data/platforms";
import { DEFAULT_SETTINGS } from "@/data/presets";
import { useQueries, useSavedJobs, useSessionHistory, useSettings } from "@/hooks/useAppData";
import { buildExport, parseImport, type BackupData } from "@/lib/backup";
import { replaceAll, restartOnboarding, updateSettings } from "@/state/actions";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — QDECK" },
      { name: "description", content: "Local preferences, ATS priority, backup, import and setup for QDECK." },
      { property: "og:title", content: "Settings — QDECK" },
      { property: "og:description", content: "Local preferences, ATS priority, backup, import and setup for QDECK." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const s = useSettings();
  const queries = useQueries();
  const jobs = useSavedJobs();
  const sessionHistory = useSessionHistory();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pendingImport, setPendingImport] = useState<BackupData | null>(null);

  const move = (i: number, d: -1 | 1) => {
    const arr = [...s.atsPriority];
    const j = i + d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    updateSettings({ atsPriority: arr });
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(buildExport({ queries, jobs, settings: s, sessionHistory }), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `qdeck-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Backup downloaded");
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const r = parseImport(await f.text());
    if (fileRef.current) fileRef.current.value = "";
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    setPendingImport(r.data);
  };

  return (
    <div>
      <PageHeader title="Settings" sub="Stored locally in this browser. The Query Builder prefills from these values." />
      <div className="mx-auto max-w-3xl space-y-4 px-6 py-5">
        <Card title="Search preferences">
          <Field label="Default location">
            <input className="field max-w-xs" value={s.defaultLocation} onChange={(e) => updateSettings({ defaultLocation: e.target.value })} />
          </Field>
          <Field label="Preferred cities">
            <ChipListEditor values={s.preferredCities} onChange={(v) => updateSettings({ preferredCities: v })} placeholder="Add city" />
          </Field>
          <Field label="Preferred technologies">
            <ChipListEditor values={s.preferredTechnologies} onChange={(v) => updateSettings({ preferredTechnologies: v })} placeholder="Add tech" />
          </Field>
          <Field label="Adjacent technologies">
            <ChipListEditor values={s.adjacentTechnologies} onChange={(v) => updateSettings({ adjacentTechnologies: v })} placeholder="Add tech" />
          </Field>
          <Field label="Default exclusions">
            <ChipListEditor values={s.defaultExclusions} onChange={(v) => updateSettings({ defaultExclusions: v })} placeholder="Add exclusion" />
          </Field>
        </Card>

        <Card title="Preferred ATS priority" hint="Higher platforms rank first in recommendations">
          <ol className="divide-y rounded-md border">
            {s.atsPriority.map((f, i) => (
              <li key={f} className="flex items-center gap-2 px-2.5 py-1 text-xs">
                <span className="w-4 font-mono text-[11px] text-muted-foreground">{i + 1}</span>
                <span className="flex-1">{FAMILY_LABEL[f]}</span>
                <Button variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp /></Button>
                <Button variant="ghost" size="icon-sm" disabled={i === s.atsPriority.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown /></Button>
              </li>
            ))}
          </ol>
          <Button variant="ghost" size="xs" className="mt-2" onClick={() => updateSettings({ atsPriority: DEFAULT_SETTINGS.atsPriority })}>Restore default order</Button>
        </Card>

        <Card title="Appearance">
          <Segmented value={s.theme} onChange={(theme) => updateSettings({ theme })} options={[{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }]} />
        </Card>

        <Card title="Data" hint={`${queries.length} queries · ${jobs.length} jobs · ${sessionHistory.length} sessions`}>
          <p className="text-xs text-muted-foreground">
            QDECK stores your data only in this browser. Export a backup regularly, especially before clearing browser data or switching devices.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportData}><Download /> Export data</Button>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload /> Import data</Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)}><RotateCcw /> Set up again</Button>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Set up QDECK again?"
        description="Opens setup so you can pick a new starter set. Finishing setup replaces your query library. Saved jobs and settings stay."
        confirmLabel="Open setup"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          restartOnboarding();
          setConfirmReset(false);
        }}
      />
      <ConfirmDialog
        open={!!pendingImport}
        title="Replace current data?"
        description={pendingImport ? `The backup contains ${pendingImport.queries.length} queries, ${pendingImport.jobs.length} saved jobs and settings. This replaces everything currently stored.` : ""}
        confirmLabel="Import"
        destructive
        onCancel={() => setPendingImport(null)}
        onConfirm={() => {
          if (pendingImport) replaceAll(pendingImport);
          setPendingImport(null);
          toast.success("Data imported");
        }}
      />
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <span>{title}</span>
        {hint && <span className="normal-case">{hint}</span>}
      </div>
      <div className="space-y-3 p-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="label">{label}</div>
      {children}
    </div>
  );
}
