import { MediaLibrary } from "@/components/MediaLibrary";
import { TopBar } from "@/components/TopBar";
import { listAssets, listProjects } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function MediaPage({ searchParams }: PageProps<"/media">) {
  const sp = await searchParams;
  const assets = await listAssets();
  return (
    <div className="page-in">
      <TopBar
        eyebrow="Media Library"
        title="Turn raw media into structured evidence."
        subtitle="Every upload is stored as an original Cloudinary asset, analyzed by AI and indexed by project, location and timeline."
      />
      <MediaLibrary
        initial={assets}
        projects={listProjects()}
        initialProject={typeof sp.project === "string" ? sp.project : undefined}
        autoUpload={sp.upload === "1"}
      />
    </div>
  );
}
