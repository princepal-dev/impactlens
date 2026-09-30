import { ArrowLeft, ChevronRight, ExternalLink, FileText, Search, SplitSquareHorizontal } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AIAnalysisPanel } from "@/components/AIAnalysisPanel";
import { AssetActions } from "@/components/AssetActions";
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
  const project = asset.projectId ? getProject(asset.projectId) : null;
  const related = project ? (await projectAssets(project.id)).filter((a) => a.id !== asset.id).slice(0, 3) : [];
  const needsTags = asset.status !== "indexed";
  const projects = listProjects();

  return (
    <div className="page-in">
      <div className="no-print mb-6 flex items-center gap-2 text-[13px] text-muted">
        <Link href="/media" className="flex items-center gap-1.5 transition-colors hover:text-foreground"><ArrowLeft className="size-3.5" /> Media Library</Link>
        {project && (<><ChevronRight className="size-3.5 text-subtle" /><Link href={`/media?project=${project.slug}`} className="hover:text-foreground">{project.name}</Link></>)}
        <ChevronRight className="size-3.5 text-subtle" />
        <span className="truncate text-foreground">{asset.title}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_1fr]">
        <div className="space-y-6">
          <Panel className="overflow-hidden">
            <div className="relative bg-black">
              <MediaThumb asset={asset} full className="max-h-[560px] w-full object-contain" />
              <div className="absolute left-3 top-3"><CloudinaryLabel asset={asset} /></div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
              <span className="truncate font-mono text-[11.5px] text-subtle">{asset.cloudinaryPublicId}</span>
              <div className="flex gap-2">
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
              <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-4">
                {["AI insight", "Evidence record", "Cloudinary asset", "Original media"].map((s, i) => (
                  <div key={s} className="relative rounded-md border border-line bg-white/[0.02] px-3 py-2.5">
                    <div className="font-mono text-[10px] text-accent">0{i + 1}</div>
                    <div className="mt-0.5 text-[12.5px]">{s}</div>
                    {i < 3 && <ChevronRight className="absolute -right-3 top-1/2 z-10 hidden size-4 -translate-y-1/2 text-subtle md:block" />}
                  </div>
                ))}
              </div>
              <SourceTrace asset={asset} />
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
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
                  <p className="mt-4 border-t border-line pt-3 font-mono text-[11px] text-subtle">
                    Edited by your team · {fmtDate(asset.editedAt)}
                  </p>
                )}
              </>
            )}
          </Panel>

          <div className="no-print grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button variant="secondary" asChild><Link href={`/compare?project=${project?.slug ?? ""}&after=${asset.id}`}><SplitSquareHorizontal /> Compare</Link></Button>
            <Button variant="secondary" asChild><Link href={`/search?q=${encodeURIComponent(`${asset.activity} in ${asset.location.split(",").pop()?.trim()}`)}`}><Search /> Similar</Link></Button>
            <Button variant="secondary" asChild><Link href={`/reports?project=${project?.slug ?? ""}`}><FileText /> Report</Link></Button>
          </div>

          {related.length > 0 && (
            <div>
              <div className="label-mono mb-3">More from {project?.name}</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                {related.map((a) => <MediaCard key={a.id} asset={a} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
