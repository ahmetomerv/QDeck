import type { Frequency, LaneId, PlatformFamily, PlatformId, Priority, SearchQuery } from "@/lib/types";
import { familyOf } from "./platforms";
import { extractMeta } from "@/lib/queryMeta";

interface SeedDef {
  p: PlatformId;
  n: string;
  q: string;
  lane: LaneId;
  group?: string;
  priority?: Priority;
}

const DEFAULT_FREQ: Record<PlatformFamily, Frequency> = {
  ashby: "daily",
  personio: "every-2-days",
  linkedin: "every-2-days",
  join: "twice-weekly",
  greenhouse: "twice-weekly",
  lever: "twice-weekly",
  workable: "weekly",
  smartrecruiters: "weekly",
  multi: "every-2-days",
  web: "twice-weekly",
};

const CROSS_SITES = `(site:jobs.ashbyhq.com OR site:jobs.lever.co OR site:job-boards.greenhouse.io OR site:jobs.personio.de)`;

export const SEED_DEFS: SeedDef[] = [
  // ASHBY
  { p: "ashby", n: "Senior Frontend · TypeScript · Germany", lane: "highest", q: `site:jobs.ashbyhq.com "Senior Frontend Engineer" TypeScript Germany` },
  { p: "ashby", n: "Frontend/Product · Germany Cities", lane: "highest", q: `site:jobs.ashbyhq.com ("Senior Frontend" OR "Product Engineer") TypeScript (Germany OR Munich OR Berlin)` },
  { p: "ashby", n: "Vue/Nuxt · Frontend/Product", lane: "highest", q: `site:jobs.ashbyhq.com ("Frontend Engineer" OR "Product Engineer") (Vue OR Nuxt) Germany` },
  { p: "ashby", n: "AI / LLM · Frontend/Product", lane: "oss-ai", q: `site:jobs.ashbyhq.com ("Senior Frontend" OR "Product Engineer") TypeScript (AI OR LLM OR agentic) Germany` },
  { p: "ashby", n: "Open Source · TypeScript", lane: "oss-ai", q: `site:jobs.ashbyhq.com TypeScript "open source" Germany` },
  // PERSONIO
  { p: "personio-de", n: "Senior Frontend · TypeScript", lane: "highest", q: `site:jobs.personio.de "Senior Frontend" TypeScript` },
  { p: "personio-de", n: "Frontend/Product · Vue/React/Nuxt", lane: "product", q: `site:jobs.personio.de ("Senior Frontend" OR "Product Engineer") (Vue OR React OR Nuxt)` },
  { p: "personio-de", n: "Senior SWE · TypeScript frontend", lane: "fullstack", q: `site:jobs.personio.de "Senior Software Engineer" TypeScript frontend` },
  { p: "personio-de", n: "TypeScript Vue · München", lane: "highest", q: `site:jobs.personio.de TypeScript Vue München` },
  { p: "personio-de", n: "TypeScript React · München", lane: "highest", q: `site:jobs.personio.de TypeScript React München` },
  { p: "personio-com", n: "Senior Frontend · TypeScript · Germany", lane: "highest", q: `site:jobs.personio.com "Senior Frontend" TypeScript Germany` },
  // LINKEDIN
  { p: "linkedin", n: "Senior Frontend · TypeScript · Germany", lane: "highest", q: `site:linkedin.com/jobs/view "Senior Frontend Engineer" TypeScript Germany` },
  { p: "linkedin", n: "Senior Frontend · Vue/Nuxt · Germany", lane: "highest", q: `site:linkedin.com/jobs/view "Senior Frontend Engineer" (Vue OR Nuxt) Germany` },
  { p: "linkedin", n: "Senior Frontend · TypeScript · Munich", lane: "highest", q: `site:linkedin.com/jobs/view "Senior Frontend Engineer" TypeScript (Munich OR München)` },
  { p: "linkedin", n: "Product Engineer · TypeScript · Germany", lane: "product", q: `site:linkedin.com/jobs/view "Product Engineer" TypeScript Germany` },
  { p: "linkedin", n: "Product/Frontend · AI · Germany", lane: "oss-ai", q: `site:linkedin.com/jobs/view ("Product Engineer" OR "Frontend Engineer") TypeScript AI Germany` },
  { p: "linkedin", n: "Senior SWE · TypeScript Vue · Germany", lane: "fullstack", q: `site:linkedin.com/jobs/view "Senior Software Engineer" TypeScript Vue Germany` },
  { p: "linkedin", n: "Senior Frontend · Remote Germany", lane: "highest", q: `site:linkedin.com/jobs/view "Senior Frontend Engineer" TypeScript remote Germany` },
  // JOIN
  { p: "join", n: "Senior Frontend · TypeScript · Germany", lane: "highest", q: `site:join.com/companies "Senior Frontend Engineer" TypeScript Germany` },
  { p: "join", n: "Frontend/Product · Munich", lane: "product", q: `site:join.com/companies ("Senior Frontend" OR "Product Engineer") TypeScript Munich` },
  { p: "join", n: "Frontend/Product · Vue/Nuxt", lane: "product", q: `site:join.com/companies ("Senior Frontend" OR "Product Engineer") (Vue OR Nuxt) Germany` },
  { p: "join", n: "Senior · TypeScript React · Germany", lane: "highest", q: `site:join.com/companies TypeScript React "Senior" Germany` },
  // GREENHOUSE
  { p: "greenhouse", n: "Senior Frontend · Germany", lane: "highest", q: `site:job-boards.greenhouse.io "Senior Frontend Engineer" Germany` },
  { p: "greenhouse", n: "Senior Frontend · TypeScript · Munich", lane: "highest", q: `site:job-boards.greenhouse.io "Senior Frontend Engineer" TypeScript Munich` },
  { p: "greenhouse", n: "Product/Frontend · TypeScript · Germany", lane: "product", q: `site:job-boards.greenhouse.io ("Product Engineer" OR "Frontend Engineer") TypeScript Germany` },
  { p: "greenhouse", n: "TypeScript Vue/React · Germany", lane: "highest", q: `site:job-boards.greenhouse.io TypeScript (Vue OR React) Germany` },
  { p: "greenhouse-legacy", n: "Senior Frontend · Germany (legacy boards)", lane: "highest", q: `site:boards.greenhouse.io "Senior Frontend Engineer" Germany` },
  // LEVER
  { p: "lever", n: "Senior Frontend · Germany", lane: "highest", q: `site:jobs.lever.co "Senior Frontend Engineer" Germany` },
  { p: "lever", n: "Senior Frontend · TypeScript · Munich", lane: "highest", q: `site:jobs.lever.co "Senior Frontend Engineer" TypeScript Munich` },
  { p: "lever", n: "Product/Frontend · TypeScript · Germany", lane: "product", q: `site:jobs.lever.co ("Product Engineer" OR "Frontend Engineer") TypeScript Germany` },
  { p: "lever", n: "TypeScript Vue/Nuxt · Germany", lane: "highest", q: `site:jobs.lever.co TypeScript (Vue OR Nuxt) Germany` },
  // WORKABLE
  { p: "workable", n: "Senior Frontend · Germany", lane: "highest", q: `site:apply.workable.com "Senior Frontend Engineer" Germany` },
  { p: "workable", n: "Senior Frontend · TypeScript · Munich", lane: "highest", q: `site:apply.workable.com "Senior Frontend" TypeScript Munich` },
  { p: "workable", n: "Product/Frontend · TypeScript · Germany", lane: "product", q: `site:apply.workable.com ("Product Engineer" OR "Frontend Engineer") TypeScript Germany` },
  // SMARTRECRUITERS
  { p: "smartrecruiters", n: "Senior Frontend · Germany", lane: "highest", q: `site:jobs.smartrecruiters.com "Senior Frontend Engineer" Germany` },
  { p: "smartrecruiters", n: "Senior Frontend · TypeScript · Munich", lane: "highest", q: `site:jobs.smartrecruiters.com "Senior Frontend Engineer" TypeScript Munich` },
  { p: "smartrecruiters", n: "Senior · TypeScript Vue/React · Germany", lane: "highest", q: `site:jobs.smartrecruiters.com TypeScript (Vue OR React) "Senior" Germany` },
  // CROSS-ATS
  { p: "multi", n: "Cross-ATS · General", lane: "highest", group: "Cross-ATS searches", q: `("Senior Frontend Engineer" OR "Senior Product Engineer") (TypeScript OR JavaScript) (Vue OR Nuxt OR React) (Germany OR Munich OR München OR Berlin) ${CROSS_SITES}` },
  { p: "multi", n: "Cross-ATS · OSS / AI", lane: "oss-ai", group: "Cross-ATS searches", q: `("Senior Frontend Engineer" OR "Product Engineer") TypeScript ("open source" OR AI OR LLM OR agentic OR "developer tools") Germany ${CROSS_SITES}` },
  { p: "multi", n: "Cross-ATS · Vue / Nuxt", lane: "highest", group: "Cross-ATS searches", q: `("Senior Frontend Engineer" OR "Senior Software Engineer") (Vue OR Nuxt) TypeScript Germany ${CROSS_SITES}` },
  // GERMAN
  { p: "web", n: "DE · Senior Frontend Entwickler · TypeScript", lane: "highest", group: "German-language searches", q: `"Senior Frontend Entwickler" TypeScript München` },
  { p: "web", n: "DE · Senior Frontend Entwickler · Vue", lane: "highest", group: "German-language searches", q: `"Senior Frontend Entwickler" Vue München` },
  { p: "web", n: "DE · Softwareentwickler Frontend · TypeScript", lane: "highest", group: "German-language searches", q: `"Senior Softwareentwickler Frontend" TypeScript München` },
  { p: "web", n: "DE · Senior Software Entwickler · Vue TS", lane: "highest", group: "German-language searches", q: `"Senior Software Entwickler" Vue TypeScript München` },
  { p: "web", n: "DE · Frontend Entwickler · Senior", lane: "highest", group: "German-language searches", q: `"Frontend Entwickler" TypeScript Vue München Senior` },
];

function defaultPriority(d: SeedDef): Priority {
  if (d.priority) return d.priority;
  if (d.lane === "highest") return d.p === "ashby" ? "critical" : "high";
  if (d.lane === "fullstack") return "normal";
  return "high";
}

/** Legacy personal library kept for tests. First launch no longer loads it. */
export function createSeedQueries(now: number): SearchQuery[] {
  const counters: Record<string, number> = {};
  return SEED_DEFS.map((d) => {
    const fam = familyOf(d.p);
    counters[fam] = (counters[fam] ?? 0) + 1;
    const meta = extractMeta(d.q);
    return {
      id: `seed-${fam}-${counters[fam]}`,
      name: d.n,
      query: d.q,
      lane: d.lane,
      platform: d.p,
      language: meta.language,
      locations: meta.locations,
      technologies: meta.technologies,
      exclusions: meta.exclusions,
      priority: defaultPriority(d),
      frequency: DEFAULT_FREQ[fam],
      status: "active",
      favorite: false,
      group: d.group,
      createdAt: now,
      lastRunAt: null,
      runCount: 0,
      runHistory: [],
    };
  });
}
