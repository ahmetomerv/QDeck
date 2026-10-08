import { DEFAULT_SETTINGS } from "@/data/presets";
import type { Settings } from "@/lib/types";
import { readJSON, writeJSON } from "./local";

export const SETTINGS_KEY = "settings";

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...readJSON<Partial<Settings>>(SETTINGS_KEY, {}) };
}

export const saveSettings = (s: Settings) => writeJSON(SETTINGS_KEY, s);
