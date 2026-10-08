import { formatQueryLines } from "@/lib/format";
import { cn } from "@/lib/utils";

const TOKEN_RE = /(site:[^\s)]+|"[^"]*"|\bOR\b|(?:^|(?<=[\s(]))-(?:"[^"]*"|[^\s)]+)|[()])/g;

function highlight(line: string) {
  return line.split(TOKEN_RE).map((part, i) => {
    if (!part) return null;
    let cls = "text-foreground/85";
    if (part.startsWith("site:")) cls = "text-primary";
    else if (part.startsWith('"')) cls = "text-foreground";
    else if (part === "OR" || part === "(" || part === ")") cls = "text-muted-foreground";
    else if (part.startsWith("-") && part.length > 1) cls = "text-destructive";
    return (
      <span key={i} className={cls}>
        {part}
      </span>
    );
  });
}

export function QueryText({
  query,
  multiline = false,
  className,
  truncate = false,
}: {
  query: string;
  multiline?: boolean;
  className?: string;
  truncate?: boolean;
}) {
  const lines = multiline ? formatQueryLines(query) : [query.replace(/\s+/g, " ").trim()];
  return (
    <code className={cn("block font-mono text-[12px] leading-relaxed", truncate && "truncate", className)}>
      {lines.map((l, i) => (
        <span key={i} className={cn(multiline ? "block" : "", truncate && "whitespace-nowrap")}>
          {highlight(l)}
        </span>
      ))}
    </code>
  );
}
