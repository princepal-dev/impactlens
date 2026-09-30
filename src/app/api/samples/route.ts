import { readFile } from "fs/promises";
import path from "path";
import { analyzeMedia } from "@/lib/analyze";
import { errorResponse, readBody } from "@/lib/api";
import { uploadMedia } from "@/lib/cloudinary";
import { config, requireAI, requireCloudinary } from "@/lib/config";
import { analysisFrameUrl } from "@/lib/media-url";
import { rateLimit, withLock } from "@/lib/rate-limit";
import { SAMPLES } from "@/lib/samples";
import { addActivity, getAsset, getProject, saveAsset } from "@/lib/store";
import type { MediaAsset } from "@/lib/types";

export const maxDuration = 180;

/** Which bundled sample photos have already been imported into this workspace. */
export async function GET() {
  const status = await Promise.all(
    SAMPLES.map(async (s) => {
      const a = await getAsset(s.file);
      return { file: s.file, projectId: s.projectId, status: a?.status ?? null };
    }),
  );
  return Response.json(status);
}

/** Import one sample: upload the original to Cloudinary, then run real AI analysis on the derived frame. */
export async function POST(req: Request) {
  const { file } = await readBody<{ file: string }>(req);
  const sample = SAMPLES.find((s) => s.file === file);
  if (!sample) return Response.json({ error: "Unknown sample" }, { status: 404 });

  const limited = rateLimit(req, "samples", 90);
  if (limited) return limited;

  try {
    requireCloudinary();
    requireAI();
  } catch (e) {
    return errorResponse("samples", e, "Not configured");
  }

  const result = await withLock(`asset:${sample.file}`, () => importSample(sample));
  return result ?? Response.json({ error: "This sample is already being imported." }, { status: 409 });
}

async function importSample(sample: (typeof SAMPLES)[number]) {
  const existing = await getAsset(sample.file);
  if (existing?.status === "indexed") return Response.json({ asset: existing, skipped: true });

  const project = getProject(sample.projectId);
  const projectSlug = project?.slug ?? "samples";
  try {
    const ref =
      existing ??
      (await uploadMedia({
        buffer: await readFile(path.join(process.cwd(), "public", "samples", `${sample.file}.jpg`)),
        filename: `${sample.file}.jpg`,
        mimeType: "image/jpeg",
        folder: `${config.cloudinary.folder}/samples/${projectSlug}`,
        publicId: sample.file,
        tags: ["impactlens-sample", projectSlug],
      }));

    const pending: MediaAsset = {
      ...ref,
      id: sample.file,
      projectId: project?.id ?? null,
      status: "analyzing",
      analysisEngine: "",
      title: `${sample.file}.jpg`,
      description: "",
      project: project?.name ?? "Unassigned",
      location: sample.location,
      category: project?.category ?? "Other",
      activity: "",
      tags: [],
      impactAreas: [],
      objects: [],
      peopleCount: null,
      stage: "implementation",
      confidence: 0,
      date: sample.date,
      beforeAfterCandidate: false,
    };
    await saveAsset(pending);

    try {
      const { metadata, engine } = await analyzeMedia(analysisFrameUrl(pending), {
        filename: pending.originalFilename,
        projectHint: pending.projectId,
        locationHint: sample.location,
        captureDate: sample.date,
      });
      const asset = await saveAsset({
        ...pending,
        ...metadata,
        projectId: pending.projectId,
        status: "indexed",
        analysisEngine: engine,
        analyzedAt: new Date().toISOString(),
      });
      return Response.json({ asset });
    } catch (e) {
      await saveAsset({ ...pending, status: "analysis_failed" });
      throw e;
    }
  } catch (e) {
    return errorResponse("samples", e, "Sample import failed", 502);
  }
}

/** Record a single activity entry once a batch import finishes. */
export async function PATCH(req: Request) {
  const { imported } = await readBody<{ imported: number }>(req);
  if (typeof imported === "number" && imported > 0 && imported <= SAMPLES.length) {
    await addActivity({ type: "analysis", message: `Imported and AI-analyzed ${imported} sample field photos`, href: "/media" });
  }
  return Response.json({ ok: true });
}
