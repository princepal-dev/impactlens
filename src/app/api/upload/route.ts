import { errorResponse, readBody } from "@/lib/api";
import { importFromUrl, uploadMedia } from "@/lib/cloudinary";
import { requireCloudinary } from "@/lib/config";
import { rateLimit } from "@/lib/rate-limit";
import { addActivity, getProject, saveAsset } from "@/lib/store";
import type { CloudinaryRef, MediaAsset } from "@/lib/types";

export const maxDuration = 180;

const MAX_BYTES = 100 * 1024 * 1024;
const UNSUPPORTED = "Unsupported format. Use JPG, PNG, WEBP, MP4 or MOV.";

/** Identify the real media type from the file signature; browser-reported MIME types are unreliable. */
function sniff(head: Uint8Array): string | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...head.subarray(from, to));
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image/jpeg";
  if (head[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(4, 8) === "ftyp") return ascii(8, 10) === "qt" ? "video/quicktime" : "video/mp4";
  if (["moov", "mdat", "wide", "free"].includes(ascii(4, 8))) return "video/quicktime";
  return null;
}

function pendingAsset(id: string, ref: CloudinaryRef, projectId: string | null, location: string | null): MediaAsset {
  const project = getProject(projectId);
  return {
    ...ref,
    id,
    projectId: project?.id ?? null,
    status: "uploaded",
    analysisEngine: "",
    title: (ref.originalFilename ?? "New field media").slice(0, 90),
    description: "",
    project: project?.name ?? "Unassigned",
    location: location || project?.location || "Unknown",
    category: project?.category ?? "Other",
    activity: "",
    tags: [],
    impactAreas: [],
    objects: [],
    peopleCount: null,
    stage: "implementation",
    confidence: 0,
    date: ref.exifDate ?? new Date().toISOString().slice(0, 10),
    beforeAfterCandidate: false,
  };
}

const clean = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

/** Receives media (multipart `file`) or a URL (JSON `{ url }`), stores it in Cloudinary and returns the pending asset. */
export async function POST(req: Request) {
  const limited = rateLimit(req, "upload", 60);
  if (limited) return limited;

  const id = `up-${crypto.randomUUID().slice(0, 8)}`;
  try {
    requireCloudinary();
    let ref: CloudinaryRef;
    let projectId: string | null;
    let location: string | null;

    if (req.headers.get("content-type")?.includes("application/json")) {
      const body = await readBody<{ url: string; projectId: string; location: string }>(req);
      const url = clean(body.url, 2048);
      let valid = false;
      try {
        valid = !!url && ["http:", "https:"].includes(new URL(url).protocol);
      } catch {}
      if (!valid) return Response.json({ error: "Provide a valid Cloudinary or public media URL." }, { status: 400 });
      projectId = clean(body.projectId, 80);
      location = clean(body.location, 80);
      ref = await importFromUrl(url!);
    } else {
      const form = await req.formData().catch(() => null);
      if (!form) return Response.json({ error: "Upload could not be read. Please try again." }, { status: 400 });
      const file = form.get("file");
      projectId = clean(form.get("projectId"), 80);
      location = clean(form.get("location"), 80);
      if (!(file instanceof File) || file.size === 0) return Response.json({ error: "No file received." }, { status: 400 });
      if (file.size > MAX_BYTES) return Response.json({ error: "File exceeds 100 MB." }, { status: 413 });
      const buffer = Buffer.from(await file.arrayBuffer());
      const mimeType = sniff(buffer.subarray(0, 16));
      if (!mimeType) return Response.json({ error: UNSUPPORTED }, { status: 415 });
      const filename = (file.name || `upload.${mimeType.split("/")[1]}`).replace(/[\\/]/g, "_").slice(0, 200);
      ref = await uploadMedia({ buffer, filename, mimeType });
    }

    const asset = await saveAsset(pendingAsset(id, ref, projectId, location));
    await addActivity({ type: "upload", message: `Uploaded ${asset.title} to Cloudinary`, href: `/media/${id}` });
    return Response.json({ asset });
  } catch (e) {
    return errorResponse("upload", e, "Upload failed. Please try again.");
  }
}
