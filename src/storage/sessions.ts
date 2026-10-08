import type { SearchSession } from "@/lib/types";
import { readJSON, writeJSON } from "./local";

export const loadActiveSession = () => readJSON<SearchSession | null>("session", null);
export const saveActiveSession = (s: SearchSession | null) => writeJSON("session", s);
export const loadSessionHistory = () => readJSON<SearchSession[]>("session-history", []);
export const saveSessionHistory = (h: SearchSession[]) => writeJSON("session-history", h);
