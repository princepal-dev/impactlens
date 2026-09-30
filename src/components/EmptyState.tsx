import type { LucideIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "neutral",
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  tone?: "neutral" | "error";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-lg border border-dashed border-line-strong px-6 py-14 text-center", className)}>
      <div
        className={cn(
          "grid size-11 place-items-center rounded-md border",
          tone === "error" ? "border-warning/30 bg-warning/10 text-warning" : "border-line-strong bg-white/[0.03] text-muted",
        )}
      >
        <Icon className="size-5" />
      </div>
      <h3 className="mt-4 text-[15px] font-medium">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
