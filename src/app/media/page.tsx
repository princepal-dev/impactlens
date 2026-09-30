import { Images } from "lucide-react";
import { MediaLibrary } from "@/components/MediaLibrary";
import { HeroStat, PageHero } from "@/components/PageHero";
import { listAssets, listProjects } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function MediaPage({ searchParams }: PageProps<"/media">) {
  const sp = await searchParams;
  const assets = await listAssets();
  const projects = listProjects();
  const indexed = assets.filter((a) => a.status === "indexed").length;
  const videos = assets.filter((a) => a.resourceType === "video").length;
  return (
    <div className="page-in">
      <PageHero
        icon={Images}
        eyebrow="Media Library"
        title="Every field photo, understood."
        subtitle="Originals stay safe in Cloudinary while AI reads each frame — project, place, activity, stage and impact — so nothing gets lost in a folder again."
        aside={
          <div className="grid grid-cols-3 gap-2.5">
            <HeroStat label="Assets" value={assets.length.toLocaleString("en-IN")} />
            <HeroStat label="AI indexed" value={assets.length ? `${Math.round((indexed / assets.length) * 100)}%` : "—"} />
            <HeroStat label={videos ? "Videos" : "Projects"} value={videos || projects.length} />
          </div>
        }
      />
      <MediaLibrary
        initial={assets}
        projects={projects}
        initialProject={typeof sp.project === "string" ? sp.project : undefined}
        autoUpload={sp.upload === "1"}
      />
    </div>
  );
}
