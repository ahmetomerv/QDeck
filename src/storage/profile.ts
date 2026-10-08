import type { Profile } from "@/lib/types";
import { readJSON, removeKey, writeJSON } from "./local";

const KEY = "profile";

export function loadProfile(): Profile | null {
  const raw = readJSON<Profile | null>(KEY, null);
  if (!raw || raw.onboarded !== true) return null;
  return raw;
}

export function saveProfile(profile: Profile | null): void {
  if (profile == null) {
    removeKey(KEY);
    return;
  }
  writeJSON(KEY, profile);
}
