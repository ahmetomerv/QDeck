import type { JobSearchLane, LaneId } from "@/lib/types";

export const LANES: JobSearchLane[] = [
  {
    id: "highest",
    name: "Highest Probability",
    short: "Highest Prob.",
    description: "Roles closely matching existing frontend experience.",
    priority: "critical",
    template: `"Senior Frontend Engineer" TypeScript (Vue OR Nuxt OR React) Germany`,
    weight: 12,
  },
  {
    id: "product",
    name: "Product Engineering",
    short: "Product",
    description: "Product-oriented frontend / software engineering roles.",
    priority: "high",
    template: `("Senior Product Engineer" OR "Product Engineer") TypeScript (React OR Vue OR Nuxt) Germany`,
    weight: 8,
  },
  {
    id: "oss-ai",
    name: "OSS / AI / Developer Tooling",
    short: "OSS / AI",
    description: "Companies working on open source, AI, LLMs, agentic software, developer tools.",
    priority: "high",
    template: `("Senior Frontend Engineer" OR "Product Engineer") TypeScript ("open source" OR AI OR LLM OR agentic OR "developer tools") Germany`,
    weight: 8,
  },
  {
    id: "fullstack",
    name: "Selective Full Stack",
    short: "Full Stack",
    description: "Full-stack roles where frontend stays important; TypeScript/Node/PostgreSQL backend.",
    priority: "normal",
    template: `("Senior Full Stack Engineer" OR "Senior Software Engineer") TypeScript frontend (React OR Vue) (Node OR PostgreSQL) Germany`,
    weight: 3,
  },
];

export const LANE_BY_ID: Record<LaneId, JobSearchLane> = Object.fromEntries(
  LANES.map((l) => [l.id, l]),
) as Record<LaneId, JobSearchLane>;
