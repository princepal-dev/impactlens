import * as React from "react";
import { cn } from "@/lib/utils";

export function HeaderStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[12px] text-muted">{label}</div>
      <div className="mt-0.5 text-[20px] font-semibold leading-tight tabular-nums">{value}</div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  stats,
  children,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  stats?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("no-print mb-8 border-b border-line pb-6", className)}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-2xl">
          <h1 className="text-[26px] font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{subtitle}</p>}
        </div>
        {(actions || stats) && (
          <div className="flex shrink-0 flex-wrap items-end gap-8">
            {stats && <div className="flex gap-8">{stats}</div>}
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
        )}
      </div>
      {children && <div className="mt-6">{children}</div>}
    </header>
  );
}
