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
        title="Media Library"
        subtitle="Original field media stored in Cloudinary, analyzed by AI and indexed by project, location and stage."
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
