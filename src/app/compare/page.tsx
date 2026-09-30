import { Images, SplitSquareHorizontal } from "lucide-react";
import Link from "next/link";
import { CompareWorkspace } from "@/components/CompareWorkspace";
import { EmptyState } from "@/components/EmptyState";
import { CompareIllustration } from "@/components/Illustrations";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { HeroStat, PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { DEFAULT_PAIRS } from "@/lib/samples";
import { listAssets, listProjects } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ComparePage({ searchParams }: PageProps<"/compare">) {
  const sp = await searchParams;
  const projects = listProjects();
  const assets = (await listAssets()).filter((a) => a.status === "indexed");
  return (
    <div className="page-in">
      <PageHero
        icon={SplitSquareHorizontal}
        eyebrow="Before / after"
        title="See what changed on the ground."
        subtitle="Pair baseline and later evidence from the same site. AI describes the visible change, the impact areas it touches and how confident it is."
        aside={
          <div className="grid grid-cols-2 gap-2.5">
            <HeroStat label="Projects" value={projects.length} />
            <HeroStat label="Comparable assets" value={assets.filter((a) => a.projectId).length} />
          </div>
        }
      />
      {projects.length ? (
        <CompareWorkspace
          projects={projects}
          assets={assets}
          defaults={DEFAULT_PAIRS}
          initialProject={typeof sp.project === "string" ? sp.project : undefined}
          initialAfter={typeof sp.after === "string" ? sp.after : undefined}
        />
      ) : (
        <EmptyState
          icon={SplitSquareHorizontal}
          illustration={<CompareIllustration />}
          title="Create a project to start comparing"
          description="Comparisons pair baseline and later evidence within a project. Create one, then upload photos from the same site at different stages."
          action={
            <>
              <NewProjectDialog />
              <Button variant="ghost" asChild>
                <Link href="/settings#samples"><Images /> Load sample evidence</Link>
              </Button>
            </>
          }
        />
      )}
    </div>
  );
}
