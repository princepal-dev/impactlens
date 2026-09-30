import { errorResponse } from "@/lib/api";
import { importFromUrl, uploadMedia } from "@/lib/cloudinary";
import { requireCloudinary } from "@/lib/config";
import { addActivity, getProject, saveAsset } from "@/lib/store";
import type { CloudinaryRef, MediaAsset } from "@/lib/types";

const ALLOWED = /^(image\/(jpeg|png|webp)|video\/(mp4|quicktime))$/;
const MAX_BYTES = 100 * 1024 * 1024;

function pendingAsset(id: string, ref: CloudinaryRef, projectId: string | null, location: string | null): MediaAsset {
  const project = getProject(projectId);
  return {
    ...ref,
    id,
    projectId: project?.id ?? null,
    status: "uploaded",
    analysisEngine: "",
    title: ref.originalFilename ?? "New field media",
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

/** Receives media (multipart `file`) or a URL (JSON `{ url }`), stores it in Cloudinary and returns the pending asset. */
export async function POST(req: Request) {
  const id = `up-${crypto.randomUUID().slice(0, 8)}`;
  try {
    requireCloudinary();
    let ref: CloudinaryRef;
    let projectId: string | null = null;
    let location: string | null = null;

    if (req.headers.get("content-type")?.includes("application/json")) {
      const body = await req.json();
      if (!body?.url || !/^https?:\/\//.test(body.url)) {
        return Response.json({ error: "Provide a valid Cloudinary or public media URL." }, { status: 400 });
      }
      projectId = body.projectId || null;
      location = body.location?.trim() || null;
      ref = await importFromUrl(body.url);
    } else {
      const form = await req.formData();
      const file = form.get("file");
      projectId = (form.get("projectId") as string) || null;
      location = ((form.get("location") as string) || "").trim() || null;
      if (!(file instanceof File)) return Response.json({ error: "No file received." }, { status: 400 });
      if (!ALLOWED.test(file.type)) {
        return Response.json({ error: "Unsupported format. Use JPG, PNG, WEBP, MP4 or MOV." }, { status: 415 });
      }
      if (file.size > MAX_BYTES) return Response.json({ error: "File exceeds 100 MB." }, { status: 413 });
      ref = await uploadMedia({ buffer: Buffer.from(await file.arrayBuffer()), filename: file.name, mimeType: file.type });
    }

    const asset = await saveAsset(pendingAsset(id, ref, projectId, location));
    await addActivity({ type: "upload", message: `Uploaded ${ref.originalFilename ?? id} to Cloudinary`, href: `/media/${id}` });
    return Response.json({ asset });
  } catch (e) {
    return errorResponse("upload", e, "Upload failed");
  }
}
