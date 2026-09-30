import * as React from "react";

export function TopBar({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="no-print mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-accent" />
            <span className="eyebrow">{eyebrow}</span>
          </div>
        )}
        <h1 className="text-[34px] font-semibold leading-[1.1] tracking-tight md:text-[40px]">{title}</h1>
        {subtitle && <p className="mt-3 text-[15px] leading-relaxed text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
    </header>
  );
}
