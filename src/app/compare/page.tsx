import { Images, SplitSquareHorizontal } from "lucide-react";
import Link from "next/link";
import { CompareWorkspace } from "@/components/CompareWorkspace";
import { EmptyState } from "@/components/EmptyState";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { PageHeader } from "@/components/PageHeader";
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
      <PageHeader title="Compare" subtitle="Pair baseline and later evidence from the same site to see what changed." />
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
