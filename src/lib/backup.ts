import { z } from "zod";
import type { SavedJob, SearchQuery, SearchSession, Settings } from "./types";
import { DEFAULT_SETTINGS } from "@/data/presets";

const querySchema = z.object({
  id: z.string(),
  name: z.string(),
  query: z.string().min(1),
  lane: z.enum(["highest", "product", "oss-ai", "fullstack"]),
  platform: z.enum(["ashby", "personio-de", "personio-com", "linkedin", "join", "greenhouse", "greenhouse-legacy", "lever", "workable", "smartrecruiters", "multi", "web"]),
  language: z.enum(["en", "de"]),
  locations: z.array(z.string()),
  technologies: z.array(z.string()),
  exclusions: z.array(z.string()),
  priority: z.enum(["critical", "high", "normal", "low"]),
  frequency: z.enum(["daily", "every-2-days", "twice-weekly", "weekly", "manual"]),
  status: z.enum(["active", "paused", "archived"]),
  favorite: z.boolean(),
  group: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.number(),
  lastRunAt: z.number().nullable(),
  runCount: z.number(),
  runHistory: z.array(z.number()),
});

const jobSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  url: z.string(),
  source: z.string(),
  salary: z.string(),
  remoteMode: z.enum(["", "onsite", "hybrid", "remote"]),
  technologies: z.array(z.string()),
  notes: z.string(),
  status: z.enum(["interesting", "review", "applied", "ignore"]),
  createdAt: z.number(),
});

const settingsSchema = z
  .object({
    defaultLocation: z.string(),
    preferredCities: z.array(z.string()),
    preferredTechnologies: z.array(z.string()),
    adjacentTechnologies: z.array(z.string()),
    defaultExclusions: z.array(z.string()),
    atsPriority: z.array(z.enum(["ashby", "personio", "linkedin", "join", "greenhouse", "lever", "workable", "smartrecruiters", "multi", "web"])),
    theme: z.enum(["dark", "light"]),
  })
  .partial();

const sessionSchema = z.object({
  id: z.string(),
  label: z.string(),
  startedAt: z.number(),
  completedAt: z.number().nullable(),
  queryIds: z.array(z.string()),
  completedIds: z.array(z.string()),
  skippedIds: z.array(z.string()),
  laterIds: z.array(z.string()),
  index: z.number(),
});

const backupSchema = z.object({
  app: z.enum(["qdeck", "searchdeck"]),
  version: z.literal(1),
  exportedAt: z.number().optional(),
  queries: z.array(querySchema),
  jobs: z.array(jobSchema),
  settings: settingsSchema,
  sessionHistory: z.array(sessionSchema).optional(),
});

export interface BackupData {
  queries: SearchQuery[];
  jobs: SavedJob[];
  settings: Settings;
  sessionHistory: SearchSession[];
}

export function buildExport(d: BackupData) {
  return { app: "qdeck" as const, version: 1 as const, exportedAt: Date.now(), ...d };
}

export function parseImport(text: string): { ok: true; data: BackupData } | { ok: false; error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "File is not valid JSON." };
  }
  const r = backupSchema.safeParse(raw);
  if (!r.success) {
    const issue = r.error.issues[0]!;
    return { ok: false, error: `Invalid QDECK backup: ${issue.path.join(".") || "root"} — ${issue.message}` };
  }
  return {
    ok: true,
    data: {
      queries: r.data.queries as SearchQuery[],
      jobs: r.data.jobs as SavedJob[],
      settings: { ...DEFAULT_SETTINGS, ...r.data.settings } as Settings,
      sessionHistory: (r.data.sessionHistory ?? []) as SearchSession[],
    },
  };
}
