import { FileText, Images } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import { ReportIllustration } from "@/components/Illustrations";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { HeroStat, PageHero } from "@/components/PageHero";
import { ReportsWorkspace } from "@/components/ReportsWorkspace";
import { Button } from "@/components/ui/button";
import { listAssets, listProjects, listReports } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [assets, history] = await Promise.all([listAssets(), listReports()]);
  const projects = listProjects();
  return (
    <div className="page-in">
      <PageHero
        icon={FileText}
        eyebrow="Impact reports"
        title="Donor-ready reports, in one click."
        subtitle="AI turns a project's field evidence into a traceable narrative — timeline, before/after, impact areas — with every claim linked to its source asset."
        aside={
          <div className="grid grid-cols-3 gap-2.5">
            <HeroStat label="Reports" value={history.length} />
            <HeroStat label="Projects" value={projects.length} />
            <HeroStat label="Evidence" value={assets.length} />
          </div>
        }
      />
      {projects.length ? (
        <Suspense>
          <ReportsWorkspace projects={projects} assets={Object.fromEntries(assets.map((a) => [a.id, a]))} history={history} />
        </Suspense>
      ) : (
        <EmptyState
          icon={FileText}
          illustration={<ReportIllustration />}
          title="Create a project to generate reports"
          description="Reports are built per project from its indexed evidence — cover, executive summary, timeline, before/after and full traceability."
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
