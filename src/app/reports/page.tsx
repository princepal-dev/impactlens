import { Suspense } from "react";
import { ReportsWorkspace } from "@/components/ReportsWorkspace";
import { TopBar } from "@/components/TopBar";
import { listAssets, listProjects, listReports } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [assets, history] = await Promise.all([listAssets(), listReports()]);
  return (
    <div className="page-in">
      <TopBar
        eyebrow="Impact Reports"
        title="Turn evidence into impact stories."
        subtitle="Generate a traceable impact evidence report from project media — every claim linked back to its original source asset."
      />
      <Suspense>
        <ReportsWorkspace projects={listProjects()} assets={Object.fromEntries(assets.map((a) => [a.id, a]))} history={history} />
      </Suspense>
    </div>
  );
}
