import { after } from "next/server";
import { aiAvailable } from "@/lib/ai";
import { rateLimit } from "@/lib/rate-limit";
import { pendingAI, queueProgress, reanalyzePending, reanalyzeRunning } from "@/lib/reanalyze";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Leaves headroom before the function limit so the last analysis can finish and be saved. */
const BUDGET_MS = (maxDuration - 60) * 1000;

async function status() {
  return { pending: (await pendingAI()).length, running: reanalyzeRunning(), available: aiAvailable(), progress: queueProgress() };
}

/** How many assets are waiting for real AI analysis, and whether the queue is being processed. */
export async function GET() {
  return Response.json(await status());
}

/** Start processing the waiting assets after the response is sent. */
export async function POST(req: Request) {
  const limited = rateLimit(req, "reanalyze", 6);
  if (limited) return limited;
  if (!reanalyzeRunning()) {
    after(() => reanalyzePending({ budgetMs: BUDGET_MS }).catch((e) => console.warn("[reanalyze]", e instanceof Error ? e.message : e)));
  }
  return Response.json(await status(), { status: 202 });
}
