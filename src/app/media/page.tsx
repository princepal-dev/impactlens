import { FolderKanban, Images, MapPinned, Sparkles } from "lucide-react";
import { AIQueue } from "@/components/AIQueue";
import { MediaLibrary } from "@/components/MediaLibrary";
import { HeaderStat, PageHeader } from "@/components/PageHeader";
import { isMediaView } from "@/lib/media-views";
import { FIELD_LOG_ENGINE } from "@/lib/samples";
import { listAssets, listProjects } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function MediaPage({ searchParams }: PageProps<"/media">) {
  const sp = await searchParams;
  const assets = await listAssets();
  const projects = await listProjects();
  const indexed = assets.filter((a) => a.status === "indexed" && a.analysisEngine !== FIELD_LOG_ENGINE).length;
  const photos = assets.filter((a) => a.resourceType === "image").length;
  const sites = new Set(assets.filter((a) => a.location && a.location !== "Unknown").map((a) => a.location.toLowerCase())).size;
  return (
    <div className="page-in">
      <PageHeader
        title="Media Library"
        subtitle="Every photo and video from the field, stored in Cloudinary and indexed by AI."
        stats={
          <>
            <HeaderStat icon={Images} label="Assets" value={assets.length.toLocaleString("en-IN")} hint={`${photos} photos · ${assets.length - photos} videos`} />
            <HeaderStat icon={Sparkles} label="AI indexed" value={assets.length ? `${Math.round((indexed / assets.length) * 100)}%` : "—"} hint={`${indexed} of ${assets.length} assets`} />
            <HeaderStat icon={MapPinned} label="Field sites" value={sites} hint="Distinct locations" href="/search" />
            <HeaderStat icon={FolderKanban} label="Projects" value={projects.length} hint="Programmes with evidence" href="/settings#projects" />
          </>
        }
      />
      <AIQueue />
      <MediaLibrary
        initial={assets}
        projects={projects}
        initialProject={typeof sp.project === "string" ? sp.project : undefined}
        initialView={isMediaView(sp.view) ? sp.view : undefined}
        autoUpload={sp.upload === "1"}
      />
    </div>
  );
}
