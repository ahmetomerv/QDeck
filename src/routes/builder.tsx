import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, ExternalLink, RotateCcw, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AddChipInput, Chip, PageHeader, Segmented } from "@/components/Controls";
import { DuplicateDialog } from "@/components/DuplicateDialog";
import { QueryText } from "@/components/QueryText";
import { LANES } from "@/data/lanes";
import { PLATFORMS, SITE_PLATFORMS } from "@/data/platforms";
import { EXCLUSION_PRESETS, FREQUENCIES, PRIORITIES, SENIORITIES } from "@/data/presets";
import { useQueries, useSettings } from "@/hooks/useAppData";
import { builderConfigs, initialBuilderState, type BuilderState } from "@/lib/builder";
import { copyQuery, openGoogle } from "@/lib/googleSearch";
import { autoName, explainConfig, generateQueries, generateVariants } from "@/lib/queryGenerator";
import { findDuplicates, normalizeQuery, type DuplicateResult } from "@/lib/queryNormalizer";
import type { Language, LaneId, NewQuery, PlatformId } from "@/lib/types";
import { addQueries } from "@/state/actions";

export const Route = createFileRoute("/builder")({
  head: () => ({
    meta: [
      { title: "Query Builder — QDECK" },
      { name: "description", content: "Build Google job-search queries visually: roles, tech, locations, ATS sites and exclusions." },
      { property: "og:title", content: "Query Builder — QDECK" },
      { property: "og:description", content: "Build Google job-search queries visually: roles, tech, locations, ATS sites and exclusions." },
    ],
  }),
  component: BuilderPage,
});

interface Candidate {
  key: string;
  name: string;
  query: string;
  platform: PlatformId;
  language: Language;
  lane: LaneId;
}

const toggle = <T extends string>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

function BuilderPage() {
  const settings = useSettings();
  const all = useQueries();
  const [s, setS] = useState<BuilderState>(() => initialBuilderState(settings));
  const [variants, setVariants] = useState<(Candidate & { checked: boolean; exists: boolean })[] | null>(null);
  const [pending, setPending] = useState<{ dup: DuplicateResult; c: Candidate } | null>(null);
  const upd = (p: Partial<BuilderState>) => setS((x) => ({ ...x, ...p }));

  const configs = useMemo(() => builderConfigs(s), [s]);
  const generated: Candidate[] = useMemo(
    () =>
      configs.flatMap(({ config }, ci) =>
        generateQueries(config, s.platformMode).map((g, gi) => ({
          key: `${ci}-${gi}`,
          name: autoName(config, g.platform),
          query: g.query,
          platform: g.platform,
          language: "en" as const,
          lane: s.lane,
        })),
      ),
    [configs, s.platformMode, s.lane],
  );
  const explain = configs[0] ? explainConfig(configs[0].config) : null;

  const toNew = (c: Candidate): NewQuery => ({
    name: c.name,
    query: c.query,
    lane: c.lane,
    platform: c.platform,
    language: c.language,
    locations: [],
    technologies: [],
    exclusions: [],
    priority: s.priority,
    frequency: s.frequency,
    status: "active",
    favorite: false,
  });

  const saveOne = (c: Candidate) => {
    const dup = findDuplicates(c.query, all);
    if (dup.exact || dup.similar.length) return setPending({ dup, c });
    addQueries([toNew(c)]);
    toast.success(`Saved "${c.name}"`);
  };

  const saveMany = (cs: Candidate[]) => {
    const existing = new Set(all.map((q) => normalizeQuery(q.query)));
    const fresh = cs.filter((c) => {
      const n = normalizeQuery(c.query);
      if (existing.has(n)) return false;
      existing.add(n);
      return true;
    });
    if (fresh.length) addQueries(fresh.map(toNew));
    const skipped = cs.length - fresh.length;
    toast.success(`Saved ${fresh.length} quer${fresh.length === 1 ? "y" : "ies"}${skipped ? ` · skipped ${skipped} duplicate${skipped === 1 ? "" : "s"}` : ""}`);
  };

  const makeVariants = () => {
    const base = configs[0]?.config;
    if (!base) return;
    const existing = new Set(all.map((q) => normalizeQuery(q.query)));
    const vs = generateVariants(base).flatMap((v) =>
      generateQueries(v.config, s.platformMode).map((g, i) => {
        const exists = existing.has(normalizeQuery(g.query));
        return {
          key: `${v.key}-${i}`,
          name: autoName(v.config, g.platform, v.label),
          query: g.query,
          platform: g.platform,
          language: v.language,
          lane: v.lane ?? s.lane,
          checked: !exists,
          exists,
        };
      }),
    );
    setVariants(vs);
  };

  return (
    <div>
      <PageHeader title="Query Builder" sub="Compose Google syntax visually. Prefilled from Settings.">
        <Button variant="ghost" size="sm" onClick={() => { setS(initialBuilderState(settings)); setVariants(null); }}>
          <RotateCcw /> Reset
        </Button>
      </PageHeader>
      <div className="grid gap-4 px-6 py-5 xl:grid-cols-[1fr_460px]">
        <div className="space-y-3">
          <Section title="Seniority">
            {SENIORITIES.map((level) => (
              <Chip
                key={level.id}
                on={s.seniority.includes(level.id)}
                onClick={() => upd({ seniority: toggle(s.seniority, level.id) })}
              >
                {level.label}
              </Chip>
            ))}
          </Section>

          <Section title="Role titles" hint="OR-combined">
            {s.rolesEn.map((r) => <Chip key={r} on={s.roles.includes(r)} onClick={() => upd({ roles: toggle(s.roles, r) })}>{r}</Chip>)}
            <AddChipInput
              placeholder="Custom title"
              onAdd={(t) => upd({ rolesEn: [...new Set([...s.rolesEn, t])], roles: [...new Set([...s.roles, t])] })}
            />
          </Section>

          <div className="panel divide-y">
            <div className="panel-header border-b-0">Technology</div>
            {s.techGroups.map((g, gi) => {
              const setG = (p: Partial<typeof g>) => upd({ techGroups: s.techGroups.map((x, i) => (i === gi ? { ...x, ...p } : x)) });
              return (
                <div key={g.id} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center">
                  <div className="flex w-44 shrink-0 items-center gap-2">
                    <span className="text-xs">{g.label}</span>
                    <Segmented value={g.mode} onChange={(mode) => setG({ mode })} options={[{ value: "any", label: "ANY" }, { value: "all", label: "ALL" }]} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.options.map((o) => <Chip key={o} on={g.selected.includes(o)} onClick={() => setG({ selected: toggle(g.selected, o) })}>{o}</Chip>)}
                    <AddChipInput placeholder="Add tech" onAdd={(t) => setG({ options: [...new Set([...g.options, t])], selected: [...new Set([...g.selected, t])] })} />
                  </div>
                </div>
              );
            })}
          </div>

          <Section title="Locations" hint="OR-combined">
            {s.locationOptions.map((l) => <Chip key={l} on={s.locations.includes(l)} onClick={() => upd({ locations: toggle(s.locations, l) })}>{l}</Chip>)}
            <AddChipInput placeholder="Add location" onAdd={(t) => upd({ locationOptions: [...new Set([...s.locationOptions, t])], locations: [...new Set([...s.locations, t])] })} />
          </Section>

          <Section title="ATS / platform">
            <Chip on={s.platforms.length === SITE_PLATFORMS.length} onClick={() => upd({ platforms: s.platforms.length === SITE_PLATFORMS.length ? [] : SITE_PLATFORMS })}>All</Chip>
            {SITE_PLATFORMS.map((p) => (
              <Chip key={p} on={s.platforms.includes(p)} onClick={() => upd({ platforms: toggle(s.platforms, p) as PlatformId[] })} title={`site:${PLATFORMS[p].site}`}>
                {PLATFORMS[p].label}
              </Chip>
            ))}
            <div className="mt-1 flex w-full items-center gap-2">
              <Segmented
                value={s.platformMode}
                onChange={(platformMode) => upd({ platformMode })}
                options={[{ value: "separate", label: "Search each ATS separately" }, { value: "combined", label: "Combine into one query" }]}
              />
              {!s.platforms.length && <span className="text-[11px] text-muted-foreground">No site filter — searches the open web</span>}
            </div>
          </Section>

          <Section title="Negative keywords">
            {s.exclusionOptions.map((e) => <Chip key={e} on={s.exclusions.includes(e)} onClick={() => upd({ exclusions: toggle(s.exclusions, e) })}>-{e}</Chip>)}
            <AddChipInput placeholder="Exclude…" onAdd={(t) => upd({ exclusionOptions: [...new Set([...s.exclusionOptions, t])], exclusions: [...new Set([...s.exclusions, t])] })} />
            <div className="mt-1 flex w-full flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Presets:</span>
              {EXCLUSION_PRESETS.map((p) => (
                <Button key={p.id} variant="outline" size="xs" onClick={() => upd({ exclusionOptions: [...new Set([...s.exclusionOptions, ...p.terms])], exclusions: p.terms })}>
                  {p.name}
                </Button>
              ))}
            </div>
          </Section>

          <Section title="Save as">
            <select className="field h-7 w-auto text-xs" value={s.lane} onChange={(e) => upd({ lane: e.target.value as LaneId })}>
              {LANES.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <select className="field h-7 w-auto text-xs" value={s.priority} onChange={(e) => upd({ priority: e.target.value as BuilderState["priority"] })}>
              {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label} priority</option>)}
            </select>
            <select className="field h-7 w-auto text-xs" value={s.frequency} onChange={(e) => upd({ frequency: e.target.value as BuilderState["frequency"] })}>
              {FREQUENCIES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </Section>
        </div>

        <div className="space-y-3 xl:sticky xl:top-5 xl:h-fit">
          <section className="panel">
            <div className="panel-header">
              <span>Generated query{generated.length > 1 ? ` · ${generated.length}` : ""}</span>
              {generated.length > 1 && (
                <Button size="xs" variant="ghost" className="normal-case" onClick={() => saveMany(generated)}>
                  <Save /> Save all
                </Button>
              )}
            </div>
            <div className="max-h-[420px] divide-y overflow-y-auto">
              {generated.map((g) => (
                <div key={g.key} className="space-y-2 p-3">
                  <div className="text-xs font-medium">{g.name}</div>
                  <div className="rounded-md border bg-background p-2.5">
                    <QueryText query={g.query} multiline />
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="xs" variant="outline" onClick={() => copyQuery(g.query)}><Copy /> Copy</Button>
                    <Button size="xs" variant="outline" onClick={() => openGoogle(g.query)}><ExternalLink /> Open in Google</Button>
                    <Button size="xs" onClick={() => saveOne(g)}><Save /> Save Query</Button>
                  </div>
                </div>
              ))}
            </div>
            {explain && (
              <dl className="grid grid-cols-[80px_1fr] gap-x-3 gap-y-1 border-t px-3 py-2.5 text-[11px]">
                {Object.entries(explain).map(([k, v]) => (
                  <Fragment2 key={k} k={k} v={v} />
                ))}
              </dl>
            )}
          </section>

          <section className="panel">
            <div className="panel-header">
              <span>Variants</span>
              <Button size="xs" variant="ghost" className="normal-case" onClick={makeVariants}>
                <Sparkles /> Generate Variants
              </Button>
            </div>
            {!variants ? (
              <p className="px-3 py-4 text-[11px] text-muted-foreground">Deterministic permutations of this config: General, Vue/Nuxt, React, Munich, Berlin, Remote, AI/OSS.</p>
            ) : (
              <>
                <div className="px-3 pt-2 text-[11px] text-muted-foreground">Generated {variants.length} queries</div>
                <ul className="max-h-80 divide-y overflow-y-auto">
                  {variants.map((v, i) => (
                    <li key={v.key} className="flex gap-2 px-3 py-2">
                      <input
                        type="checkbox"
                        className="mt-0.5 accent-primary"
                        checked={v.checked}
                        onChange={() => setVariants(variants.map((x, j) => (j === i ? { ...x, checked: !x.checked } : x)))}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="truncate">{v.name}</span>
                          {v.exists && <span className="rounded border px-1 text-[10px] text-st-due">exists</span>}
                        </div>
                        <QueryText query={v.query} className="text-[11px] text-muted-foreground" />
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-end gap-2 border-t p-2">
                  <Button size="xs" variant="ghost" onClick={() => setVariants(null)}>Discard</Button>
                  <Button
                    size="xs"
                    disabled={!variants.some((v) => v.checked)}
                    onClick={() => {
                      saveMany(variants.filter((v) => v.checked));
                      setVariants(null);
                    }}
                  >
                    Save selected ({variants.filter((v) => v.checked).length})
                  </Button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
      <DuplicateDialog
        result={pending?.dup ?? null}
        onCancel={() => setPending(null)}
        onSaveAnyway={() => {
          if (pending) {
            addQueries([toNew(pending.c)]);
            toast.success(`Saved "${pending.c.name}"`);
          }
          setPending(null);
        }}
      />
    </div>
  );
}

function Fragment2({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-muted-foreground capitalize">{k}</dt>
      <dd>{v}</dd>
    </>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <span>{title}</span>
        {hint && <span className="normal-case">{hint}</span>}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 p-3">{children}</div>
    </section>
  );
}
