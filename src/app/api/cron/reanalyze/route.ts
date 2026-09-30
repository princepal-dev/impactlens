import { aiAvailable } from "@/lib/ai";
import { reanalyzePending } from "@/lib/reanalyze";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Scheduled by `vercel.json`: analyzes anything still waiting for AI (uploads made while providers were busy). */
export async function GET(req: Request) {
  // Vercel sends `Authorization: Bearer $CRON_SECRET` with scheduled invocations.
  const secret = process.env.CRON_SECRET;
  const authorized = secret ? req.headers.get("authorization") === `Bearer ${secret}` : !process.env.VERCEL;
  if (!authorized) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!aiAvailable()) return Response.json({ analyzed: 0, skipped: "ai_unavailable" });
  const analyzed = await reanalyzePending({ budgetMs: (maxDuration - 60) * 1000 });
  return Response.json({ analyzed: analyzed ?? 0 });
}
