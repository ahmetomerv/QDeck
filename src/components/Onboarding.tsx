import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Chip } from "@/components/Controls";
import { Button } from "@/components/ui/button";
import { PLATFORMS } from "@/data/platforms";
import { SENIORITIES, type Seniority } from "@/data/presets";
import { useQueries, useSettings } from "@/hooks/useAppData";
import { ROLE_PACKS, STARTER_PLATFORMS, starterQueryCount } from "@/lib/rolePacks";
import { cn } from "@/lib/utils";
import { completeOnboarding } from "@/state/actions";

export function Onboarding() {
  const navigate = useNavigate();
  const settings = useSettings();
  const existing = useQueries().length;
  const [seniority, setSeniority] = useState<Seniority[]>(["senior"]);
  const [location, setLocation] = useState(settings.defaultLocation || "Germany");
  const [roles, setRoles] = useState<string[]>([]);

  const count = starterQueryCount(roles);
  const ready = roles.length > 0 && seniority.length > 0;

  const toggleSeniority = (id: Seniority) =>
    setSeniority((cur) => (cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]));
  const toggleRole = (id: string) => setRoles((cur) => (cur.includes(id) ? cur.filter((r) => r !== id) : [...cur, id]));
  const finish = (packIds: string[]) => {
    completeOnboarding({ packIds, seniority, location });
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <img src="/logo.svg" alt="QDECK" className="h-10 w-auto" />
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">Start your search</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Pick the roles you want to look for. QDECK builds a starter set of English Google searches for the main job boards and saves them on this device.
        </p>

        <section className="mt-8">
          <div className="label">Seniority</div>
          <div className="flex flex-wrap gap-1.5">
            {SENIORITIES.map((s) => (
              <Chip key={s.id} on={seniority.includes(s.id)} onClick={() => toggleSeniority(s.id)}>
                {s.label}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Added in front of each role title. You can pick more than one.</p>
        </section>

        <section className="mt-6">
          <label className="label" htmlFor="onboarding-location">
            Location
          </label>
          <input
            id="onboarding-location"
            className="field max-w-xs"
            value={location}
            placeholder="Germany"
            onChange={(e) => setLocation(e.target.value)}
          />
        </section>

        <section className="mt-6">
          <div className="label">Roles</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {ROLE_PACKS.map((pack) => {
              const on = roles.includes(pack.id);
              return (
                <button
                  key={pack.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleRole(pack.id)}
                  className={cn(
                    "rounded-lg border bg-card p-3 text-left transition-colors hover:border-foreground/25",
                    on && "border-primary/60 bg-primary/10",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">{pack.title}</span>
                    {on && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{pack.summary}</p>
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground">{STARTER_PLATFORMS.length} searches</p>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {STARTER_PLATFORMS.map((id) => (
              <span key={id} className="rounded-md border bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground">
                {PLATFORMS[id].short}
              </span>
            ))}
          </div>
        </section>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button disabled={!ready} onClick={() => finish(roles)}>
            {count ? `Start with ${count} searches` : "Select a role"}
          </Button>
          <Button variant="ghost" onClick={() => finish([])}>
            Start with an empty library
          </Button>
        </div>
        {roles.length > 0 && seniority.length === 0 && (
          <p className="mt-3 text-[11px] text-muted-foreground">Pick a seniority so each title is complete.</p>
        )}
        {existing > 0 && (
          <p className="mt-3 text-[11px] text-muted-foreground">
            Finishing setup replaces the {existing} searches already saved on this device.
          </p>
        )}
      </div>
    </div>
  );
}
