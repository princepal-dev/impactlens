import { ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { MediaAsset, ReportContent } from "@/lib/types";
import { fmtDate } from "@/lib/utils";
import { EvidenceTimeline } from "./EvidenceTimeline";
import { ImpactBadge } from "./ImpactBadge";
import { MediaThumb } from "./MediaThumb";
import { Logo } from "./Sidebar";

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line px-8 py-8 md:px-12">
      <div className="mb-5 flex items-baseline gap-3">
        <span className="print-accent font-mono text-[12px] text-accent">{n}</span>
        <span className="text-subtle">—</span>
        <h2 className="text-[18px] font-medium tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((o) => (
        <li key={o} className="flex gap-2.5 text-[13.5px] leading-relaxed text-foreground/90">
          <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
          {o}
        </li>
      ))}
    </ul>
  );
}

export function ReportPreview({ report, assets }: { report: ReportContent; assets: Record<string, MediaAsset> }) {
  const evidence = report.evidenceIds.map((id) => assets[id]).filter(Boolean);
  const before = report.comparison ? assets[report.comparison.beforeId] : null;
  const after = report.comparison ? assets[report.comparison.afterId] : null;
  const traced = [...new Map([...(before ? [before] : []), ...(after ? [after] : []), ...evidence].map((a) => [a.id, a])).values()];

  return (
    <article className="report-doc overflow-hidden rounded-lg border border-line-strong bg-surface">
      <header className="relative overflow-hidden px-8 pb-10 pt-8 md:px-12">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <Logo />
            <span className="font-mono text-[11px] text-subtle">Report #{report.id}</span>
          </div>
          <div className="mt-12 flex items-center gap-3">
            <span className="h-px w-8 bg-accent" />
            <span className="eyebrow print-accent">Impact Evidence Report</span>
          </div>
          <h1 className="mt-4 text-[40px] font-semibold leading-[1.05] tracking-tight md:text-[48px]">{report.project}</h1>
          <p className="mt-2 text-[20px] font-light text-muted">Impact Evidence Report</p>
          <dl className="mt-8 grid grid-cols-2 gap-6 text-[13px] md:grid-cols-4">
            <div><dt className="label-mono">Reporting period</dt><dd className="mt-1">{report.period.label}</dd></div>
            <div><dt className="label-mono">Location</dt><dd className="mt-1">{report.overview.location}</dd></div>
            <div><dt className="label-mono">Generated</dt><dd className="mt-1">{fmtDate(report.generatedAt)}</dd></div>
            <div><dt className="label-mono">Narrative engine</dt><dd className="mt-1 truncate">{report.engine}</dd></div>
          </dl>
        </div>
      </header>

      <Section n="01" title="Executive Summary">
        <p className="max-w-3xl text-[15px] leading-[1.75] text-foreground/90">{report.summary}</p>
      </Section>

      <Section n="02" title="Project Overview">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line md:grid-cols-5">
          {[
            ["Location", report.overview.location],
            ["Project category", report.overview.category],
            ["Reporting period", report.period.label.replace(" — ", " – ")],
            ["Media assets", `${report.overview.assetCount} (${report.overview.imageCount} img · ${report.overview.videoCount} vid)`],
            ["Evidence coverage", report.overview.coverage],
          ].map(([k, v]) => (
            <div key={k} className="bg-surface p-4">
              <div className="label-mono">{k}</div>
              <div className="mt-1.5 text-[13.5px]">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-[12.5px] text-muted">
          {Object.entries(report.overview.stages).map(([s, n]) => (
            <span key={s} className="capitalize">{s}: <span className="font-mono text-foreground">{n}</span></span>
          ))}
        </div>
      </Section>

      <Section n="03" title="Evidence Timeline">
        <EvidenceTimeline timeline={report.timeline} assets={assets} />
      </Section>

      {before && after && report.comparison && (
        <Section n="04" title="Before & After">
          <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            {[before, after].map((a, i) => (
              <Link key={a.id} href={`/media/${a.id}`} className="group block">
                <div className="overflow-hidden rounded-md border border-line transition-colors group-hover:border-accent/60">
                  <MediaThumb asset={a} w={800} h={520} className="aspect-[3/2] w-full" />
                </div>
                <div className="mt-2 flex items-center justify-between text-[12px]">
                  <span className="print-accent font-mono uppercase tracking-wider text-accent">{i === 0 ? "Before" : "After"}</span>
                  <span className="text-subtle">{fmtDate(a.date)}</span>
                </div>
                <div className="text-[13px]">{a.title}</div>
              </Link>
            )).flatMap((el, i) => (i === 0 ? [el, <ArrowRight key="arrow" className="mx-auto size-5 text-accent max-md:rotate-90" />] : [el]))}
          </div>
          <div className="mt-5"><Bullets items={report.comparison.observations} /></div>
        </Section>
      )}

      <Section n="05" title="Impact Areas">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {report.impactAreas.map((a) => (
            <div key={a.name} className="rounded-md border border-line p-4">
              <ImpactBadge area={a.name} />
              <div className="mt-3 text-[26px] font-semibold tabular-nums">{a.evidenceCount}</div>
              <div className="text-[12px] text-muted">{a.note}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-subtle">Counts refer to evidence assets tagged with each area — not to measured outcomes.</p>
      </Section>

      <Section n="06" title="Key Evidence">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {evidence.map((a) => (
            <Link key={a.id} href={`/media/${a.id}`} className="group block overflow-hidden rounded-md border border-line transition-colors hover:border-accent/60">
              <MediaThumb asset={a} w={600} h={380} className="aspect-[16/10] w-full" />
              <div className="p-3.5">
                <div className="flex justify-between text-[11.5px] text-subtle"><span>{fmtDate(a.date)}</span><span>{a.location}</span></div>
                <div className="mt-1 text-[13.5px] font-medium">{a.activity}</div>
                <p className="mt-1 line-clamp-3 text-[12.5px] leading-relaxed text-muted">{a.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section n="07" title="AI-Generated Insights">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div><div className="label-mono mb-3">Observed changes</div><Bullets items={report.observations} /></div>
          <div><div className="label-mono mb-3">Evidence patterns</div><Bullets items={report.patterns} /></div>
          <div><div className="label-mono mb-3">Potential impact</div><Bullets items={report.potentialImpact} /></div>
          <div>
            <div className="label-mono mb-3 !text-warning">Areas requiring additional verification</div>
            <Bullets items={report.verificationNotes} />
          </div>
        </div>
      </Section>

      <Section n="08" title="Source Traceability">
        <p className="mb-4 max-w-2xl text-[13px] text-muted">
          Every image in this report resolves to an original source asset. Select any row to open the original media and its transformation history.
        </p>
        <div className="overflow-hidden rounded-md border border-line">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-tint/[0.03] font-mono text-[10.5px] uppercase tracking-wider text-subtle">
              <tr>
                <th className="px-3 py-2 font-normal">Evidence</th>
                <th className="px-3 py-2 font-normal max-md:hidden">Cloudinary public ID</th>
                <th className="px-3 py-2 font-normal">Original</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {traced.map((a) => (
                <tr key={a.id} className="transition-colors hover:bg-tint/[0.02]">
                  <td className="px-3 py-2">
                    <Link href={`/media/${a.id}`} className="flex items-center gap-3 hover:text-accent">
                      <MediaThumb asset={a} w={120} h={80} className="h-9 w-14 shrink-0 rounded-sm" />
                      <span className="line-clamp-1">{a.title}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-muted max-md:hidden">{a.cloudinaryPublicId}</td>
                  <td className="px-3 py-2">
                    <a href={a.secureUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-[11px] text-accent hover:underline">
                      secure_url <ExternalLink className="size-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-8 py-5 font-mono text-[10.5px] text-subtle md:px-12">
        <span>Generated by ImpactLens · AI-assisted analysis of uploaded field media</span>
        <span>No impact statistics were inferred beyond visible evidence.</span>
      </footer>
    </article>
  );
}
