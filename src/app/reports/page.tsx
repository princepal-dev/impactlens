import { FileText, Images } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { ReportsHeader, ReportsWorkspace } from "@/components/ReportsWorkspace";
import { Button } from "@/components/ui/button";
import { listAssets, listProjects, listReports } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [assets, history] = await Promise.all([listAssets(), listReports()]);
  const projects = await listProjects();
  const indexed = assets.filter((a) => a.status === "indexed").length;
  return (
    <div className="page-in">
      {projects.length ? (
        <Suspense fallback={<ReportsHeader history={history} projects={projects.length} indexed={indexed} />}>
          <ReportsWorkspace
            projects={projects}
            assets={Object.fromEntries(assets.map((a) => [a.id, a]))}
            history={history}
            indexed={indexed}
          />
        </Suspense>
      ) : (
        <>
          <ReportsHeader history={history} projects={0} indexed={indexed} />
          <EmptyState
            icon={FileText}
            title="Create a project to generate reports"
            description="Reports are built per project from its indexed evidence: summary, timeline, before/after and full traceability."
            action={
              <>
                <NewProjectDialog />
                <Button variant="ghost" asChild>
                  <Link href="/samples"><Images /> Load sample evidence</Link>
                </Button>
              </>
            }
          />
        </>
      )}
    </div>
  );
}
