import { CompareWorkspace } from "@/components/CompareWorkspace";
import { TopBar } from "@/components/TopBar";
import { DEFAULT_PAIRS } from "@/lib/seed";
import { listAssets, listProjects } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ComparePage({ searchParams }: PageProps<"/compare">) {
  const sp = await searchParams;
  return (
    <div className="page-in">
      <TopBar eyebrow="Compare" title="Before & After Evidence" subtitle="Compare field evidence across project stages." />
      <CompareWorkspace
        projects={listProjects()}
        assets={await listAssets()}
        defaults={DEFAULT_PAIRS}
        initialProject={typeof sp.project === "string" ? sp.project : undefined}
        initialAfter={typeof sp.after === "string" ? sp.after : undefined}
      />
    </div>
  );
}
