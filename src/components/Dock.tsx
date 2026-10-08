import { Link, useRouterState } from "@tanstack/react-router";
import { Bookmark, BookmarkPlus, Blocks, Keyboard, LayoutDashboard, ListTree, Play, Settings2, type LucideIcon } from "lucide-react";
import { useRef, useState } from "react";
import { openJobDialog, setHelpOpen } from "@/state/actions";
import { cn } from "@/lib/utils";

const MAG = 0.08;

type DockItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  tone: string;
  to?: string;
  onClick?: () => void;
  kbd?: string;
  badge?: number;
};

export function Dock({ counts }: { counts: Record<string, number | undefined> }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const iconRefs = useRef<(HTMLElement | null)[]>([]);
  const hoverRef = useRef<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const items: Array<DockItem | "sep"> = [
    { key: "/", label: "Dashboard", icon: LayoutDashboard, to: "/", tone: "bg-primary text-primary-foreground", badge: counts["/"] },
    { key: "/session", label: "Search Session", icon: Play, to: "/session", tone: "bg-[oklch(0.55_0.14_250)] text-white", badge: counts["/session"] },
    { key: "/queries", label: "Queries", icon: ListTree, to: "/queries", tone: "bg-[oklch(0.68_0.14_75)] text-[oklch(0.22_0.04_75)]", badge: counts["/queries"] },
    { key: "/builder", label: "Query Builder", icon: Blocks, to: "/builder", tone: "bg-[oklch(0.55_0.14_300)] text-white", badge: counts["/builder"] },
    { key: "/jobs", label: "Saved Jobs", icon: Bookmark, to: "/jobs", tone: "bg-[oklch(0.58_0.18_25)] text-white", badge: counts["/jobs"] },
    { key: "/settings", label: "Settings", icon: Settings2, to: "/settings", tone: "bg-[oklch(0.42_0.02_260)] text-white", badge: counts["/settings"] },
    "sep",
    { key: "save", label: "Save job", icon: BookmarkPlus, onClick: () => openJobDialog(), kbd: "J", tone: "bg-primary text-primary-foreground" },
    { key: "shortcuts", label: "Shortcuts", icon: Keyboard, onClick: () => setHelpOpen(true), kbd: "?", tone: "bg-foreground/15 text-foreground" },
  ];

  const setHoverIndex = (next: number | null) => {
    if (hoverRef.current === next) return;
    hoverRef.current = next;
    setHover(next);
  };

  const applyHover = (index: number | null) => {
    iconRefs.current.forEach((icon, i) => {
      if (!icon) return;
      const on = index === i;
      icon.style.transform = on ? `scale(${1 + MAG})` : "scale(1)";
      const slot = slotRefs.current[i];
      if (slot) slot.style.zIndex = on ? "2" : "0";
    });
    setHoverIndex(index);
  };

  const magnify = (clientX: number | null) => {
    if (clientX == null) {
      applyHover(null);
      return;
    }
    let hovered: number | null = null;
    slotRefs.current.forEach((slot, i) => {
      if (!slot) return;
      const rect = slot.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) hovered = i;
    });
    applyHover(hovered);
  };

  let slot = 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <nav
        aria-label="App"
        className="pointer-events-auto flex items-end gap-1.5 rounded-[26px] border border-white/50 bg-white/70 px-2 pt-2 pb-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-2xl sm:gap-3 sm:px-2.5 dark:border-white/10 dark:bg-black/50 dark:shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)]"
        onMouseMove={(e) => magnify(e.clientX)}
        onMouseLeave={() => magnify(null)}
      >
        <Link
          to="/"
          aria-label="QDECK"
          className="mb-2 grid size-10 origin-bottom place-items-center transition-transform duration-100 ease-out hover:scale-[1.08] sm:size-[52px]"
        >
          <img src="/logo.svg" alt="" className="size-full" />
        </Link>
        <div className="mx-0.5 mb-3 h-8 w-px shrink-0 self-end bg-foreground/15 sm:mx-1 sm:mb-3.5 sm:h-10" />
        {items.map((item) => {
          if (item === "sep") {
            return <div key="sep" className="mx-0.5 mb-3 h-8 w-px shrink-0 self-end bg-foreground/15 sm:mx-1 sm:mb-3.5 sm:h-10" />;
          }
          const i = slot++;
          const active = item.to != null && (item.to === "/" ? pathname === "/" : pathname === item.to);
          const showLabel = hover === i;
          const tile = (
            <>
              <item.icon className="size-[18px] sm:size-5" />
              {item.badge ? (
                <span className="absolute -top-1.5 -right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-1 font-mono text-[9px] leading-none font-semibold text-background tabular-nums ring-2 ring-background">
                  {item.badge}
                </span>
              ) : null}
            </>
          );
          const tileClass =
            "relative grid size-10 origin-bottom place-items-center rounded-[14px] shadow-sm shadow-black/20 transition-transform duration-100 ease-out will-change-transform sm:size-[52px] sm:rounded-[16px]";

          return (
            <div
              key={item.key}
              ref={(el) => {
                slotRefs.current[i] = el;
              }}
              className="relative flex w-10 flex-col items-center sm:w-[52px]"
              onMouseEnter={() => applyHover(i)}
            >
              <span
                className={cn(
                  "pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-10 -translate-x-1/2 rounded-md bg-foreground/92 px-2 py-1 text-[11px] font-medium whitespace-nowrap text-background opacity-0 shadow-md transition-opacity",
                  showLabel && "opacity-100",
                )}
              >
                {item.label}
                {item.kbd ? <kbd className="ml-1.5 font-mono text-[10px] opacity-70">{item.kbd}</kbd> : null}
              </span>
              {item.to ? (
                <Link
                  ref={(el) => {
                    iconRefs.current[i] = el;
                  }}
                  to={item.to}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  activeOptions={{ exact: true }}
                  className={cn(tileClass, item.tone)}
                >
                  {tile}
                </Link>
              ) : (
                <button
                  ref={(el) => {
                    iconRefs.current[i] = el;
                  }}
                  type="button"
                  aria-label={item.label}
                  onClick={item.onClick}
                  className={cn(tileClass, item.tone)}
                >
                  {tile}
                </button>
              )}
              <span className={cn("mt-1 size-1 rounded-full", active ? "bg-foreground/80" : "bg-transparent")} />
            </div>
          );
        })}
      </nav>
    </div>
  );
}
