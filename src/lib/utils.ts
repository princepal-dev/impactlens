import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const pct = (n: number) => `${Math.round(n * 100)}%`;

export const fmtDate = (d: string) =>
  d
    ? new Date(d.length === 10 ? `${d}T00:00:00Z` : d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export const STAGE_STYLES: Record<string, string> = {
  baseline: "text-amber-300/90 border-amber-300/20 bg-amber-300/5",
  implementation: "text-sky-300/90 border-sky-300/20 bg-sky-300/5",
  completed: "text-emerald-300/90 border-emerald-300/20 bg-emerald-300/5",
  monitoring: "text-teal-300/90 border-teal-300/20 bg-teal-300/5",
};
