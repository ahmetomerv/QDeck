export type LaneId = "highest" | "product" | "oss-ai" | "fullstack";

export type PlatformId =
  | "ashby"
  | "personio-de"
  | "personio-com"
  | "linkedin"
  | "join"
  | "greenhouse"
  | "greenhouse-legacy"
  | "lever"
  | "workable"
  | "smartrecruiters"
  | "multi"
  | "web";

export type PlatformFamily =
  | "ashby"
  | "personio"
  | "linkedin"
  | "join"
  | "greenhouse"
  | "lever"
  | "workable"
  | "smartrecruiters"
  | "multi"
  | "web";

export type Language = "en" | "de";
export type Priority = "critical" | "high" | "normal" | "low";
export type Frequency = "daily" | "every-2-days" | "twice-weekly" | "weekly" | "manual";
export type QueryStatus = "active" | "paused" | "archived";
export type DueState = "never" | "overdue" | "due" | "fresh" | "manual";

export interface SearchQuery {
  id: string;
  name: string;
  query: string;
  lane: LaneId;
  platform: PlatformId;
  language: Language;
  locations: string[];
  technologies: string[];
  exclusions: string[];
  priority: Priority;
  frequency: Frequency;
  status: QueryStatus;
  favorite: boolean;
  group?: string | undefined;
  notes?: string | undefined;
  createdAt: number;
  lastRunAt: number | null;
  runCount: number;
  runHistory: number[];
}

export type NewQuery = Omit<SearchQuery, "id" | "createdAt" | "lastRunAt" | "runCount" | "runHistory">;

export interface JobSearchLane {
  id: LaneId;
  name: string;
  short: string;
  description: string;
  priority: Priority;
  template: string;
  weight: number;
}

export type JobStatus = "interesting" | "review" | "applied" | "ignore";
export type RemoteMode = "" | "onsite" | "hybrid" | "remote";

export interface SavedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  salary: string;
  remoteMode: RemoteMode;
  technologies: string[];
  notes: string;
  status: JobStatus;
  createdAt: number;
}

export interface SearchSession {
  id: string;
  label: string;
  startedAt: number;
  completedAt: number | null;
  queryIds: string[];
  completedIds: string[];
  skippedIds: string[];
  laterIds: string[];
  index: number;
}

export interface Settings {
  defaultLocation: string;
  preferredCities: string[];
  preferredTechnologies: string[];
  adjacentTechnologies: string[];
  defaultExclusions: string[];
  atsPriority: PlatformFamily[];
  theme: "dark" | "light";
}

/** Local setup record. Absent until the first-run flow is finished. */
export interface Profile {
  onboarded: true;
  roles: string[];
  seniority: Array<"junior" | "mid" | "senior">;
  location: string;
}
