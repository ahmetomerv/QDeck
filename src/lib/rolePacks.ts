import type { LaneId, NewQuery, PlatformId } from "@/lib/types";
import type { Seniority } from "@/data/presets";
import { autoName, generateQueries, withSeniority, type TermGroup } from "./queryGenerator";

/** One search per board, for every selected role pack. */
export const STARTER_PLATFORMS: PlatformId[] = [
  "ashby",
  "greenhouse",
  "lever",
  "linkedin",
  "workable",
  "personio-de",
  "join",
];

export interface RolePack {
  id: string;
  title: string;
  summary: string;
  roles: string[];
  lane: LaneId;
  techGroups: TermGroup[];
  exclusions: string[];
}

export const ROLE_PACKS: RolePack[] = [
  {
    id: "frontend",
    title: "Frontend Engineer",
    summary: "TypeScript interfaces with React, Vue, or Nuxt.",
    roles: ["Frontend Engineer"],
    lane: "highest",
    techGroups: [
      { terms: ["TypeScript"], mode: "all" },
      { terms: ["React", "Vue", "Nuxt"], mode: "any" },
    ],
    exclusions: ["Java", "PHP"],
  },
  {
    id: "fullstack",
    title: "Full Stack Engineer",
    summary: "TypeScript across React and Node.",
    roles: ["Full Stack Engineer"],
    lane: "fullstack",
    techGroups: [
      { terms: ["TypeScript"], mode: "all" },
      { terms: ["React", "Node"], mode: "any" },
    ],
    exclusions: ["PHP"],
  },
  {
    id: "backend",
    title: "Backend Engineer",
    summary: "TypeScript services with Node or PostgreSQL.",
    roles: ["Backend Engineer"],
    lane: "highest",
    techGroups: [
      { terms: ["TypeScript"], mode: "all" },
      { terms: ["Node", "PostgreSQL"], mode: "any" },
    ],
    exclusions: ["WordPress", "PHP"],
  },
  {
    id: "product",
    title: "Product Engineer",
    summary: "Product-minded TypeScript and React roles.",
    roles: ["Product Engineer"],
    lane: "product",
    techGroups: [
      { terms: ["TypeScript"], mode: "all" },
      { terms: ["React"], mode: "all" },
    ],
    exclusions: ["PHP"],
  },
  {
    id: "software",
    title: "Software Engineer",
    summary: "A broader TypeScript search when the title varies.",
    roles: ["Software Engineer"],
    lane: "highest",
    techGroups: [{ terms: ["TypeScript"], mode: "all" }],
    exclusions: [],
  },
];

export function starterQueryCount(packIds: string[]): number {
  const known = ROLE_PACKS.filter((p) => packIds.includes(p.id)).length;
  return known * STARTER_PLATFORMS.length;
}

/** Builds unsaved queries for the selected role packs. Pure and deterministic. */
export function buildPackQueries(input: { packIds: string[]; seniority: Seniority[]; location: string }): NewQuery[] {
  const location = input.location.trim() || "Germany";
  const packs = ROLE_PACKS.filter((p) => input.packIds.includes(p.id));
  const out: NewQuery[] = [];
  for (const pack of packs) {
    const roles = withSeniority(pack.roles, input.seniority);
    const config = {
      roles,
      techGroups: pack.techGroups,
      locations: [location],
      platforms: STARTER_PLATFORMS,
      exclusions: pack.exclusions,
    };
    for (const g of generateQueries(config, "separate")) {
      out.push({
        name: autoName({ ...config, platforms: [g.platform] }, g.platform),
        query: g.query,
        lane: pack.lane,
        platform: g.platform,
        language: "en",
        locations: [location],
        technologies: pack.techGroups.flatMap((t) => t.terms),
        exclusions: pack.exclusions,
        priority: "high",
        frequency: "every-2-days",
        status: "active",
        favorite: false,
        group: pack.title,
      });
    }
  }
  return out;
}
