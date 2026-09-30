import { FolderPlus } from "lucide-react";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { ReportsWorkspace } from "@/components/ReportsWorkspace";
import { TopBar } from "@/components/TopBar";
import { listAssets, listProjects, listReports } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [assets, history] = await Promise.all([listAssets(), listReports()]);
  const projects = listProjects();
  return (
    <div className="page-in">
      <TopBar
        eyebrow="Impact Reports"
        title="Turn evidence into impact stories."
        subtitle="Generate a traceable impact evidence report from project media — every claim linked back to its original source asset."
      />
      {projects.length ? (
        <Suspense>
          <ReportsWorkspace projects={projects} assets={Object.fromEntries(assets.map((a) => [a.id, a]))} history={history} />
        </Suspense>
      ) : (
        <EmptyState icon={FolderPlus} title="Create a project first" description="Reports are generated per project from its indexed evidence." action={<NewProjectDialog />} />
      )}
    </div>
  );
}
