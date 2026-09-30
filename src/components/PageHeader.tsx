import { ArrowUpRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";

/** Metric tile for the hero band. The first tile in a row is highlighted in lime. */
export function HeaderStat({
  label,
  value,
  hint,
  href,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  href?: string;
  icon?: LucideIcon;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px] font-medium opacity-80">
          {Icon && <Icon className="size-4" />}
          {label}
        </div>
        {href && (
          <span className="arrow-chip size-8">
            <ArrowUpRight className="size-4" />
          </span>
        )}
      </div>
      <div className="mt-5 text-[30px] font-semibold leading-none tracking-tight tabular-nums">{value}</div>
      {hint && <div className="mt-2 truncate text-[12.5px] opacity-60">{hint}</div>}
    </>
  );
  const className = "hero-stat group block min-w-0 rounded-2xl p-4";
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
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
    <header className={cn("hero-panel no-print mb-6 rounded-2xl p-5 lg:p-6", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 max-w-2xl">
          <h1 className="text-[26px] font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-[14px] leading-relaxed text-white/60">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {stats && <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{stats}</div>}
      {children && <div className="mt-5">{children}</div>}
    </header>
  );
}
