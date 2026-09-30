import { errorResponse } from "@/lib/api";
import { listProjects, orgStats } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const s = await orgStats();
    return Response.json(
      { assets: s.totalAssets, reports: s.reports, projects: listProjects().length },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse("stats", e, "Could not load workspace stats.");
  }
}
