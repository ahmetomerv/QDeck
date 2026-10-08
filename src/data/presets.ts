import type { Frequency, JobStatus, Priority, Settings } from "@/lib/types";

export const ROLES_EN = ["Frontend Engineer", "Full Stack Engineer", "Backend Engineer", "Product Engineer", "Software Engineer"];

export const SENIORITIES = [
  { id: "junior", label: "Junior" },
  { id: "mid", label: "Mid" },
  { id: "senior", label: "Senior" },
] as const;

export type Seniority = (typeof SENIORITIES)[number]["id"];

export const TECH_CORE = ["TypeScript", "JavaScript"];
export const TECH_FRAMEWORK = ["Vue", "Nuxt", "React"];
export const TECH_BACKEND = ["Node", "PostgreSQL"];
export const TECH_DOMAIN = ["AI", "LLM", "agentic", "open source", "developer tools"];
export const ALL_TECH = [...TECH_CORE, ...TECH_FRAMEWORK, ...TECH_BACKEND, ...TECH_DOMAIN];

export const LOCATIONS = ["Germany", "Munich", "München", "Berlin", "Remote Germany"];

export const EXCLUSIONS = ["Java", "SAP", "WordPress", "PHP", "C#", ".NET", "Spring", "embedded", "Symfony"];

export const EXCLUSION_PRESETS: { id: string; name: string; terms: string[] }[] = [
  { id: "frontend", name: "Frontend Focus", terms: ["Java", "Spring", "C#", ".NET", "SAP"] },
  {
    id: "strong",
    name: "Strong Frontend Filter",
    terms: ["Java", "Spring", "C#", ".NET", "SAP", "PHP", "Symfony", "WordPress"],
  },
  { id: "none", name: "No exclusions", terms: [] },
];

export const FREQUENCIES: { id: Frequency; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "every-2-days", label: "Every 2 days" },
  { id: "twice-weekly", label: "Twice weekly" },
  { id: "weekly", label: "Weekly" },
  { id: "manual", label: "Manual" },
];

export const PRIORITIES: { id: Priority; label: string }[] = [
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "normal", label: "Normal" },
  { id: "low", label: "Low" },
];

export const JOB_STATUSES: { id: JobStatus; label: string }[] = [
  { id: "interesting", label: "Interesting" },
  { id: "review", label: "Review" },
  { id: "applied", label: "Applied" },
  { id: "ignore", label: "Ignore" },
];

export const DEFAULT_SETTINGS: Settings = {
  defaultLocation: "Germany",
  preferredCities: ["Munich", "München", "Berlin"],
  preferredTechnologies: ["TypeScript", "Vue", "Nuxt", "React"],
  adjacentTechnologies: ["Node", "PostgreSQL"],
  defaultExclusions: ["Java", "Spring", "C#", ".NET", "SAP"],
  atsPriority: ["ashby", "personio", "greenhouse", "lever", "linkedin", "join", "workable", "smartrecruiters"],
  theme: "dark",
};
