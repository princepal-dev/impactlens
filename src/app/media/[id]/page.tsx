import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Cloud,
  Database,
  ExternalLink,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  MapPin,
  Search,
  Sparkles,
  SplitSquareHorizontal,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Spotlight } from "@/components/aceternity/spotlight";
import { AIAnalysisPanel } from "@/components/AIAnalysisPanel";
import { AssetActions } from "@/components/AssetActions";
import { ConfidenceRing } from "@/components/ConfidenceRing";
import { CloudinaryLabel, MediaCard } from "@/components/MediaCard";
import { ManualTagForm } from "@/components/ManualTagForm";
import { MediaThumb } from "@/components/MediaThumb";
import { SourceTrace } from "@/components/SourceTrace";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { displayUrl, thumbUrl } from "@/lib/media-url";
import { cn, fmtDate } from "@/lib/utils";
import { getAsset, getProject, listProjects, projectAssets } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AssetPage({ params }: PageProps<"/media/[id]">) {
  const { id } = await params;
  const asset = await getAsset(id);
  if (!asset) notFound();
  const project = asset.projectId ? getProject(asset.projectId) : null;
  const related = project ? (await projectAssets(project.id)).filter((a) => a.id !== asset.id).slice(0, 3) : [];
  const needsTags = asset.status !== "indexed";
  const projects = listProjects();

  return (
    <div className="page-in">
      <section className="no-print relative mb-6 overflow-hidden rounded-2xl border border-line-strong bg-[#06110f] text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumbUrl(asset, 480, 240)} alt="" aria-hidden className="absolute inset-0 size-full scale-125 object-cover opacity-80 blur-3xl saturate-150" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06110f] via-[#06110f]/80 to-[#06110f]/25" />
        <Spotlight className="-left-10 -top-40 text-teal-300 md:-top-28 md:left-20" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-teal-300/40 to-transparent" />
        <div className="relative z-10 flex flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8 md:py-7">
          <div className="min-w-0">
            <nav className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-white/55">
              <Link href="/media" className="flex shrink-0 items-center gap-1.5 transition-colors hover:text-white"><ArrowLeft className="size-3.5" /> Media Library</Link>
              {project && (<><ChevronRight className="size-3.5 shrink-0 text-white/30" /><Link href={`/media?project=${project.slug}`} className="truncate hover:text-white">{project.name}</Link></>)}
            </nav>
            <h1 className="mt-3 bg-gradient-to-b from-white to-white/70 bg-clip-text text-[26px] font-semibold leading-tight tracking-tight text-transparent md:text-[32px]">
              {asset.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-white/65">
              {asset.project && <span className="flex items-center gap-1.5"><FolderOpen className="size-3.5 text-teal-300/80" />{asset.project}</span>}
              {asset.location && <span className="flex items-center gap-1.5"><MapPin className="size-3.5 text-teal-300/80" />{asset.location}</span>}
              {asset.date && <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5 text-teal-300/80" />{fmtDate(asset.date)}</span>}
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-300/30 bg-teal-300/10 px-2.5 py-0.5 text-[12px] font-medium capitalize text-teal-100">
                <span className="size-1.5 rounded-full bg-teal-300 shadow-[0_0_6px_#5eead4]" /> {asset.stage}
              </span>
              {asset.impactAreas.slice(0, 4).map((a) => (
                <span key={a} className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-[12px] text-white/75">{a}</span>
              ))}
            </div>
          </div>
          {!needsTags && (
            <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
              <ConfidenceRing value={asset.confidence} size={76} tone="light" />
              <div className="max-w-[160px]">
                <div className="text-[13px] font-medium text-white">AI confidence</div>
                <div className="mt-0.5 truncate text-[12px] text-white/50" title={asset.analysisEngine}>{asset.analysisEngine || "Vision analysis"}</div>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(400px,1fr)]">
        <div className="min-w-0 space-y-6">
          <Panel className="overflow-hidden">
            <div className="relative bg-media">
              <MediaThumb asset={asset} full className="max-h-[560px] w-full object-contain" />
              <div className="absolute left-3 top-3"><CloudinaryLabel asset={asset} /></div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
              <span className="min-w-0 truncate font-mono text-[11.5px] text-subtle" title={asset.cloudinaryPublicId}>{asset.cloudinaryPublicId}</span>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="ghost" asChild>
                  <a href={asset.secureUrl} target="_blank" rel="noreferrer"><ExternalLink /> Original</a>
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <a href={displayUrl(asset)} target="_blank" rel="noreferrer"><ExternalLink /> Optimized</a>
                </Button>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader eyebrow="Traceability" title="Source asset & transformations" />
            <div className="p-5">
              <div className="relative mb-6 grid grid-cols-2 gap-y-4 md:grid-cols-4">
                <div aria-hidden className="absolute left-[12.5%] right-[12.5%] top-5 hidden h-px bg-gradient-to-r from-accent via-accent/50 to-accent/20 md:block" />
                {([
                  [Sparkles, "AI insight"],
                  [Database, "Evidence record"],
                  [Cloud, "Cloudinary asset"],
                  [ImageIcon, "Original media"],
                ] as const).map(([Icon, s], i) => (
                  <div key={s} className="relative flex flex-col items-center text-center">
                    <div
                      className={cn(
                        "grid size-10 place-items-center rounded-full border bg-surface",
                        i === 0 ? "border-accent/50 text-accent shadow-[0_0_18px_color-mix(in_srgb,var(--accent)_40%,transparent)]" : "border-line-strong text-muted",
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="mt-2 text-[12.5px] font-medium">{s}</div>
                    <div className="text-[11px] tabular-nums text-subtle">Step {i + 1}</div>
                  </div>
                ))}
              </div>
              <SourceTrace asset={asset} />
            </div>
          </Panel>
        </div>

        <div className="min-w-0 space-y-6">
          <div className="no-print">
            <AssetActions asset={asset} projects={projects} />
          </div>
          <Panel className="p-5">
            {needsTags ? (
              <div>
                <div className="mb-1 text-[15px] font-medium text-warning">Needs tagging</div>
                <p className="mb-5 text-[13px] text-muted">
                  {asset.status === "analyzing"
                    ? "Analysis is still running. Refresh in a moment, or tag the evidence yourself."
                    : "AI analysis did not complete for this asset. Re-analyze it or add the metadata below."}
                </p>
                <ManualTagForm asset={asset} projects={projects} />
              </div>
            ) : (
              <>
                <AIAnalysisPanel asset={asset} />
                {asset.editedAt && (
                  <p className="mt-4 border-t border-line pt-3 text-[12px] text-subtle">
                    Edited by your team · {fmtDate(asset.editedAt)}
                  </p>
                )}
              </>
            )}
          </Panel>

          <div className="no-print grid grid-cols-3 gap-2 [&>*]:min-w-0">
            <Button variant="secondary" asChild><Link href={`/compare?project=${project?.slug ?? ""}&after=${asset.id}`}><SplitSquareHorizontal /> Compare</Link></Button>
            <Button variant="secondary" asChild><Link href={`/search?q=${encodeURIComponent(`${asset.activity} in ${asset.location.split(",").pop()?.trim()}`)}`}><Search /> Similar</Link></Button>
            <Button variant="secondary" asChild><Link href={`/reports?project=${project?.slug ?? ""}`}><FileText /> Report</Link></Button>
          </div>

          {related.length > 0 && (
            <div>
              <div className="label-mono mb-3">More from {project?.name}</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
                {related.map((a) => <MediaCard key={a.id} asset={a} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
