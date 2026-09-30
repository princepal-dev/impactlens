import { analyzeMedia } from "@/lib/analyze";
import { errorResponse } from "@/lib/api";
import { requireAI } from "@/lib/config";
import { analysisFrameUrl } from "@/lib/media-url";
import { addActivity, getAsset, getProject, saveAsset } from "@/lib/store";

/** Receives an asset id, runs vision analysis on its Cloudinary frame and indexes the metadata. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { assetId, projectId } = body as { assetId?: string; projectId?: string };

  const asset = assetId ? await getAsset(assetId) : null;
  if (!asset) return Response.json({ error: "Asset not found" }, { status: 404 });

  try {
    requireAI();
  } catch (e) {
    return errorResponse("analyze", e, "AI analysis unavailable");
  }

  await saveAsset({ ...asset, status: "analyzing" });
  try {
    const { metadata, engine } = await analyzeMedia(analysisFrameUrl(asset), {
      filename: asset.originalFilename,
      projectHint: projectId ?? asset.projectId,
      locationHint: asset.location !== "Unknown" ? asset.location : null,
      captureDate: asset.date,
    });
    const project = getProject(metadata.project);
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
    console.error("[analyze]", e);
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
}
