import "server-only";
import { generateJSON, loadImage } from "./ai";
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
    engine: "Metadata comparison",
  };
}

export async function compareAssets(before: MediaAsset, after: MediaAsset): Promise<ComparisonResult> {
  const fb = metadataCompare(before, after);
  try {
    const [bi, ai] = await Promise.all([loadImage(analysisFrameUrl(before)), loadImage(analysisFrameUrl(after))]);
    const { data: raw, engine } = await generateJSON<Partial<ComparisonResult>>({
      system:
        "You compare two field photos from the same sustainability project: image 1 is BEFORE, image 2 is AFTER. Describe only visible changes. Never state numbers, measurements, beneficiaries or percentages that are not visible. Use cautious wording: 'observed', 'visible evidence', 'appears', 'potential impact'. Return JSON only.",
      prompt: `Project: ${after.project} (${after.category}, ${after.location}).
Before metadata: ${before.title} — ${before.date} — stage ${before.stage}.
After metadata: ${after.title} — ${after.date} — stage ${after.stage}.

Return: { "summary": string (1-2 sentences), "observations": string[] (3-5 short observed changes), "impactAreas": string[] (2-4 potential impact areas), "confidence": number (0-1), "caveats": string[] (1-2 verification notes) }`,
      images: [bi, ai],
      budgetMs: 100_000,
    });
    const strings = (v: unknown, max: number) =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim().slice(0, 300)).slice(0, max) : [];
    const observations = strings(raw.observations, 5);
    const impactAreas = strings(raw.impactAreas, 4);
    const caveats = strings(raw.caveats, 3);
    const confidence = Number(raw.confidence);
    return {
      ...fb,
      summary: typeof raw.summary === "string" && raw.summary.trim() ? raw.summary.trim().slice(0, 600) : fb.summary,
      observations: observations.length ? observations : fb.observations,
      impactAreas: impactAreas.length ? impactAreas : fb.impactAreas,
      confidence: Number.isFinite(confidence) ? Math.round(Math.max(0, Math.min(1, confidence)) * 100) / 100 : fb.confidence,
      caveats: caveats.length ? caveats : fb.caveats,
      engine,
    };
  } catch (e) {
    console.warn("[compare] AI comparison unavailable, using metadata comparison:", e instanceof Error ? e.message : e);
    return { ...fb, engine: "Metadata comparison (AI vision unavailable)" };
  }
}

/** Pick the most informative before/after pair for a project. */
export function pickPair(assets: MediaAsset[], preferred?: [string, string]) {
  if (preferred) {
    const b = assets.find((a) => a.id === preferred[0]);
    const a = assets.find((x) => x.id === preferred[1]);
    if (b && a) return [b, a] as const;
  }
  const images = assets.filter((a) => a.status === "indexed");
  const sorted = [...images].sort((x, y) => x.date.localeCompare(y.date));
  const before = sorted.find((a) => a.stage === "baseline" && a.beforeAfterCandidate) ?? sorted[0];
  const after =
    [...sorted].reverse().find((a) => (a.stage === "completed" || a.stage === "monitoring") && a.beforeAfterCandidate) ??
    sorted[sorted.length - 1];
  return before && after && before.id !== after.id ? ([before, after] as const) : null;
}
