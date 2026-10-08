import { PLATFORMS } from "@/data/platforms";
import { SENIORITIES, TECH_BACKEND, TECH_DOMAIN, TECH_FRAMEWORK, type Seniority } from "@/data/presets";
import { googleUrl } from "./googleSearch";
import type { Language, LaneId, PlatformId } from "./types";

export type TermMode = "any" | "all";
export interface TermGroup {
  terms: string[];
  mode: TermMode;
}

export interface QueryConfig {
  roles: string[];
  techGroups: TermGroup[];
  locations: string[];
  platforms: PlatformId[];
  exclusions: string[];
}

export type PlatformMode = "separate" | "combined";

export interface GeneratedQuery {
  query: string;
  googleUrl: string;
  platform: PlatformId;
}

export const quoteTerm = (t: string) => {
  const s = t.trim().replace(/"/g, "");
  return /\s/.test(s) ? `"${s}"` : s;
};

export function orGroup(terms: string[]): string {
  const q = terms.filter(Boolean).map(quoteTerm);
  if (q.length === 0) return "";
  return q.length === 1 ? q[0]! : `(${q.join(" OR ")})`;
}

const SENIORITY_ORDER: Seniority[] = SENIORITIES.map((s) => s.id);

/** Prefix each role with the selected seniority levels, in Junior / Mid / Senior order. */
export function withSeniority(roles: string[], seniority: Seniority[]): string[] {
  const selected = SENIORITY_ORDER.filter((s) => seniority.includes(s));
  if (!selected.length) return roles;
  return selected.flatMap((s) => roles.map((r) => `${SENIORITIES.find((x) => x.id === s)!.label} ${r}`));
}

export function rolePart(roles: string[]): string {
  const q = roles.filter(Boolean).map((r) => `"${r.trim().replace(/"/g, "")}"`);
  if (q.length === 0) return "";
  return q.length === 1 ? q[0]! : `(${q.join(" OR ")})`;
}

export function groupPart(g: TermGroup): string {
  if (!g.terms.length) return "";
  return g.mode === "all" ? g.terms.map(quoteTerm).join(" ") : orGroup(g.terms);
}

/** "Remote Germany" becomes a `remote` keyword plus Germany in the location group. */
export function locationPart(locations: string[]): string {
  const remote = locations.includes("Remote Germany");
  let locs = locations.filter((l) => l !== "Remote Germany");
  if (remote && !locs.includes("Germany")) locs = ["Germany", ...locs];
  const group = orGroup(locs);
  return [remote ? "remote" : "", group].filter(Boolean).join(" ");
}

export function exclusionPart(exclusions: string[]): string {
  return exclusions
    .filter(Boolean)
    .map((t) => (/^[\p{L}\p{N}_-]+$/u.test(t) ? `-${t}` : `-"${t.replace(/"/g, "")}"`))
    .join(" ");
}

function sitesOf(platforms: PlatformId[]): string[] {
  return platforms.map((p) => PLATFORMS[p]?.site).filter((s): s is string => !!s);
}

/** Deterministic Google query generation. Single site → prefix; multiple sites → OR group suffix. */
export function generateQuery(config: QueryConfig): GeneratedQuery {
  const sites = sitesOf(config.platforms);
  const parts: string[] = [];
  if (sites.length === 1) parts.push(`site:${sites[0]}`);
  parts.push(rolePart(config.roles));
  for (const g of config.techGroups) parts.push(groupPart(g));
  parts.push(locationPart(config.locations));
  if (sites.length > 1) parts.push(`(${sites.map((s) => `site:${s}`).join(" OR ")})`);
  parts.push(exclusionPart(config.exclusions));
  const query = parts.filter(Boolean).join(" ");
  const platform: PlatformId =
    sites.length > 1 ? "multi" : sites.length === 1 ? (config.platforms.find((p) => PLATFORMS[p].site) ?? "web") : "web";
  return { query, googleUrl: googleUrl(query), platform };
}

export function generateQueries(config: QueryConfig, mode: PlatformMode): GeneratedQuery[] {
  const sitePlatforms = config.platforms.filter((p) => PLATFORMS[p]?.site);
  if (mode === "combined" || sitePlatforms.length <= 1) return [generateQuery({ ...config, platforms: sitePlatforms })];
  return sitePlatforms.map((p) => generateQuery({ ...config, platforms: [p] }));
}

/* ---------- readable explanation ---------- */

export function explainConfig(config: QueryConfig) {
  const tech = config.techGroups
    .filter((g) => g.terms.length)
    .map((g) => (g.mode === "all" ? g.terms.join(" + ") : g.terms.join("/")))
    .join(" + ");
  return {
    roles: config.roles.join(", ") || "Any",
    tech: tech || "Any",
    location: config.locations.join("/") || "Anywhere",
    platform: config.platforms.map((p) => PLATFORMS[p].label).join(", ") || "Open web",
    exclusions: config.exclusions.join(", ") || "None",
  };
}

/* ---------- naming ---------- */

function shortRole(r: string) {
  return r.replace(/^(Junior|Mid|Senior)\s+/, "").replace(/ Engineer$/, "");
}

export function autoName(config: QueryConfig, platform: PlatformId, prefix?: string): string {
  const levels = Array.from(new Set(config.roles.map((r) => r.match(/^(Junior|Mid|Senior)\b/)?.[1]).filter((x): x is string => !!x)));
  const roles = config.roles.length
    ? Array.from(new Set(config.roles.map(shortRole))).slice(0, 2).join("/")
    : "Any role";
  const fw = config.techGroups.flatMap((g) => g.terms).filter((t) => [...TECH_FRAMEWORK, ...TECH_BACKEND, ...TECH_DOMAIN].includes(t));
  const tech = fw.length ? fw.slice(0, 3).join("/") : config.techGroups[0]?.terms[0];
  const loc = config.locations.length > 2 ? "Germany+cities" : config.locations.join("/");
  const plat = PLATFORMS[platform]?.short;
  return [prefix, levels.join("/") || undefined, roles, tech, loc, platform === "web" ? undefined : plat].filter(Boolean).join(" · ");
}

/* ---------- variants ---------- */

export interface Variant {
  key: string;
  label: string;
  config: QueryConfig;
  language: Language;
  lane?: LaneId;
}

const isFramework = (g: TermGroup) => g.terms.some((t) => TECH_FRAMEWORK.includes(t));
const isDomain = (g: TermGroup) => g.terms.some((t) => TECH_DOMAIN.includes(t));

function withFramework(cfg: QueryConfig, terms: string[]): QueryConfig {
  const idx = cfg.techGroups.findIndex(isFramework);
  const groups = [...cfg.techGroups];
  if (idx >= 0) groups[idx] = { terms, mode: "any" };
  else groups.push({ terms, mode: "any" });
  return { ...cfg, techGroups: groups };
}

/** Deterministic permutations of a base configuration. */
export function generateVariants(base: QueryConfig): Variant[] {
  const out: Variant[] = [
    { key: "general", label: "General Germany", language: "en", config: { ...base, locations: ["Germany"] } },
    { key: "vue", label: "Vue/Nuxt Germany", language: "en", config: withFramework({ ...base, locations: ["Germany"] }, ["Vue", "Nuxt"]) },
    { key: "react", label: "React Germany", language: "en", config: withFramework({ ...base, locations: ["Germany"] }, ["React"]) },
    { key: "munich", label: "Munich", language: "en", config: { ...base, locations: ["Munich", "München"] } },
    { key: "berlin", label: "Berlin", language: "en", config: { ...base, locations: ["Berlin"] } },
    { key: "remote", label: "Remote Germany", language: "en", config: { ...base, locations: ["Remote Germany"] } },
    {
      key: "ai",
      label: "AI/OSS focused",
      language: "en",
      lane: "oss-ai",
      config: {
        ...base,
        locations: ["Germany"],
        techGroups: [...base.techGroups.filter((g) => !isDomain(g)), { terms: TECH_DOMAIN, mode: "any" }],
      },
    },
  ];
  const seen = new Set<string>();
  return out.filter((v) => {
    const q = generateQuery(v.config).query;
    if (seen.has(q)) return false;
    seen.add(q);
    return true;
  });
}
