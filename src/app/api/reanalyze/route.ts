import { aiAvailable } from "@/lib/ai";
import { rateLimit } from "@/lib/rate-limit";
import { pendingAI, queueProgress, reanalyzePending, reanalyzeRunning } from "@/lib/reanalyze";

export const dynamic = "force-dynamic";

async function status() {
  return { pending: (await pendingAI()).length, running: reanalyzeRunning(), available: aiAvailable(), progress: queueProgress() };
}

/** How many assets are waiting for real AI analysis, and whether the queue is being processed. */
export async function GET() {
  return Response.json(await status());
}

/** Start processing the waiting assets in the background. */
export async function POST(req: Request) {
  const limited = rateLimit(req, "reanalyze", 6);
  if (limited) return limited;
  if (!reanalyzeRunning()) reanalyzePending().catch((e) => console.warn("[reanalyze]", e instanceof Error ? e.message : e));
  return Response.json(await status(), { status: 202 });
}
