import { ALL_TECH } from "@/data/presets";
import type { Language } from "./types";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const CASE_SENSITIVE = new Set(["AI", "LLM"]);

function has(query: string, term: string): boolean {
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${esc(term)}($|[^\\p{L}\\p{N}])`, CASE_SENSITIVE.has(term) ? "u" : "iu");
  return re.test(query);
}

/** Strip exclusions so "-Java" isn't detected as a technology. */
function positivePart(query: string) {
  return query.replace(/(^|\s)-("[^"]*"|\S+)/g, " ");
}

export function extractExclusions(query: string): string[] {
  const out: string[] = [];
  const re = /(?:^|\s)-("([^"]*)"|[^\s)]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(query))) out.push(m[2] ?? m[1] ?? "");
  return out;
}

export function extractMeta(query: string): {
  technologies: string[];
  locations: string[];
  exclusions: string[];
  language: Language;
} {
  const pos = positivePart(query);
  const technologies = ALL_TECH.filter((t) => has(pos, t));
  const locations: string[] = [];
  for (const l of ["Germany", "Munich", "München", "Berlin"]) if (has(pos, l)) locations.push(l);
  if (has(pos, "remote")) locations.push("Remote Germany");
  const language: Language = /entwickler/i.test(query) ? "de" : "en";
  return { technologies, locations, exclusions: extractExclusions(query), language };
}
