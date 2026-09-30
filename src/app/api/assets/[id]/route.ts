import { errorResponse } from "@/lib/api";
import { destroyMedia } from "@/lib/cloudinary";
import { addActivity, deleteAsset, getAsset, getProject, saveAsset } from "@/lib/store";
import type { MediaAsset, Stage } from "@/lib/types";

const STAGES: Stage[] = ["baseline", "implementation", "completed", "monitoring"];
const slug = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export async function GET(_req: Request, ctx: RouteContext<"/api/assets/[id]">) {
  const asset = await getAsset((await ctx.params).id);
  return asset ? Response.json(asset) : Response.json({ error: "Not found" }, { status: 404 });
}

/** Correct or complete an asset's metadata. Untagged assets become indexed via manual tagging. */
export async function PATCH(req: Request, ctx: RouteContext<"/api/assets/[id]">) {
  const asset = await getAsset((await ctx.params).id);
  if (!asset) return Response.json({ error: "Not found" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const str = (k: string, max = 300) => (typeof body[k] === "string" ? (body[k] as string).trim().slice(0, max) : undefined);
  const list = (k: string) =>
    Array.isArray(body[k])
      ? (body[k] as unknown[]).map((x) => String(x).trim()).filter(Boolean).slice(0, 12)
      : typeof body[k] === "string"
        ? (body[k] as string).split(",").map((x) => x.trim()).filter(Boolean).slice(0, 12)
        : undefined;

  const project = body.projectId !== undefined ? getProject(String(body.projectId)) : undefined;
  const title = str("title", 90);
  const date = str("date", 10);
  const stage = str("stage") as Stage | undefined;
  const tags = list("tags");

  const next: MediaAsset = {
    ...asset,
    ...(title ? { title } : {}),
    ...(str("description", 600) !== undefined ? { description: str("description", 600)! } : {}),
    ...(str("location", 80) ? { location: str("location", 80)! } : {}),
    ...(str("activity", 80) !== undefined ? { activity: str("activity", 80)! } : {}),
    ...(date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? { date } : {}),
    ...(stage && STAGES.includes(stage) ? { stage } : {}),
    ...(tags ? { tags: [...new Set(tags.map(slug))].filter(Boolean) } : {}),
    ...(list("impactAreas") ? { impactAreas: list("impactAreas")! } : {}),
    ...(typeof body.beforeAfterCandidate === "boolean" ? { beforeAfterCandidate: body.beforeAfterCandidate } : {}),
    ...(project !== undefined
      ? { projectId: project?.id ?? null, project: project?.name ?? "Unassigned", category: project?.category ?? asset.category }
      : {}),
  };

  const wasIndexed = asset.status === "indexed";
  const updated = await saveAsset({
    ...next,
    status: "indexed",
    ...(wasIndexed
      ? { editedAt: new Date().toISOString() }
      : { analysisEngine: "Manual tagging", analyzedAt: new Date().toISOString(), confidence: 1 }),
    impactAreas: next.impactAreas.length ? next.impactAreas : [next.category],
  });
  await addActivity({
    type: "tags",
    message: wasIndexed ? `Metadata updated for "${updated.title}"` : `Manually tagged "${updated.title}"`,
    href: `/media/${updated.id}`,
  });
  return Response.json({ asset: updated });
}

/** Delete the evidence record and its Cloudinary original. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/assets/[id]">) {
  const asset = await getAsset((await ctx.params).id);
  if (!asset) return Response.json({ error: "Not found" }, { status: 404 });
  try {
    await destroyMedia(asset).catch((e) => console.warn("[assets] Cloudinary destroy failed", e));
    await deleteAsset(asset.id);
    await addActivity({ type: "upload", message: `Deleted "${asset.title}"`, href: "/media" });
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse("assets", e, "Could not delete asset");
  }
}
