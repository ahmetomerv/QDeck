import { useState, type ReactNode } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Select<T extends string>({
  value,
  onChange,
  options,
  className,
  "aria-label": ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={cn("field h-7 cursor-pointer pr-6 text-xs", className)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Chip({
  on,
  onClick,
  children,
  onRemove,
  title,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
  onRemove?: () => void;
  title?: string;
}) {
  return (
    <button type="button" title={title} onClick={onClick} className={cn("chip", on && "chip-on")} aria-pressed={on}>
      <span className={cn("size-1.5 rounded-full", on ? "bg-primary" : "bg-muted-foreground/30")} />
      {children}
      {onRemove && (
        <span
          role="button"
          aria-label="Remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="-mr-1 rounded p-0.5 hover:bg-accent"
        >
          <X className="size-3" />
        </span>
      )}
    </button>
  );
}

export function AddChipInput({ onAdd, placeholder = "Add…" }: { onAdd: (v: string) => void; placeholder?: string | undefined }) {
  const [v, setV] = useState("");
  const submit = () => {
    const t = v.trim();
    if (t) onAdd(t);
    setV("");
  };
  return (
    <div className="inline-flex h-7 items-center rounded-md border border-dashed bg-background pl-2 focus-within:border-ring">
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        className="w-28 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
      />
      <button type="button" onClick={submit} className="px-1.5 text-muted-foreground hover:text-foreground" aria-label="Add">
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

/** Editable list of string chips (used in Settings). */
export function ChipListEditor({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder?: string | undefined }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v) => (
        <span key={v} className="chip chip-on cursor-default">
          {v}
          <button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(values.filter((x) => x !== v))} className="-mr-1 rounded p-0.5 hover:bg-accent">
            <X className="size-3" />
          </button>
        </span>
      ))}
      <AddChipInput placeholder={placeholder} onAdd={(t) => !values.includes(t) && onChange([...values, t])} />
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-md border bg-muted/50 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "h-6 rounded px-2.5 text-xs text-muted-foreground transition-colors",
            value === o.value && "bg-background text-foreground shadow-sm",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b px-6 py-4">
      <div>
        <h1 className="text-[15px] font-semibold tracking-tight">{title}</h1>
        {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}
