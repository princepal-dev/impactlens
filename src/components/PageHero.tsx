import type { LucideIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { BackgroundBeams } from "./aceternity/background-beams";
import { Spotlight } from "./aceternity/spotlight";

export function HeroStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-[96px] rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur">
      <div className="text-[24px] font-semibold leading-none tabular-nums text-white">{value}</div>
      <div className="mt-1.5 text-[11.5px] text-white/55">{label}</div>
    </div>
  );
}

export function PageHero({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  actions,
  aside,
  children,
  className,
  center,
}: {
  icon?: LucideIcon;
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  center?: boolean;
}) {
  return (
    <section className={cn("no-print relative mb-8 overflow-hidden rounded-2xl border border-line-strong bg-[#06110f] text-white", className)}>
      <Spotlight className={cn("-top-40 text-teal-300", center ? "left-0 md:left-40" : "-left-10 md:-top-24 md:left-24")} />
      <BackgroundBeams className="opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_0%,rgba(45,212,191,0.16),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-teal-300/40 to-transparent" />
      <div className={cn("relative z-10 px-6 py-8 md:px-10 md:py-9", center && "text-center")}>
        <div className={cn("flex flex-col gap-6", !center && "lg:flex-row lg:items-end lg:justify-between")}>
          <div className={cn("max-w-2xl", center && "mx-auto")}>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] font-medium text-teal-200/90 backdrop-blur">
              {Icon ? <Icon className="size-3.5" /> : <span className="size-1.5 rounded-full bg-teal-300 shadow-[0_0_8px_#5eead4]" />}
              {eyebrow}
            </div>
            <h1 className="mt-4 bg-gradient-to-b from-white to-white/65 bg-clip-text text-[30px] font-semibold leading-[1.1] tracking-tight text-transparent md:text-[38px]">
              {title}
            </h1>
            {subtitle && <p className="mt-2.5 text-[14.5px] leading-relaxed text-white/60">{subtitle}</p>}
            {actions && <div className={cn("mt-6 flex flex-wrap items-center gap-2.5", center && "justify-center")}>{actions}</div>}
          </div>
          {aside && <div className="shrink-0">{aside}</div>}
        </div>
        {children && <div className="mt-7">{children}</div>}
      </div>
    </section>
  );
}
