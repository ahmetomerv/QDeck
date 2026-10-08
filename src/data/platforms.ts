import type { PlatformFamily, PlatformId } from "@/lib/types";

export interface PlatformDef {
  id: PlatformId;
  label: string;
  short: string;
  family: PlatformFamily;
  site: string | null;
}

export const PLATFORMS: Record<PlatformId, PlatformDef> = {
  ashby: { id: "ashby", label: "Ashby", short: "Ashby", family: "ashby", site: "jobs.ashbyhq.com" },
  "personio-de": { id: "personio-de", label: "Personio DE", short: "Personio", family: "personio", site: "jobs.personio.de" },
  "personio-com": { id: "personio-com", label: "Personio COM", short: "Personio", family: "personio", site: "jobs.personio.com" },
  linkedin: { id: "linkedin", label: "LinkedIn", short: "LinkedIn", family: "linkedin", site: "linkedin.com/jobs/view" },
  join: { id: "join", label: "JOIN", short: "JOIN", family: "join", site: "join.com/companies" },
  greenhouse: { id: "greenhouse", label: "Greenhouse Job Boards", short: "Greenhouse", family: "greenhouse", site: "job-boards.greenhouse.io" },
  "greenhouse-legacy": { id: "greenhouse-legacy", label: "Greenhouse Boards", short: "Greenhouse", family: "greenhouse", site: "boards.greenhouse.io" },
  lever: { id: "lever", label: "Lever", short: "Lever", family: "lever", site: "jobs.lever.co" },
  workable: { id: "workable", label: "Workable", short: "Workable", family: "workable", site: "apply.workable.com" },
  smartrecruiters: { id: "smartrecruiters", label: "SmartRecruiters", short: "SmartRecruiters", family: "smartrecruiters", site: "jobs.smartrecruiters.com" },
  multi: { id: "multi", label: "Cross-ATS", short: "Cross-ATS", family: "multi", site: null },
  web: { id: "web", label: "Open web", short: "Web", family: "web", site: null },
};

/** Platforms that map to a single site: operator. */
export const SITE_PLATFORMS: PlatformId[] = [
  "ashby",
  "personio-de",
  "personio-com",
  "linkedin",
  "join",
  "greenhouse",
  "greenhouse-legacy",
  "lever",
  "workable",
  "smartrecruiters",
];

export const ATS_FAMILIES: PlatformFamily[] = [
  "ashby",
  "personio",
  "greenhouse",
  "lever",
  "linkedin",
  "join",
  "workable",
  "smartrecruiters",
];

export const FAMILY_LABEL: Record<PlatformFamily, string> = {
  ashby: "Ashby",
  personio: "Personio",
  greenhouse: "Greenhouse",
  lever: "Lever",
  linkedin: "LinkedIn",
  join: "JOIN",
  workable: "Workable",
  smartrecruiters: "SmartRecruiters",
  multi: "Cross-ATS",
  web: "Open web",
};

export const FAMILY_PRIMARY: Record<PlatformFamily, PlatformId> = {
  ashby: "ashby",
  personio: "personio-de",
  greenhouse: "greenhouse",
  lever: "lever",
  linkedin: "linkedin",
  join: "join",
  workable: "workable",
  smartrecruiters: "smartrecruiters",
  multi: "multi",
  web: "web",
};

export function titleWithPlatform(name: string, p: PlatformId): string {
  const label = FAMILY_LABEL[familyOf(p)];
  return name.startsWith(label) || name.startsWith("DE ·") ? name : `${label} · ${name}`;
}

export function familyOf(p: PlatformId): PlatformFamily {
  return PLATFORMS[p]?.family ?? "web";
}

/** Extract all site: operator values from a query string. */
export function extractSites(query: string): string[] {
  const out: string[] = [];
  const re = /site:([^\s)]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(query))) out.push((m[1] ?? "").toLowerCase().replace(/\/+$/, ""));
  return out;
}

export function detectPlatform(query: string): PlatformId {
  const sites = extractSites(query);
  if (sites.length === 0) return "web";
  if (sites.length > 1) return "multi";
  const hit = SITE_PLATFORMS.find((p) => PLATFORMS[p].site === sites[0]);
  return hit ?? "web";
}
