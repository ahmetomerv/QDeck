import { FAMILY_PRIMARY } from "@/data/platforms";
import { EXCLUSIONS, LOCATIONS, ROLES_EN, TECH_BACKEND, TECH_CORE, TECH_DOMAIN, TECH_FRAMEWORK, type Seniority } from "@/data/presets";
import { withSeniority, type QueryConfig, type PlatformMode, type TermMode } from "./queryGenerator";
import type { Frequency, Language, LaneId, PlatformId, Priority, Settings } from "./types";

export type TechGroupId = "core" | "framework" | "backend" | "domain";

export interface BuilderTechGroup {
  id: TechGroupId;
  label: string;
  options: string[];
  selected: string[];
  mode: TermMode;
}

export interface BuilderState {
  seniority: Seniority[];
  rolesEn: string[];
  roles: string[];
  techGroups: BuilderTechGroup[];
  locationOptions: string[];
  locations: string[];
  platforms: PlatformId[];
  platformMode: PlatformMode;
  exclusionOptions: string[];
  exclusions: string[];
  lane: LaneId;
  priority: Priority;
  frequency: Frequency;
}

const uniq = <T,>(a: T[]) => Array.from(new Set(a));

export function initialBuilderState(settings: Settings): BuilderState {
  const pref = settings.preferredTechnologies;
  const adj = settings.adjacentTechnologies;
  const known = [...TECH_CORE, ...TECH_FRAMEWORK, ...TECH_BACKEND, ...TECH_DOMAIN];
  const extra = uniq([...pref, ...adj]).filter((t) => !known.includes(t));
  const group = (id: TechGroupId, label: string, options: string[], mode: TermMode): BuilderTechGroup => ({
    id,
    label,
    options: id === "domain" ? uniq([...options, ...extra]) : options,
    selected: options.filter((o) => pref.includes(o)),
    mode,
  });
  const top = settings.atsPriority[0];
  return {
    seniority: ["senior"],
    rolesEn: ROLES_EN,
    roles: ["Frontend Engineer", "Product Engineer"],
    techGroups: [
      group("core", "Language", TECH_CORE, "all"),
      group("framework", "Frontend framework", TECH_FRAMEWORK, "any"),
      group("backend", "Backend (adjacent)", uniq([...TECH_BACKEND, ...adj]), "any"),
      group("domain", "Domain", TECH_DOMAIN, "any"),
    ],
    locationOptions: uniq([...LOCATIONS, settings.defaultLocation, ...settings.preferredCities]),
    locations: uniq([settings.defaultLocation, ...settings.preferredCities]),
    platforms: top ? [FAMILY_PRIMARY[top]] : ["ashby"],
    platformMode: "separate",
    exclusionOptions: uniq([...EXCLUSIONS, ...settings.defaultExclusions]),
    exclusions: settings.defaultExclusions,
    lane: "highest",
    priority: "high",
    frequency: "every-2-days",
  };
}

export interface BuilderConfig {
  config: QueryConfig;
  language: Language;
}

export function builderConfigs(s: BuilderState): BuilderConfig[] {
  const roles = withSeniority(
    s.rolesEn.filter((o) => s.roles.includes(o)),
    s.seniority,
  );
  const techGroups = s.techGroups
    .map((g) => ({ terms: g.options.filter((o) => g.selected.includes(o)), mode: g.mode }))
    .filter((g) => g.terms.length);
  const locations = s.locationOptions.filter((l) => s.locations.includes(l));
  const exclusions = s.exclusionOptions.filter((e) => s.exclusions.includes(e));
  return [{ config: { roles, techGroups, locations, platforms: s.platforms, exclusions }, language: "en" }];
}
