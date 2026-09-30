import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-line bg-tint/[0.03] px-2 py-0.5 text-[11px] font-medium leading-4 text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function Tag({ children, active, className }: { children: React.ReactNode; active?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] leading-4 transition-colors",
        active ? "bg-lime text-lime-foreground" : "bg-tint/[0.05] text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
