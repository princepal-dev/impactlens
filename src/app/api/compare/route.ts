import { errorResponse, readBody } from "@/lib/api";
import { compareAssets } from "@/lib/compare";
import { rateLimit } from "@/lib/rate-limit";
import { getAsset } from "@/lib/store";

export const maxDuration = 120;

/** Receives two asset IDs and returns comparison metadata. */
export async function POST(req: Request) {
  const { beforeId, afterId } = await readBody<{ beforeId: string; afterId: string }>(req);
  if (typeof beforeId !== "string" || typeof afterId !== "string") {
    return Response.json({ error: "Select two assets to compare." }, { status: 400 });
  }
  if (beforeId === afterId) return Response.json({ error: "Select two different assets to compare." }, { status: 400 });
  const limited = rateLimit(req, "compare", 20);
  if (limited) return limited;
  const [before, after] = await Promise.all([getAsset(beforeId), getAsset(afterId)]);
  if (!before || !after) return Response.json({ error: "Asset not found" }, { status: 404 });
  try {
    return Response.json(await compareAssets(before, after));
  } catch (e) {
    return errorResponse("compare", e, "Comparison failed");
  }
}
