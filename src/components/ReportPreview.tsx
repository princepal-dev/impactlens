"use client";

import {
  CalendarRange,
  CheckCircle2,
  ExternalLink,
  Eye,
  Film,
  Images,
  Layers,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Tag,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import type { MediaAsset, ReportContent } from "@/lib/types";
import { cn, fmtDate } from "@/lib/utils";
import { BeforeAfter } from "./BeforeAfter";
import { EvidenceTimeline } from "./EvidenceTimeline";
import { ImpactBadge } from "./ImpactBadge";
import { MediaThumb } from "./MediaThumb";
import { Logo } from "./Logo";

const STAGE_COLORS: Record<string, string> = {
  baseline: "bg-amber-400",
  implementation: "bg-sky-400",
  completed: "bg-emerald-400",
  monitoring: "bg-teal-400",
};

function Section({ n, title, subtitle, children, className }: { n: string; title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("px-6 py-10 md:px-12", className)}>
      <div className="mb-6 flex items-baseline gap-3">
        <span className="w-6 shrink-0 text-[13px] font-medium tabular-nums text-subtle">{n}</span>
        <div>
          <h2 className="text-[19px] font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="text-[12.5px] text-muted">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function StageBar({ stages }: { stages: Record<string, number> }) {
  const entries = Object.entries(stages).filter(([, n]) => n > 0);
  const total = entries.reduce((s, [, n]) => s + n, 0) || 1;
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-tint/[0.06]">
        {entries.map(([s, n]) => (
          <div key={s} className={cn("h-full first:rounded-l-full last:rounded-r-full", STAGE_COLORS[s] ?? "bg-accent")} style={{ width: `${(n / total) * 100}%` }} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-muted">
        {entries.map(([s, n]) => (
          <span key={s} className="flex items-center gap-1.5 capitalize">
            <span className={cn("size-2 rounded-full", STAGE_COLORS[s] ?? "bg-accent")} />
            {s} <span className="tabular-nums text-foreground">{n}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

const INSIGHTS = [
  { key: "observations", title: "Observed changes", icon: Eye, tone: "text-subtle" },
  { key: "patterns", title: "Evidence patterns", icon: Layers, tone: "text-subtle" },
  { key: "potentialImpact", title: "Potential impact", icon: TrendingUp, tone: "text-subtle" },
  { key: "verificationNotes", title: "Needs additional verification", icon: ShieldAlert, tone: "text-warning" },
] as const;

export function ReportPreview({ report, assets }: { report: ReportContent; assets: Record<string, MediaAsset> }) {
  const evidence = report.evidenceIds.map((id) => assets[id]).filter(Boolean);
  const before = report.comparison ? assets[report.comparison.beforeId] : null;
  const after = report.comparison ? assets[report.comparison.afterId] : null;
  const traced = [...new Map([...(before ? [before] : []), ...(after ? [after] : []), ...evidence].map((a) => [a.id, a])).values()];
  const images = traced.filter((a) => a.resourceType === "image");
  const hero = after ?? images[0] ?? traced[0];
  const inset = before ?? images.find((a) => a.id !== hero?.id);
  const maxImpact = Math.max(1, ...report.impactAreas.map((a) => a.evidenceCount));

  const stats: [string, string, typeof Images][] = [
    ["Evidence assets", String(report.overview.assetCount), Images],
    ["Photos", String(report.overview.imageCount), Images],
    ["Videos", String(report.overview.videoCount), Film],
    ["Impact areas", String(report.impactAreas.length), Tag],
  ];

  return (
    <article className="report-doc overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--panel-shadow)]">
      <header className="grid grid-cols-1 gap-10 border-b border-line px-6 pb-10 pt-7 md:px-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center">
        <div>
          <div className="flex items-center justify-between gap-3">
            <Logo />
            <span className="text-[12px] tabular-nums text-subtle">Report #{report.id}</span>
          </div>
          <div className="print-accent mt-12 text-[12px] font-medium uppercase tracking-[0.08em] text-accent">Impact evidence report</div>
          <h1 className="mt-3 text-[34px] font-semibold leading-[1.1] tracking-tight md:text-[42px]">{report.project}</h1>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] text-muted">
            <span className="flex items-center gap-1.5"><CalendarRange className="size-4 text-subtle" />{report.period.label}</span>
            <span className="flex items-center gap-1.5"><MapPin className="size-4 text-subtle" />{report.overview.location}</span>
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-4">
            {stats.map(([label, value]) => (
              <div key={label}>
                <dt className="text-[12px] text-muted">{label}</dt>
                <dd className="mt-0.5 text-[24px] font-semibold leading-tight tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {hero && (
          <div className="relative mx-auto w-full max-w-[480px] pb-8 lg:pb-10">
            <div className="overflow-hidden rounded-xl border border-line">
              <MediaThumb asset={hero} w={960} h={640} className="aspect-[3/2] w-full" />
            </div>
            {after && <span className="absolute right-3 top-3 rounded bg-black/65 px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wider text-white">After</span>}
            {inset && (
              <div className="absolute -bottom-1 -left-4 w-[46%] overflow-hidden rounded-xl border-4 border-surface shadow-lg md:-left-8">
                <MediaThumb asset={inset} w={480} h={320} className="aspect-[3/2] w-full" />
                {before && <span className="absolute left-2 top-2 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">Before</span>}
              </div>
            )}
          </div>
        )}
      </header>

      <dl className="grid grid-cols-2 divide-line border-b border-line bg-tint/[0.02] md:grid-cols-4 md:divide-x">
        {[
          ["Reporting period", report.period.label],
          ["Location", report.overview.location],
          ["Generated", fmtDate(report.generatedAt)],
          ["Narrative engine", report.engine],
        ].map(([k, v]) => (
          <div key={k} className="min-w-0 px-6 py-4 md:px-8">
            <dt className="label-mono">{k}</dt>
            <dd className="mt-1 truncate text-[13.5px]" title={v}>{v}</dd>
          </div>
        ))}
      </dl>

      <Section n="01" title="Executive summary">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <p className="text-[15.5px] leading-[1.8] text-foreground/90">{report.summary}</p>
          <div className="rounded-xl border border-line p-5">
            <div className="label-mono">At a glance</div>
            <dl className="mt-3 space-y-2.5 text-[13px]">
              <div className="flex justify-between gap-3"><dt className="text-muted">Category</dt><dd className="text-right">{report.overview.category}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Coverage</dt><dd className="text-right">{report.overview.coverage}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Timeline points</dt><dd className="tabular-nums">{report.timeline.length}</dd></div>
            </dl>
            <div className="mt-4 border-t border-line pt-4">
              <div className="label-mono mb-2.5">Evidence by stage</div>
              <StageBar stages={report.overview.stages} />
            </div>
          </div>
        </div>
      </Section>

      <Section n="02" title="Evidence timeline" subtitle="How the field record developed across the reporting period" className="border-t border-line">
        <EvidenceTimeline timeline={report.timeline} assets={assets} />
      </Section>

      {before && after && report.comparison && (
        <Section n="03" title="Before & after" subtitle="Drag the handle to compare baseline and later evidence" className="border-t border-line">
          <div className="no-print">
            <BeforeAfter before={before} after={after} mode="slider" />
          </div>
          <div className="print-only">
            <BeforeAfter before={before} after={after} mode="side" />
          </div>
          <ul className="mt-6 grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {report.comparison.observations.map((o) => (
              <li key={o} className="flex gap-2.5 text-[13.5px] leading-relaxed">
                <CheckCircle2 className="print-accent mt-0.5 size-4 shrink-0 text-subtle" />
                {o}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section n={before && after ? "04" : "03"} title="Impact areas" subtitle="Evidence assets tagged with each area — not measured outcomes" className="border-t border-line">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {report.impactAreas.map((a) => (
            <div key={a.name} className="rounded-xl border border-line p-4">
              <ImpactBadge area={a.name} />
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-[26px] font-semibold leading-none tabular-nums">{a.evidenceCount}</span>
                <span className="text-[12px] text-subtle">assets</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-tint/[0.06]">
                <div className="h-full rounded-full bg-accent" style={{ width: `${(a.evidenceCount / maxImpact) * 100}%` }} />
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-muted">{a.note}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section n={before && after ? "05" : "04"} title="Key evidence" className="border-t border-line">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {evidence.map((a) => (
            <Link key={a.id} href={`/media/${a.id}`} className="group block overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-line-strong">
              <div className="relative overflow-hidden">
                <MediaThumb asset={a} w={640} h={400} className="aspect-[16/10] w-full" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/75 to-transparent px-3 pb-2.5 pt-8 text-[11.5px] text-white/85">
                  <span className="flex min-w-0 items-center gap-1"><MapPin className="size-3 shrink-0" /><span className="truncate">{a.location}</span></span>
                  <span className="shrink-0">{fmtDate(a.date)}</span>
                </div>
              </div>
              <div className="p-4">
                <div className="line-clamp-1 text-[14px] font-medium">{a.activity || a.title}</div>
                <p className="mt-1 line-clamp-3 text-[12.5px] leading-relaxed text-muted">{a.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section n={before && after ? "06" : "05"} title="AI-generated insights" subtitle="Derived only from visible evidence in this report" className="border-t border-line">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {INSIGHTS.map(({ key, title, icon: Icon, tone }) => (
            <div key={key} className="rounded-xl border border-line p-5">
              <div className="flex items-center gap-2.5">
                <Icon className={cn("size-4", tone)} />
                <h3 className="text-[14px] font-medium">{title}</h3>
              </div>
              <ul className="mt-4 space-y-2.5">
                {report[key].map((o) => (
                  <li key={o} className="flex gap-2.5 text-[13.5px] leading-relaxed text-foreground/90">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-current opacity-50" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section n={before && after ? "07" : "06"} title="Source traceability" subtitle="Every image resolves to an original, unmodified source asset" className="border-t border-line">
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-left text-[12.5px]">
            <thead className="border-b border-line bg-tint/[0.03] text-[11px] font-medium uppercase tracking-wider text-subtle">
              <tr>
                <th className="px-4 py-2.5 font-medium">Evidence</th>
                <th className="px-4 py-2.5 font-medium max-md:hidden">Cloudinary public ID</th>
                <th className="px-4 py-2.5 text-right font-medium">Original</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {traced.map((a) => (
                <tr key={a.id} className="transition-colors hover:bg-tint/[0.02]">
                  <td className="px-4 py-2.5">
                    <Link href={`/media/${a.id}`} className="flex items-center gap-3 hover:text-accent">
                      <MediaThumb asset={a} w={120} h={80} className="h-10 w-14 shrink-0 rounded-md" />
                      <span className="min-w-0">
                        <span className="line-clamp-1 font-medium">{a.title}</span>
                        <span className="block text-[11.5px] text-subtle">{fmtDate(a.date)}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-muted max-md:hidden">{a.cloudinaryPublicId}</td>
                  <td className="px-4 py-2.5 text-right">
                    <a href={a.secureUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11.5px] font-medium text-accent transition-colors hover:border-accent/50">
                      Open <ExternalLink className="size-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-tint/[0.02] px-6 py-5 text-[12px] text-subtle md:px-12">
        <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-subtle" /> Generated by ImpactLens from uploaded field media</span>
        <span>No impact statistics were inferred beyond visible evidence.</span>
      </footer>
    </article>
  );
}
