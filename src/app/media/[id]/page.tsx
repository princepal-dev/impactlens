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
import { AIAnalysisPanel } from "@/components/AIAnalysisPanel";
import { AssetActions } from "@/components/AssetActions";
import { StageBadge } from "@/components/ImpactBadge";
import { CloudinaryLabel, MediaCard } from "@/components/MediaCard";
import { ManualTagForm } from "@/components/ManualTagForm";
import { MediaThumb } from "@/components/MediaThumb";
import { SourceTrace } from "@/components/SourceTrace";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { displayUrl } from "@/lib/media-url";
import { fmtDate } from "@/lib/utils";
import { getAsset, getProject, listProjects, projectAssets } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AssetPage({ params }: PageProps<"/media/[id]">) {
  const { id } = await params;
  const asset = await getAsset(id);
  if (!asset) notFound();
  const project = asset.projectId ? await getProject(asset.projectId) : null;
  const related = project ? (await projectAssets(project.id)).filter((a) => a.id !== asset.id).slice(0, 3) : [];
  const needsTags = asset.status !== "indexed";
  const projects = await listProjects();

  return (
    <div className="page-in">
      <header className="no-print mb-6 border-b border-line pb-6">
        <nav className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted">
          <Link href="/media" className="flex shrink-0 items-center gap-1.5 transition-colors hover:text-foreground"><ArrowLeft className="size-3.5" /> Media Library</Link>
          {project && (<><ChevronRight className="size-3.5 shrink-0 text-subtle" /><Link href={`/media?project=${project.slug}`} className="truncate hover:text-foreground">{project.name}</Link></>)}
        </nav>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="text-[26px] font-semibold leading-tight tracking-tight">{asset.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted">
              <StageBadge stage={asset.stage} />
              {asset.project && <span className="flex items-center gap-1.5"><FolderOpen className="size-3.5 text-subtle" />{asset.project}</span>}
              {asset.location && <span className="flex items-center gap-1.5"><MapPin className="size-3.5 text-subtle" />{asset.location}</span>}
              {asset.date && <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5 text-subtle" />{fmtDate(asset.date)}</span>}
            </div>
          </div>
          {!needsTags && (
            <div className="shrink-0 text-[13px] text-muted md:text-right">
              AI confidence <span className="ml-1 font-semibold tabular-nums text-foreground">{Math.round(asset.confidence * 100)}%</span>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(400px,1fr)]">
        <div className="min-w-0 space-y-6">
          <Panel className="overflow-hidden">
            <div className="relative bg-media">
              <MediaThumb asset={asset} full priority sizes="(min-width: 1280px) 58vw, 100vw" className="max-h-[560px] w-full object-contain 2xl:max-h-[720px]" />
              <div className="absolute left-3 top-3"><CloudinaryLabel asset={asset} /></div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
              <span className="min-w-0 truncate font-mono text-[11.5px] text-subtle" title={asset.cloudinaryPublicId}>{asset.cloudinaryPublicId}</span>
              <div className="flex shrink-0 gap-2">
                {asset.sourceUrl && (
                  <Button size="sm" variant="ghost" asChild>
                    <a href={asset.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink /> {asset.sourceUrl.includes("mixkit.co") ? "Mixkit" : "Unsplash"}</a>
                  </Button>
                )}
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
              <ol className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-2 text-[13px]">
                {([
                  [Sparkles, "AI insight"],
                  [Database, "Evidence record"],
                  [Cloud, "Cloudinary asset"],
                  [ImageIcon, "Original media"],
                ] as const).map(([Icon, s], i) => (
                  <li key={s} className="flex items-center gap-2">
                    {i > 0 && <ChevronRight className="size-3.5 text-subtle" />}
                    <span className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-soft">
                      <Icon className="size-3.5 text-subtle" /> {s}
                    </span>
                  </li>
                ))}
              </ol>
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
            <Button variant="secondary" asChild><Link href={project ? `/compare?project=${project.slug}&after=${asset.id}` : `/compare?after=${asset.id}`}><SplitSquareHorizontal /> Compare</Link></Button>
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
