import { Clock, FileText, FolderKanban, Images, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { HeaderStat, PageHeader } from "@/components/PageHeader";
import { ReportsWorkspace } from "@/components/ReportsWorkspace";
import { Button } from "@/components/ui/button";
import { listAssets, listProjects, listReports } from "@/lib/store";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [assets, history] = await Promise.all([listAssets(), listReports()]);
  const projects = listProjects();
  const indexed = assets.filter((a) => a.status === "indexed").length;
  return (
    <div className="page-in">
      <PageHeader
        title="Impact Reports"
        subtitle="Traceable evidence reports built from project media, with every claim linked to its source asset."
        stats={
          <>
            <HeaderStat icon={FileText} label="Reports" value={history.length} hint="Generated from evidence" />
            <HeaderStat icon={FolderKanban} label="Projects" value={projects.length} hint="Ready to report on" href="/settings#projects" />
            <HeaderStat icon={ShieldCheck} label="Traceable evidence" value={indexed} hint="Indexed assets to cite" href="/media" />
            <HeaderStat icon={Clock} label="Last report" value={history[0] ? timeAgo(history[0].generatedAt) : "—"} hint={history[0]?.project ?? "No reports yet"} />
          </>
        }
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
                <Link href="/samples"><Images /> Load sample evidence</Link>
              </Button>
            </>
          }
        />
      )}
    </div>
  );
}
