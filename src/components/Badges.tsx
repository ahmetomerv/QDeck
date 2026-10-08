import { LANE_BY_ID } from "@/data/lanes";
import { PLATFORMS } from "@/data/platforms";
import type { DueState, LaneId, PlatformId, Priority, QueryStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const base = "inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[11px] font-medium whitespace-nowrap";

const DUE: Record<DueState, { label: string; cls: string }> = {
  never: { label: "Never searched", cls: "border-st-never/30 bg-st-never/10 text-st-never" },
  overdue: { label: "Overdue", cls: "border-st-overdue/30 bg-st-overdue/10 text-st-overdue" },
  due: { label: "Due", cls: "border-st-due/30 bg-st-due/10 text-st-due" },
  fresh: { label: "Fresh", cls: "border-st-fresh/30 bg-st-fresh/10 text-st-fresh" },
  manual: { label: "Manual", cls: "border-border bg-muted text-muted-foreground" },
};

export function DueBadge({ state, compact }: { state: DueState; compact?: boolean }) {
  const d = DUE[state];
  return (
    <span className={cn(base, d.cls)}>
      <span className="size-1.5 rounded-full bg-current" />
      {compact && state === "never" ? "New" : d.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: QueryStatus }) {
  if (status === "active") return null;
  return <span className={cn(base, "border-border bg-muted text-muted-foreground uppercase")}>{status}</span>;
}

const PRIO: Record<Priority, string> = {
  critical: "text-st-critical",
  high: "text-st-due",
  normal: "text-muted-foreground",
  low: "text-muted-foreground/60",
};
const PRIO_BARS: Record<Priority, number> = { critical: 4, high: 3, normal: 2, low: 1 };

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] capitalize", PRIO[priority])} title={`${priority} priority`}>
      <span className="flex items-end gap-px">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={cn("w-[3px] rounded-sm bg-current", n > PRIO_BARS[priority] && "opacity-20")} style={{ height: 3 + n * 2 }} />
        ))}
      </span>
      {priority}
    </span>
  );
}

export function LaneBadge({ lane, full }: { lane: LaneId; full?: boolean }) {
  const l = LANE_BY_ID[lane];
  return <span className={cn(base, "border-border bg-muted/60 text-foreground/80")}>{full ? l.name : l.short}</span>;
}

export function PlatformBadge({ platform }: { platform: PlatformId }) {
  const p = PLATFORMS[platform];
  return <span className={cn(base, "border-border bg-background font-mono text-foreground/80")}>{p.label}</span>;
}
