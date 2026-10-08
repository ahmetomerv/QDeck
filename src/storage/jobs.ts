import type { SavedJob } from "@/lib/types";
import { readJSON, writeJSON } from "./local";

const KEY = "jobs";

export const loadJobs = (): SavedJob[] => readJSON<SavedJob[]>(KEY, []);
export const saveJobs = (jobs: SavedJob[]) => writeJSON(KEY, jobs);
