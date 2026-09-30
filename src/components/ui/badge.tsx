import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[4px] border border-line bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10.5px] leading-4 text-muted",
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
        "inline-flex items-center rounded-[4px] px-1.5 py-0.5 font-mono text-[10.5px] leading-4",
        active ? "bg-accent/15 text-accent" : "bg-white/[0.05] text-zinc-400",
        className,
      )}
    >
      {children}
    </span>
  );
}
