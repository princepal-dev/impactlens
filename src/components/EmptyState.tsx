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
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-panel/50 px-6 py-14 text-center", className)}>
      {illustration ?? (
        <div className={cn("grid size-12 place-items-center rounded-full", tone === "error" ? "bg-warning/10 text-warning" : "bg-lime text-lime-foreground")}>
          <Icon className="size-[18px]" />
        </div>
      )}
      <h3 className="mt-4 text-[16px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 max-w-md text-[13px] leading-relaxed text-muted">{description}</p>
      {action && <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  );
}
