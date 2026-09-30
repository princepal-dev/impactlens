import * as React from "react";
import { cn } from "@/lib/utils";

export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-line bg-panel shadow-[var(--panel-shadow)] transition-colors duration-200", className)}
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
    <div className={cn("flex items-center justify-between gap-4 px-5 pb-2 pt-5", className)}>
      <div className="min-w-0">
        {eyebrow && <div className="label-mono mb-1">{eyebrow}</div>}
        <h3 className="text-[16px] font-semibold tracking-tight text-foreground">{title}</h3>
      </div>
      {action}
    </div>
  );
}

const field =
  "h-10 w-full rounded-full border border-line-strong bg-surface text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-200 hover:border-tint/30 focus-visible:border-ink focus-visible:ring-4 focus-visible:ring-tint/[0.06]";

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(field, "cursor-pointer appearance-none pl-4 pr-10", className)} {...props}>
        {children}
      </select>
      <svg className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(field, "px-4 placeholder:text-subtle", className)} {...props} />;
}
