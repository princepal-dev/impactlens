import { buildReport } from "@/lib/report";
import { getReport, listReports } from "@/lib/store";

/** Receives a project ID + period and returns structured report content. */
export async function POST(req: Request) {
  const { projectId, from, to } = (await req.json().catch(() => ({}))) as { projectId?: string; from?: string; to?: string };
  if (!projectId) return Response.json({ error: "Select a project." }, { status: 400 });
  try {
    const report = await buildReport({ projectId, from: from || "2026-01-01", to: to || "2026-09-30" });
    return Response.json(report);
  } catch (e) {
    console.error("[report]", e);
    return Response.json({ error: e instanceof Error ? e.message : "Report generation failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (id) {
    const r = await getReport(id);
    return r ? Response.json(r) : Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(await listReports());
}
