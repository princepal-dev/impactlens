import {
  ArrowRight,
  ArrowUpRight,
  FileText,
  Images,
  MapPinned,
  Plus,
  ScanSearch,
  Sparkles,
  SplitSquareHorizontal,
  Tags,
  Upload,
  FolderSync,
} from "lucide-react";
import Link from "next/link";
import { CategoryIcon } from "@/components/ImpactBadge";
import { MediaThumb } from "@/components/MediaThumb";
import { MetricCard } from "@/components/MetricCard";
import { TopBar } from "@/components/TopBar";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { SampleImporter } from "@/components/SampleImporter";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { listActivity, orgStats, projectSummaries } from "@/lib/store";
import { fmtDate, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ACTIVITY_ICONS = {
  analysis: Sparkles,
  project: FolderSync,
  comparison: SplitSquareHorizontal,
  report: FileText,
  tags: Tags,
  upload: Upload,
};

export default async function OverviewPage() {
  const [stats, activity, projects] = await Promise.all([orgStats(), listActivity(), projectSummaries()]);
  const reportProject = [...projects].sort((a, b) => b.totalAssets - a.totalAssets)[0];

  return (
    <div className="page-in">
      <TopBar
        eyebrow="Impact Intelligence"
        title="Impact Intelligence"
        subtitle="Turn field media into searchable evidence and measurable impact."
        actions={
          <>
            <NewProjectDialog />
            {stats.totalAssets > 0 && reportProject && (
              <Button variant="secondary" asChild>
                <Link href={`/reports?project=${reportProject.slug}&auto=1`}>
                  <FileText /> Generate Report
                </Link>
              </Button>
            )}
            <Button variant="primary" asChild>
              <Link href="/media?upload=1">
                <Plus /> Upload Media
              </Link>
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Media assets" value={stats.totalAssets.toLocaleString("en-IN")} hint="photos & videos indexed" icon={Images} trend={stats.addedThisWeek ? `+${stats.addedThisWeek} this week` : undefined} />
        <MetricCard label="Field sites" value={String(stats.fieldSites)} hint="locations with evidence" icon={MapPinned} />
        <MetricCard label="Impact reports" value={String(stats.reports)} hint="generated from evidence" icon={FileText} />
        <MetricCard label="AI tagging coverage" value={stats.totalAssets ? `${Math.round(stats.aiCoverage * 100)}%` : "—"} hint="assets with AI metadata" icon={ScanSearch} />
      </section>

      {stats.totalAssets === 0 && (
        <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <Panel className="flex flex-col justify-between p-6">
            <div>
              <div className="label-mono">Get started</div>
              <h3 className="mt-1.5 text-[15px] font-medium">Upload your first field media</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                Photos and videos are stored in Cloudinary, analyzed by AI and indexed by project, location, stage and impact area.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" asChild>
                <Link href="/media?upload=1"><Upload /> Upload media</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/settings">Manage projects <ArrowRight /></Link>
              </Button>
            </div>
          </Panel>
          <SampleImporter compact />
        </section>
      )}

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="label-mono">Projects</div>
              <h2 className="mt-1 text-lg font-medium">Recent projects</h2>
            </div>
            <Link href="/media" className="flex items-center gap-1 text-[13px] text-muted transition-colors hover:text-accent">
              All media <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-3">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/media?project=${p.slug}`}
                className="group flex flex-col overflow-hidden rounded-lg border border-line bg-panel transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  {p.cover ? (
                    <MediaThumb asset={p.cover} w={560} h={350} className="size-full transition-transform duration-500 group-hover:scale-[1.04]" />
                  ) : (
                    <div className="grid size-full place-items-center bg-tint/[0.02] font-mono text-[11px] text-subtle">No evidence yet</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-black/50 px-2 py-1 text-[11px] text-white/90 backdrop-blur">
                      <CategoryIcon category={p.category} className="size-3 text-accent" /> {p.category}
                    </span>
                    <ArrowUpRight className="size-4 text-white/60 transition-colors group-hover:text-accent" />
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-[14.5px] font-medium">{p.name}</h3>
                  <dl className="mt-3 space-y-1.5 text-[12.5px]">
                    <div className="flex justify-between gap-3"><dt className="text-subtle">Location</dt><dd className="truncate text-right text-muted">{p.region.replace(", India", "")}</dd></div>
                    <div className="flex justify-between"><dt className="text-subtle">Assets</dt><dd className="font-mono text-muted">{p.totalAssets}</dd></div>
                    <div className="flex justify-between"><dt className="text-subtle">Updated</dt><dd className="text-muted">{p.lastUpdated ? fmtDate(p.lastUpdated) : "—"}</dd></div>
                    <div className="flex items-center justify-between">
                      <dt className="text-subtle">Status</dt>
                      <dd className="flex items-center gap-1.5 text-positive"><span className="size-1.5 rounded-full bg-positive" />{p.status}</dd>
                    </div>
                  </dl>
                </div>
              </Link>
            ))}
          </div>

          <Panel className="mt-6 overflow-hidden">
            <div className="grid grid-cols-1 divide-y divide-line md:grid-cols-4 md:divide-x md:divide-y-0">
              {[
                { n: "01", t: "Upload", d: "Field photos & video to Cloudinary", href: "/media?upload=1" },
                { n: "02", t: "AI understands", d: "Project, location, activity, tags", href: "/media" },
                { n: "03", t: "Search & compare", d: "Natural-language evidence search", href: "/search" },
                { n: "04", t: "Report", d: "Traceable impact stories", href: "/reports" },
              ].map((s) => (
                <Link key={s.n} href={s.href} className="group p-5 transition-colors hover:bg-tint/[0.02]">
                  <div className="font-mono text-[11px] text-accent">{s.n}</div>
                  <div className="mt-2 flex items-center gap-1.5 text-[14px] font-medium">{s.t}<ArrowRight className="size-3.5 -translate-x-1 text-accent opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" /></div>
                  <div className="mt-1 text-[12.5px] text-muted">{s.d}</div>
                </Link>
              ))}
            </div>
          </Panel>
        </div>

        <Panel className="h-fit">
          <PanelHeader eyebrow="Live" title="Recent activity" />
          {activity.length === 0 && (
            <p className="px-5 py-6 text-[13px] text-muted">Uploads, analyses, comparisons and reports will appear here.</p>
          )}
          <ul className="px-5 py-2 empty:hidden">
            {activity.map((a, i) => {
              const Icon = ACTIVITY_ICONS[a.type] ?? Sparkles;
              return (
                <li key={a.id} className="relative flex gap-3 py-3">
                  {i < activity.length - 1 && <span className="absolute left-[13px] top-10 h-[calc(100%-28px)] w-px bg-line" />}
                  <span className="grid size-[27px] shrink-0 place-items-center rounded-md border border-line bg-tint/[0.03]">
                    <Icon className="size-3.5 text-accent" />
                  </span>
                  <div className="min-w-0 flex-1">
                    {a.href ? (
                      <Link href={a.href} className="text-[13px] leading-snug text-foreground transition-colors hover:text-accent">{a.message}</Link>
                    ) : (
                      <span className="text-[13px] leading-snug">{a.message}</span>
                    )}
                    <div className="mt-0.5 font-mono text-[11px] text-subtle">{timeAgo(a.at)}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </section>
    </div>
  );
}
