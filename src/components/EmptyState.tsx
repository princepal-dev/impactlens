import type { LucideIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  illustration,
  tone = "neutral",
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  illustration?: React.ReactNode;
  tone?: "neutral" | "error";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-line bg-panel px-6 py-14 text-center shadow-[var(--panel-shadow)]",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(var(--line-strong)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
      />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-10 size-40 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
      {illustration ? (
        <div className="relative">{illustration}</div>
      ) : (
        <div
          className={cn(
            "relative grid size-14 place-items-center rounded-2xl border shadow-lg",
            tone === "error"
              ? "border-warning/30 bg-warning/10 text-warning shadow-warning/10"
              : "border-accent/30 bg-gradient-to-b from-accent/20 to-accent/5 text-accent shadow-accent/10",
          )}
        >
          <Icon className="size-6" />
        </div>
      )}
      <h3 className="relative mt-5 text-[17px] font-semibold tracking-tight">{title}</h3>
      <p className="relative mt-1.5 max-w-md text-[13.5px] leading-relaxed text-muted">{description}</p>
      {action && <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  );
}
