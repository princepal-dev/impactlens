import { analyzeMedia } from "@/lib/analyze";
import { analysisFrameUrl } from "@/lib/media-url";
import { addActivity, getAsset, getProject, saveAsset } from "@/lib/store";
import type { AIMetadata } from "@/lib/types";

/** Receives an asset id (or raw media URL) and returns structured AI metadata. */
export async function POST(req: Request) {
  const origin = new URL(req.url).origin;
  const body = await req.json().catch(() => ({}));
  const { assetId, url, projectId, metadata: manual } = body as {
    assetId?: string;
    url?: string;
    projectId?: string;
    metadata?: Partial<AIMetadata>;
  };

  if (!assetId && url) {
    try {
      const { metadata, engine } = await analyzeMedia(url, { captureDate: new Date().toISOString().slice(0, 10), projectHint: projectId }, origin);
      return Response.json({ metadata, engine });
    } catch (e) {
      return Response.json({ error: "AI analysis unavailable", detail: String(e) }, { status: 502 });
    }
  }

  const asset = assetId ? await getAsset(assetId) : null;
  if (!asset) return Response.json({ error: "Asset not found" }, { status: 404 });

  // Manual tagging path — used when AI is unavailable.
  if (manual) {
    const updated = await saveAsset({ ...asset, ...manual, status: "indexed", analysisEngine: "Manual tagging", analyzedAt: new Date().toISOString() });
    return Response.json({ asset: updated });
  }

  try {
    const { metadata, engine } = await analyzeMedia(
      analysisFrameUrl(asset),
      { filename: asset.originalFilename, projectHint: projectId ?? asset.projectId, captureDate: asset.date },
      origin,
    );
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
    const failed = await saveAsset({ ...asset, status: "analysis_failed", analysisEngine: "unavailable" });
    return Response.json(
      { error: "AI analysis unavailable", message: "The asset is still saved and can be manually tagged.", asset: failed },
      { status: 502 },
    );
  }
}
