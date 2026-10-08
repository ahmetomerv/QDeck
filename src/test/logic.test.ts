import { describe, expect, it } from "vitest";
import { generateQueries, generateQuery, generateVariants, withSeniority } from "@/lib/queryGenerator";
import { STARTER_PLATFORMS, buildPackQueries } from "@/lib/rolePacks";
import { googleUrl } from "@/lib/googleSearch";
import { getDueState } from "@/lib/queryScheduler";
import { findDuplicates } from "@/lib/queryNormalizer";
import { createSeedQueries } from "@/data/seedQueries";
import { detectPlatform } from "@/data/platforms";
import { advanceSession, createSession, deferCurrent } from "@/lib/session";

const H = 3600_000;

describe("query generator", () => {
  it("builds the spec example", () => {
    const { query } = generateQuery({
      roles: ["Senior Frontend Engineer", "Product Engineer"],
      techGroups: [{ terms: ["TypeScript"], mode: "all" }, { terms: ["Vue", "Nuxt", "React"], mode: "any" }],
      locations: ["Germany", "Munich"],
      platforms: ["ashby"],
      exclusions: ["Java", "SAP"],
    });
    expect(query).toBe('site:jobs.ashbyhq.com ("Senior Frontend Engineer" OR "Product Engineer") TypeScript (Vue OR Nuxt OR React) (Germany OR Munich) -Java -SAP');
  });
  it("combines and separates ATS", () => {
    const cfg = { roles: ["Frontend Engineer"], techGroups: [], locations: ["Germany"], platforms: ["ashby", "lever"] as const, exclusions: ["C#", ".NET"] };
    expect(generateQueries({ ...cfg, platforms: [...cfg.platforms] }, "separate")).toHaveLength(2);
    const [c] = generateQueries({ ...cfg, platforms: [...cfg.platforms] }, "combined");
    expect(c!.query).toBe('"Frontend Engineer" Germany (site:jobs.ashbyhq.com OR site:jobs.lever.co) -"C#" -".NET"');
    expect(c!.platform).toBe("multi");
  });
  it("prefixes roles with seniority", () => {
    expect(withSeniority(["Frontend Engineer", "Full Stack Engineer"], ["senior"])).toEqual([
      "Senior Frontend Engineer",
      "Senior Full Stack Engineer",
    ]);
    expect(withSeniority(["Frontend Engineer"], ["senior", "junior"])).toEqual(["Junior Frontend Engineer", "Senior Frontend Engineer"]);
    expect(withSeniority(["Frontend Engineer"], [])).toEqual(["Frontend Engineer"]);
  });
  it("builds one search per board for each selected role", () => {
    const qs = buildPackQueries({ packIds: ["frontend", "backend"], seniority: ["senior"], location: "Germany" });
    expect(qs).toHaveLength(2 * STARTER_PLATFORMS.length);
    expect(qs[0]?.query).toBe(
      'site:jobs.ashbyhq.com "Senior Frontend Engineer" TypeScript (React OR Vue OR Nuxt) Germany -Java -PHP',
    );
    expect(qs.some((q) => q.query.includes('"Senior Backend Engineer"') && q.query.includes("(Node OR PostgreSQL)"))).toBe(true);
    expect(qs.find((q) => q.group === "Backend Engineer")?.name).toContain("Node/PostgreSQL");
    expect(qs.every((q) => q.language === "en")).toBe(true);
    expect(buildPackQueries({ packIds: ["missing"], seniority: ["junior", "senior"], location: "  " })).toEqual([]);
    const leveled = buildPackQueries({ packIds: ["frontend"], seniority: ["senior", "junior"], location: "Berlin" });
    expect(leveled[0]?.query).toContain('("Junior Frontend Engineer" OR "Senior Frontend Engineer")');
    expect(leveled[0]?.query).toContain("Berlin");
  });
  it("variants are unique", () => {
    const v = generateVariants({ roles: ["Senior Frontend Engineer"], techGroups: [{ terms: ["Vue", "Nuxt", "React"], mode: "any" }], locations: ["Germany"], platforms: ["ashby"], exclusions: [] });
    expect(new Set(v.map((x) => generateQuery(x.config).query)).size).toBe(v.length);
    expect(v.length).toBeGreaterThanOrEqual(6);
  });
});

describe("seeds", () => {
  const seeds = createSeedQueries(0);
  it("has unique ids and detects platforms consistently", () => {
    expect(seeds.length).toBe(45);
    expect(new Set(seeds.map((s) => s.id)).size).toBe(seeds.length);
    for (const s of seeds) expect(detectPlatform(s.query)).toBe(s.platform);
  });
  it("encodes google urls", () => {
    expect(googleUrl('site:jobs.ashbyhq.com "A B"')).toBe("https://www.google.com/search?q=site%3Ajobs.ashbyhq.com%20%22A%20B%22");
  });
  it("detects exact duplicates ignoring whitespace/case", () => {
    expect(findDuplicates("  SITE:jobs.ashbyhq.com   \"senior frontend engineer\" typescript germany", seeds).exact?.id).toBe("seed-ashby-1");
  });
});

describe("scheduler", () => {
  it("computes due states", () => {
    const now = 1_000 * H;
    expect(getDueState({ lastRunAt: null, frequency: "daily" }, now)).toBe("never");
    expect(getDueState({ lastRunAt: now - 10 * H, frequency: "daily" }, now)).toBe("fresh");
    expect(getDueState({ lastRunAt: now - 25 * H, frequency: "daily" }, now)).toBe("due");
    expect(getDueState({ lastRunAt: now - 49 * H, frequency: "daily" }, now)).toBe("overdue");
    expect(getDueState({ lastRunAt: now - 80 * H, frequency: "twice-weekly" }, now)).toBe("fresh");
    expect(getDueState({ lastRunAt: now - 900 * H, frequency: "manual" }, now)).toBe("manual");
  });
});

describe("session", () => {
  it("progresses and completes", () => {
    let s = createSession(["a", "b", "c"], "t", 0);
    s = deferCurrent(s);
    expect(s.queryIds).toEqual(["b", "c", "a"]);
    s = advanceSession(s, "done", 1);
    s = advanceSession(s, "skip", 2);
    s = advanceSession(s, "done", 3);
    expect(s.completedAt).toBe(3);
    expect(s.completedIds).toEqual(["b", "a"]);
    expect(s.skippedIds).toEqual(["c"]);
  });
});
