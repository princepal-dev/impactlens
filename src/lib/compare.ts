import "server-only";
import { generateJSON, loadImage } from "./ai";
import { aiEngineLabel, aiProvider } from "./config";
import { analysisFrameUrl } from "./media-url";
import type { ComparisonResult, MediaAsset } from "./types";

const STAGE_LABEL: Record<string, string> = {
  baseline: "baseline conditions",
  implementation: "active implementation",
  completed: "completed works",
  monitoring: "post-completion monitoring",
};

const CAVEATS = [
  "Observations are based on uploaded media only; field verification is recommended before external reporting.",
  "Before and after frames may not share an identical camera position or site boundary.",
];

export function metadataCompare(before: MediaAsset, after: MediaAsset): ComparisonResult {
  const newObjects = after.objects.filter((o) => !before.objects.some((b) => b.toLowerCase() === o.toLowerCase()));
  const TRANSIENT = /scaffold|material|excavat|trench|garbage|waste|debris|dump|dry|cracked|bare|mixer|pit/i;
  const goneObjects = before.objects.filter(
    (o) => TRANSIENT.test(o) && !after.objects.some((b) => b.toLowerCase() === o.toLowerCase()),
  );
  const observations: string[] = [];

  if (before.stage !== after.stage) {
    observations.push(
      `Evidence progresses from ${STAGE_LABEL[before.stage]} (${before.date}) to ${STAGE_LABEL[after.stage]} (${after.date}).`,
    );
  }
  if (newObjects.length) observations.push(`Visible in later media: ${newObjects.slice(0, 3).join(", ")}.`);
  if (goneObjects.length && before.stage !== "completed") {
    observations.push(`No longer visible in later media: ${goneObjects.slice(0, 3).join(", ")}.`);
  }
  if (/scaffold|construction|excavation/i.test(before.objects.join(" ") + before.tags.join(" ")) && after.stage !== "implementation") {
    observations.push("Construction activity visible earlier appears to be complete in the later frame.");
  }
  const cat = after.category;
  if (cat === "Water & Sanitation") observations.push("Water infrastructure is visible in the final media, suggesting improved water access at the site.");
  if (cat === "Environment") observations.push("Later media shows vegetation and managed green space where earlier media shows degraded or unmanaged land.");
  if (cat === "Renewable Energy") observations.push("Solar generation equipment is visible in the later media that was not present at baseline.");
  observations.push(`Surrounding context: ${after.description}`);

  const impactAreas = [...new Set([...after.impactAreas, ...before.impactAreas])].slice(0, 4);
  const confidence = Math.round(Math.min(before.confidence, after.confidence) * 0.96 * 100) / 100;

  return {
    beforeId: before.id,
    afterId: after.id,
    summary: `Visual evidence suggests a change from ${STAGE_LABEL[before.stage]} to ${STAGE_LABEL[after.stage]} for ${after.project}. ${after.title} is observed in the later media.`,
    observations: observations.slice(0, 5),
    impactAreas,
    confidence,
    caveats: CAVEATS,
    engine: "Metadata comparison (demo engine)",
  };
}

export async function compareAssets(before: MediaAsset, after: MediaAsset, origin: string): Promise<ComparisonResult> {
  const fb = metadataCompare(before, after);
  const bUrl = analysisFrameUrl(before);
  const aUrl = analysisFrameUrl(after);
  if (aiProvider() === "demo" || !bUrl || !aUrl) {
    await new Promise((r) => setTimeout(r, 700));
    return fb;
  }
  try {
    const [bi, ai] = await Promise.all([loadImage(bUrl, origin), loadImage(aUrl, origin)]);
    const raw = await generateJSON<Partial<ComparisonResult>>({
      system:
        "You compare two field photos from the same sustainability project: image 1 is BEFORE, image 2 is AFTER. Describe only visible changes. Never state numbers, measurements, beneficiaries or percentages that are not visible. Use cautious wording: 'observed', 'visible evidence', 'appears', 'potential impact'. Return JSON only.",
      prompt: `Project: ${after.project} (${after.category}, ${after.location}).
Before metadata: ${before.title} — ${before.date} — stage ${before.stage}.
After metadata: ${after.title} — ${after.date} — stage ${after.stage}.

Return: { "summary": string (1-2 sentences), "observations": string[] (3-5 short observed changes), "impactAreas": string[] (2-4 potential impact areas), "confidence": number (0-1), "caveats": string[] (1-2 verification notes) }`,
      images: [bi, ai],
    });
    return {
      ...fb,
      summary: raw.summary || fb.summary,
      observations: raw.observations?.length ? raw.observations.slice(0, 5) : fb.observations,
      impactAreas: raw.impactAreas?.length ? raw.impactAreas.slice(0, 4) : fb.impactAreas,
      confidence: typeof raw.confidence === "number" ? Math.round(raw.confidence * 100) / 100 : fb.confidence,
      caveats: raw.caveats?.length ? raw.caveats : fb.caveats,
      engine: aiEngineLabel(),
    };
  } catch (e) {
    console.warn("[compare] AI comparison failed, using metadata comparison", e);
    return fb;
  }
}

/** Pick the most informative before/after pair for a project. */
export function pickPair(assets: MediaAsset[], preferred?: [string, string]) {
  if (preferred) {
    const b = assets.find((a) => a.id === preferred[0]);
    const a = assets.find((x) => x.id === preferred[1]);
    if (b && a) return [b, a] as const;
  }
  const images = assets.filter((a) => a.resourceType === "image" || a.storage === "cloudinary");
  const sorted = [...images].sort((x, y) => x.date.localeCompare(y.date));
  const before = sorted.find((a) => a.stage === "baseline" && a.beforeAfterCandidate) ?? sorted[0];
  const after =
    [...sorted].reverse().find((a) => (a.stage === "completed" || a.stage === "monitoring") && a.beforeAfterCandidate) ??
    sorted[sorted.length - 1];
  return before && after && before.id !== after.id ? ([before, after] as const) : null;
}
