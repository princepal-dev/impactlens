import { errorResponse } from "@/lib/api";
import { compareAssets } from "@/lib/compare";
import { getAsset } from "@/lib/store";

/** Receives two asset IDs and returns comparison metadata. */
export async function POST(req: Request) {
  const { beforeId, afterId } = (await req.json().catch(() => ({}))) as { beforeId?: string; afterId?: string };
  if (!beforeId || !afterId) return Response.json({ error: "Select two assets to compare." }, { status: 400 });
  const [before, after] = await Promise.all([getAsset(beforeId), getAsset(afterId)]);
  if (!before || !after) return Response.json({ error: "Asset not found" }, { status: 404 });
  try {
    return Response.json(await compareAssets(before, after));
  } catch (e) {
    return errorResponse("compare", e, "Comparison failed");
  }
}
