import { Images, SplitSquareHorizontal, Upload } from "lucide-react";
import Link from "next/link";
import { CompareWorkspace } from "@/components/CompareWorkspace";
import { EmptyState } from "@/components/EmptyState";
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
      {assets.length >= 2 ? (
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
          title="Add photos to start comparing"
          description="Comparison pairs an earlier and a later photo of the same site. Upload at least two photos, or load the sample collection."
          action={
            <>
              <Button variant="primary" asChild>
                <Link href="/media?upload=1"><Upload /> Upload media</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/settings#samples"><Images /> Load sample photos</Link>
              </Button>
            </>
          }
        />
      )}
    </div>
  );
}
