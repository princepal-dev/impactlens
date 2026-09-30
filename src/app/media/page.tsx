import { MediaLibrary } from "@/components/MediaLibrary";
import { HeaderStat, PageHeader } from "@/components/PageHeader";
import { listAssets, listProjects } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function MediaPage({ searchParams }: PageProps<"/media">) {
  const sp = await searchParams;
  const assets = await listAssets();
  const projects = listProjects();
  const indexed = assets.filter((a) => a.status === "indexed").length;
  return (
    <div className="page-in">
      <PageHeader
        title="Media Library"
        subtitle="Every photo and video from the field, stored in Cloudinary and indexed by AI."
        stats={
          <>
            <HeaderStat label="Assets" value={assets.length.toLocaleString("en-IN")} />
            <HeaderStat label="Indexed" value={assets.length ? `${Math.round((indexed / assets.length) * 100)}%` : "—"} />
            <HeaderStat label="Projects" value={projects.length} />
          </>
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
