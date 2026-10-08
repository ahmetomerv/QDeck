import { toast } from "sonner";

export function cleanQuery(query: string): string {
  return query.replace(/\s+/g, " ").trim();
}

export function googleUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(cleanQuery(query))}`;
}

export function openGoogle(query: string): void {
  window.open(googleUrl(query), "_blank", "noopener,noreferrer");
}

export async function copyText(text: string, label = "Copied"): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  } catch {
    toast.error("Clipboard unavailable");
  }
}

export const copyQuery = (q: string) => copyText(cleanQuery(q), "Query copied");
export const copyGoogleUrl = (q: string) => copyText(googleUrl(q), "Google URL copied");
