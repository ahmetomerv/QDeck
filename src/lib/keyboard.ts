export function isTypingTarget(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
}

export function plainKey(e: KeyboardEvent): boolean {
  return !e.metaKey && !e.ctrlKey && !e.altKey && !isTypingTarget(e);
}

export const SHORTCUTS: { keys: string[]; label: string; scope: string }[] = [
  { keys: ["O"], label: "Open Google", scope: "Session" },
  { keys: ["D"], label: "Done — record & next", scope: "Session" },
  { keys: ["S"], label: "Skip", scope: "Session" },
  { keys: ["N"], label: "Next (skip)", scope: "Session" },
  { keys: ["L"], label: "Save for later", scope: "Session" },
  { keys: ["F"], label: "Toggle Focus Mode", scope: "Session" },
  { keys: ["Esc"], label: "Exit Focus Mode", scope: "Session" },
  { keys: ["J"], label: "Save a job", scope: "Global" },
  { keys: ["?"], label: "Keyboard shortcuts", scope: "Global" },
];
