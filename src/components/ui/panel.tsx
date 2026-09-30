import * as React from "react";
import { cn } from "@/lib/utils";

export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-line bg-panel shadow-[var(--panel-shadow)]", className)}
      {...props}
    />
  );
}

export function PanelHeader({
  title,
  eyebrow,
  action,
  className,
}: {
  title: React.ReactNode;
  eyebrow?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 border-b border-line px-5 py-3.5", className)}>
      <div>
        {eyebrow && <div className="label-mono mb-1">{eyebrow}</div>}
        <h3 className="text-[14px] font-medium text-foreground">{title}</h3>
      </div>
      {action}
    </div>
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-10 w-full cursor-pointer appearance-none rounded-md border border-line-strong bg-surface pl-3 pr-9 text-sm text-foreground outline-none transition-colors hover:border-tint/25 focus-visible:border-accent/60",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <svg className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-foreground outline-none placeholder:text-subtle transition-colors focus-visible:border-accent/60",
        className,
      )}
      {...props}
    />
  );
}
