import { analyzeMedia } from "@/lib/analyze";
import { errorResponse, readBody } from "@/lib/api";
import { requireAI } from "@/lib/config";
import { analysisFrameUrls } from "@/lib/media-url";
import { rateLimit, withLock } from "@/lib/rate-limit";
import { addActivity, getAsset, getProject, saveAsset } from "@/lib/store";

export const maxDuration = 180;

/** Receives an asset id, runs vision analysis on its Cloudinary frame and indexes the metadata. */
export async function POST(req: Request) {
  const { assetId, projectId } = await readBody<{ assetId: string; projectId: string }>(req);
  const asset = typeof assetId === "string" ? await getAsset(assetId) : null;
  if (!asset) return Response.json({ error: "Asset not found" }, { status: 404 });

  const limited = rateLimit(req, "analyze", 30);
  if (limited) return limited;

  try {
    requireAI();
  } catch (e) {
    return errorResponse("analyze", e, "AI analysis unavailable");
  }

  const result = await withLock(`asset:${asset.id}`, async () => {
    await saveAsset({ ...asset, status: "analyzing" });
    try {
      const { metadata, engine } = await analyzeMedia(analysisFrameUrls(asset), {
        filename: asset.originalFilename,
        projectHint: typeof projectId === "string" ? projectId : asset.projectId,
        locationHint: asset.location !== "Unknown" ? asset.location : null,
        captureDate: asset.date,
      });
      if (!(await getAsset(asset.id))) return Response.json({ error: "Asset was deleted during analysis." }, { status: 410 });
      const project = await getProject(metadata.project);
      const updated = await saveAsset({
        ...asset,
        ...metadata,
        projectId: project?.id ?? asset.projectId,
        status: "indexed",
        analysisEngine: engine,
        analyzedAt: new Date().toISOString(),
        editedAt: undefined,
      });
      await addActivity({ type: "analysis", message: `AI analyzed "${updated.title}"`, href: `/media/${updated.id}` });
      return Response.json({ asset: updated, metadata, engine });
    } catch (e) {
      console.error("[analyze]", e instanceof Error ? e.message : e);
      if (!(await getAsset(asset.id))) return Response.json({ error: "Asset was deleted during analysis." }, { status: 410 });
      const failed = await saveAsset(asset.status === "indexed" ? asset : { ...asset, status: "analysis_failed", analysisEngine: "" });
      return Response.json(
        {
          error: "AI analysis could not be completed.",
          message: "The asset is saved. Retry analysis or tag it manually.",
          asset: failed,
        },
        { status: 502 },
      );
    }
  });

  return result ?? Response.json({ error: "This asset is already being analyzed." }, { status: 409 });
}
