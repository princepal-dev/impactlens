import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Lime progress bar; without a value it shows an indeterminate sweep. */
export function ProgressBar({ value, className, label }: { value?: number; className?: string; label?: string }) {
  const pct = value === undefined ? undefined : Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct === undefined ? undefined : Math.round(pct)}
      className={cn("relative h-1.5 overflow-hidden rounded-full bg-tint/[0.07]", className)}
    >
      {pct === undefined ? (
        <div className="progress-sweep absolute inset-y-0 w-1/3 rounded-full bg-lime" />
      ) : (
        <div className="h-full rounded-full bg-lime transition-[width] duration-500 ease-[var(--ease-out-soft)]" style={{ width: `${pct}%` }} />
      )}
    </div>
  );
}

/** Small thumbnail that shows a scanning overlay while it is being processed. */
export function ScanThumb({
  src,
  alt = "",
  state = "active",
  className,
}: {
  src: string;
  alt?: string;
  state?: "active" | "done" | "error" | "idle";
  className?: string;
}) {
  return (
    <span className={cn("relative block shrink-0 overflow-hidden rounded-lg bg-media", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny pre-sized preview */}
      <img src={src} alt={alt} loading="lazy" decoding="async" className="size-full object-cover" />
      {state === "active" && (
        <span className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="scan-line absolute inset-x-0 h-1/2 bg-gradient-to-b from-transparent via-lime/45 to-transparent" />
          <span className="absolute inset-0 rounded-lg ring-2 ring-inset ring-lime/70" />
        </span>
      )}
      {state === "done" && (
        <span className="absolute bottom-1 right-1 grid size-4 place-items-center rounded-full bg-lime text-lime-foreground">
          <Check className="size-2.5" strokeWidth={3.5} />
        </span>
      )}
      {state === "error" && (
        <span className="absolute bottom-1 right-1 grid size-4 place-items-center rounded-full bg-danger text-white">
          <X className="size-2.5" strokeWidth={3.5} />
        </span>
      )}
    </span>
  );
}

/** "about 2 min left" style estimate from items processed so far. */
export function eta(startedAt: number, processed: number, remaining: number) {
  if (!processed || !remaining) return null;
  const ms = ((Date.now() - startedAt) / processed) * remaining;
  const s = Math.round(ms / 1000);
  if (s < 60) return `about ${Math.max(5, Math.round(s / 5) * 5)}s left`;
  return `about ${Math.round(s / 60)} min left`;
}
