import { errorResponse, readBody } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { buildReport } from "@/lib/report";
import { deleteReport, getReport, listReports } from "@/lib/store";

export const maxDuration = 90;

const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

/** Receives a project ID + period and returns structured report content. */
export async function POST(req: Request) {
  const body = await readBody<{ projectId: string; from: string; to: string }>(req);
  if (typeof body.projectId !== "string" || !body.projectId) return Response.json({ error: "Select a project." }, { status: 400 });
  const from = isDate(body.from) ? body.from : "2000-01-01";
  const to = isDate(body.to) ? body.to : new Date().toISOString().slice(0, 10);
  if (from > to) return Response.json({ error: "The reporting period start must be before its end." }, { status: 400 });
  const limited = rateLimit(req, "report", 10);
  if (limited) return limited;
  try {
    const report = await buildReport({ projectId: body.projectId, from, to });
    return Response.json(report);
  } catch (e) {
    return errorResponse("report", e, "Report generation failed");
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

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Missing report id" }, { status: 400 });
  return (await deleteReport(id)) ? Response.json({ ok: true }) : Response.json({ error: "Not found" }, { status: 404 });
}
