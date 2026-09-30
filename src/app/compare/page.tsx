import { FolderPlus } from "lucide-react";
import { CompareWorkspace } from "@/components/CompareWorkspace";
import { EmptyState } from "@/components/EmptyState";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { TopBar } from "@/components/TopBar";
import { DEFAULT_PAIRS } from "@/lib/samples";
import { listAssets, listProjects } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ComparePage({ searchParams }: PageProps<"/compare">) {
  const sp = await searchParams;
  const projects = listProjects();
  return (
    <div className="page-in">
      <TopBar eyebrow="Compare" title="Before & After Evidence" subtitle="Compare field evidence across project stages." />
      {projects.length ? (
        <CompareWorkspace
          projects={projects}
          assets={(await listAssets()).filter((a) => a.status === "indexed")}
          defaults={DEFAULT_PAIRS}
          initialProject={typeof sp.project === "string" ? sp.project : undefined}
          initialAfter={typeof sp.after === "string" ? sp.after : undefined}
        />
      ) : (
        <EmptyState icon={FolderPlus} title="Create a project first" description="Comparisons pair baseline and later evidence within a project." action={<NewProjectDialog />} />
      )}
    </div>
  );
}
