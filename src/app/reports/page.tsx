import { FileText, Images } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { HeaderStat, PageHeader } from "@/components/PageHeader";
import { ReportsWorkspace } from "@/components/ReportsWorkspace";
import { Button } from "@/components/ui/button";
import { listAssets, listProjects, listReports } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [assets, history] = await Promise.all([listAssets(), listReports()]);
  const projects = listProjects();
  return (
    <div className="page-in">
      <PageHeader
        title="Impact Reports"
        subtitle="Traceable evidence reports built from project media, with every claim linked to its source asset."
        stats={<HeaderStat label="Reports" value={history.length} />}
      />
      {projects.length ? (
        <Suspense>
          <ReportsWorkspace projects={projects} assets={Object.fromEntries(assets.map((a) => [a.id, a]))} history={history} />
        </Suspense>
      ) : (
        <EmptyState
          icon={FileText}
          title="Create a project to generate reports"
          description="Reports are built per project from its indexed evidence: summary, timeline, before/after and full traceability."
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
