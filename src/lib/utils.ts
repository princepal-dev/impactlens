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
  baseline: "bg-ink text-ink-foreground",
  implementation: "bg-[#cfe2fb] text-[#0f2a4d]",
  completed: "bg-lime text-lime-foreground",
  monitoring: "bg-[#e3dcfb] text-[#2a1a5e]",
};
