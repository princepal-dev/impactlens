import {
  ArrowRight,
  ArrowUpRight,
  FileText,
  FolderSync,
  Images,
  MapPinned,
  ScanSearch,
  Sparkles,
  SplitSquareHorizontal,
  Tags,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { AskVoiceButton } from "@/components/AskVoice";
import { CategoryIcon, StageBadge } from "@/components/ImpactBadge";
import { MediaThumb } from "@/components/MediaThumb";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { HeaderStat, PageHeader } from "@/components/PageHeader";
import { SampleImporter } from "@/components/SampleImporter";
import { SampleReel } from "@/components/SampleReel";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { listActivity, listAssets, orgStats, projectSummaries } from "@/lib/store";
import type { ActivityItem } from "@/lib/types";
import { cn, fmtDate, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ACTIVITY: Record<ActivityItem["type"], { icon: typeof Sparkles; label: string; pill: string }> = {
  upload: { icon: Upload, label: "Upload", pill: "bg-ink text-ink-foreground" },
  analysis: { icon: Sparkles, label: "AI", pill: "bg-lime text-lime-foreground" },
  comparison: { icon: SplitSquareHorizontal, label: "Compare", pill: "bg-[#cfe2fb] text-[#0f2a4d]" },
  report: { icon: FileText, label: "Report", pill: "bg-[#e3dcfb] text-[#2a1a5e]" },
  tags: { icon: Tags, label: "Tags", pill: "bg-tint/[0.07] text-soft" },
  project: { icon: FolderSync, label: "Project", pill: "bg-tint/[0.07] text-soft" },
};

const STEPS = [
  { n: "01", t: "Upload", d: "Field photos and video, stored in Cloudinary", href: "/media?upload=1", icon: Upload },
  { n: "02", t: "AI understands", d: "Project, location, activity and tags", href: "/media", icon: Sparkles },
  { n: "03", t: "Search & compare", d: "Natural-language evidence search", href: "/search", icon: ScanSearch },
  { n: "04", t: "Report", d: "Traceable impact stories", href: "/reports", icon: FileText },
];

function SectionHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between px-1">
      <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
      {href && (
        <Link href={href} className="group flex items-center gap-2 text-[13px] font-medium text-muted transition-colors hover:text-foreground">
          {linkLabel}
          <span className="arrow-chip size-7">
            <ArrowUpRight className="size-3.5" />
          </span>
        </Link>
      )}
    </div>
  );
}

export default async function OverviewPage() {
  const [stats, activity, projects, assets] = await Promise.all([orgStats(), listActivity(), projectSummaries(), listAssets()]);
  const reportProject = [...projects].sort((a, b) => b.totalAssets - a.totalAssets)[0];
  const recent = [...assets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const reportHref = stats.totalAssets > 0 && reportProject ? `/reports?project=${reportProject.slug}&auto=1` : undefined;

  return (
    <div className="page-in">
      <PageHeader
        title="Overview"
        subtitle="Field evidence across your projects, indexed by AI and ready to search, compare and report."
        actions={
          <>
            <AskVoiceButton variant="glass" />
            {reportHref ? (
              <Button variant="glass" asChild>
                <Link href={reportHref}><FileText /> Generate report</Link>
              </Button>
            ) : (
              <NewProjectDialog variant="glass" />
            )}
            <Button variant="lime" asChild>
              <Link href="/media?upload=1"><Upload /> Upload media</Link>
            </Button>
          </>
        }
        stats={
          <>
            <HeaderStat
              icon={Images}
              label="Media assets"
              value={stats.totalAssets.toLocaleString("en-IN")}
              hint={stats.addedThisWeek ? `+${stats.addedThisWeek} added this week` : "Photos & videos indexed"}
              href="/media"
            />
            <HeaderStat icon={MapPinned} label="Field sites" value={stats.fieldSites} hint="Locations with evidence" href="/search" />
            <HeaderStat icon={FileText} label="Impact reports" value={stats.reports} hint="Generated from evidence" href="/reports" />
            <HeaderStat
              icon={ScanSearch}
              label="AI coverage"
              value={stats.totalAssets ? `${Math.round(stats.aiCoverage * 100)}%` : "—"}
              hint="Assets with AI metadata"
              href="/compare"
            />
          </>
        }
      />

      {stats.totalAssets === 0 && (
        <section className="mb-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <Panel className="flex flex-col justify-between p-6">
              <div>
                <div className="label-mono">Get started</div>
                <h3 className="mt-1.5 text-[16px] font-semibold tracking-tight">Upload your first field media</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
                  Photos and videos are stored in Cloudinary, analyzed by AI and indexed by project, location, stage and impact area.
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="primary" asChild>
                  <Link href="/media?upload=1"><Upload /> Upload media</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/settings#projects">Manage projects <ArrowRight /></Link>
                </Button>
              </div>
            </Panel>
            <SampleImporter compact />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {STEPS.map(({ n, t, d, href, icon: Icon }) => (
              <Link key={n} href={href} className="lift group rounded-2xl border border-line bg-panel p-5 shadow-[var(--panel-shadow)]">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-full bg-tint/[0.05] text-soft transition-colors duration-200 group-hover:bg-lime group-hover:text-lime-foreground">
                    <Icon className="size-[18px]" />
                  </span>
                  <span className="text-[12px] font-semibold tabular-nums text-subtle">{n}</span>
                </div>
                <div className="mt-4 text-[14.5px] font-semibold tracking-tight">{t}</div>
                <div className="mt-1 text-[12.5px] text-muted">{d}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-6">
          <div>
            <SectionHeader title="Sample evidence" href="/samples" linkLabel="Sample library" />
            <SampleReel assets={assets} />
          </div>

          {recent.length > 0 && (
            <div>
              <SectionHeader title="Recent evidence" href="/media" linkLabel="Media library" />
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {recent.map((a) => (
                  <Link
                    key={a.id}
                    href={`/media/${a.id}`}
                    className="lift group relative aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-media"
                  >
                    <MediaThumb asset={a} w={480} h={600} className="absolute inset-0 size-full transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.06]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                    <div className="absolute left-3 right-3 top-3 flex items-start justify-between">
                      <StageBadge stage={a.stage} />
                      <span className="grid size-8 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md transition-all duration-300 group-hover:rotate-45 group-hover:bg-white group-hover:text-[#10120a]">
                        <ArrowUpRight className="size-4" />
                      </span>
                    </div>
                    <div className="absolute inset-x-3 bottom-3 text-white">
                      <div className="line-clamp-2 text-[14px] font-semibold leading-snug">{a.title}</div>
                      <div className="mt-1 truncate text-[12px] text-white/65">{a.location}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div>
              <SectionHeader title="Projects" href="/settings#projects" linkLabel="Manage" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/media?project=${p.slug}`}
                    className="lift group flex flex-col rounded-2xl border border-line bg-panel p-2 shadow-[var(--panel-shadow)]"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-media">
                      {p.cover ? (
                        <MediaThumb asset={p.cover} w={640} h={360} className="size-full transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.05]" />
                      ) : (
                        <div className="grid size-full place-items-center text-[12px] text-subtle">No evidence yet</div>
                      )}
                      <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                        <CategoryIcon category={p.category} className="size-3" /> {p.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 px-2.5 pt-3.5">
                      <div className="min-w-0">
                        <h3 className="truncate text-[15px] font-semibold tracking-tight">{p.name}</h3>
                        <p className="mt-0.5 truncate text-[12.5px] text-muted">{p.region.replace(", India", "")}</p>
                      </div>
                      <span className="arrow-chip size-9 text-muted">
                        <ArrowUpRight className="size-4" />
                      </span>
                    </div>
                    <div className="mx-2.5 mb-1.5 mt-3.5 grid grid-cols-3 divide-x divide-line rounded-xl bg-tint/[0.03] py-2.5 text-center">
                      <ProjectStat label="Assets" value={p.totalAssets} />
                      <ProjectStat label="Sites" value={new Set(assets.filter((a) => a.projectId === p.id).map((a) => a.location)).size} />
                      <ProjectStat label="Updated" value={p.lastUpdated ? fmtDate(p.lastUpdated).replace(/,?\s\d{4}$/, "") : "—"} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {stats.totalAssets > 0 && projects.length === 0 && (
            <Panel className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-[15px] font-semibold tracking-tight">Organize evidence into projects</h3>
                <p className="mt-1 text-[13px] text-muted">Projects unlock before/after comparisons and impact reports.</p>
              </div>
              <NewProjectDialog />
            </Panel>
          )}
        </div>

        <Panel className="h-fit p-2">
          <div className="flex items-center justify-between px-3 pb-2 pt-3">
            <h2 className="text-[17px] font-semibold tracking-tight">Recent activity</h2>
            <span className="rounded-full bg-tint/[0.06] px-2.5 py-0.5 text-[12px] font-medium tabular-nums text-muted">{activity.length}</span>
          </div>
          {activity.length === 0 ? (
            <p className="px-3 pb-4 pt-2 text-[13px] text-muted">Uploads, analyses, comparisons and reports will appear here.</p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {activity.map((a) => {
                const meta = ACTIVITY[a.type] ?? ACTIVITY.analysis;
                const Icon = meta.icon;
                const body = (
                  <>
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-tint/[0.05] text-soft transition-colors duration-200 group-hover:bg-ink group-hover:text-ink-foreground">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 break-words text-[13px] font-medium leading-snug">{a.message}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={cn("rounded-full px-2 py-px text-[10.5px] font-medium", meta.pill)}>{meta.label}</span>
                        <span className="text-[11.5px] text-subtle">{timeAgo(a.at)}</span>
                      </div>
                    </div>
                  </>
                );
                return (
                  <li key={a.id}>
                    {a.href ? (
                      <Link href={a.href} className="group flex gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-tint/[0.04]">
                        {body}
                      </Link>
                    ) : (
                      <div className="group flex gap-3 rounded-xl px-3 py-2.5">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </section>
    </div>
  );
}

function ProjectStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 px-2">
      <div className="truncate text-[14px] font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-[11px] text-subtle">{label}</div>
    </div>
  );
}
