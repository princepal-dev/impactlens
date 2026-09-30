import { analyzeMedia } from "@/lib/analyze";
import { errorResponse } from "@/lib/api";
import { requireAI } from "@/lib/config";
import { analysisFrameUrl } from "@/lib/media-url";
import { addActivity, getAsset, getProject, saveAsset } from "@/lib/store";
import type { AIMetadata } from "@/lib/types";

/** Receives an asset id and returns structured AI metadata (or saves manual tags). */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { assetId, projectId, metadata: manual } = body as {
    assetId?: string;
    projectId?: string;
    metadata?: Partial<AIMetadata>;
  };

  const asset = assetId ? await getAsset(assetId) : null;
  if (!asset) return Response.json({ error: "Asset not found" }, { status: 404 });

  if (manual) {
    const project = getProject(manual.project);
    const updated = await saveAsset({
      ...asset,
      ...manual,
      projectId: project?.id ?? asset.projectId,
      status: "indexed",
      analysisEngine: "Manual tagging",
      analyzedAt: new Date().toISOString(),
    });
    await addActivity({ type: "tags", message: `Manually tagged "${updated.title}"`, href: `/media/${updated.id}` });
    return Response.json({ asset: updated });
  }

  try {
    requireAI();
  } catch (e) {
    return errorResponse("analyze", e, "AI not configured");
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
    });
    await addActivity({ type: "analysis", message: `AI analyzed "${updated.title}"`, href: `/media/${updated.id}` });
    return Response.json({ asset: updated, metadata, engine });
  } catch (e) {
    console.error("[analyze]", e);
    const failed = await saveAsset({ ...asset, status: "analysis_failed", analysisEngine: "" });
    return Response.json(
      {
        error: e instanceof Error ? `AI analysis failed: ${e.message}` : "AI analysis failed",
        message: "The asset is saved in Cloudinary. Retry analysis or tag it manually.",
        asset: failed,
      },
      { status: 502 },
    );
  }
}
