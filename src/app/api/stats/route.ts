import { errorResponse } from "@/lib/api";
import { workspaceSummary } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await workspaceSummary(), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return errorResponse("stats", e, "Could not load workspace stats.");
  }
}
