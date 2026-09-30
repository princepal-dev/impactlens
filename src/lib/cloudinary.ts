import "server-only";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { promises as fs } from "fs";
import path from "path";
import { config, cloudinaryUploadMode } from "./config";
import type { CloudinaryRef, ResourceType } from "./types";

const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");

let configured = false;
function sdk() {
  if (!configured) {
    cloudinary.config({
      cloud_name: config.cloudinary.cloudName,
      api_key: config.cloudinary.apiKey,
      api_secret: config.cloudinary.apiSecret,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

function toRef(r: UploadApiResponse | Record<string, unknown>, originalFilename?: string): CloudinaryRef {
  const res = r as UploadApiResponse;
  return {
    cloudinaryPublicId: res.public_id,
    secureUrl: res.secure_url,
    resourceType: res.resource_type === "video" ? "video" : "image",
    format: res.format ?? "",
    width: res.width ?? 0,
    height: res.height ?? 0,
    bytes: res.bytes,
    createdAt: res.created_at ?? new Date().toISOString(),
    storage: "cloudinary",
    originalFilename: originalFilename ?? res.original_filename,
  };
}

export async function uploadMedia(opts: {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  id: string;
}): Promise<CloudinaryRef> {
  const mode = cloudinaryUploadMode();
  const resourceType: ResourceType = opts.mimeType.startsWith("video") ? "video" : "image";
  const folder = `${config.cloudinary.folder}/uploads`;

  if (mode === "signed") {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = sdk().uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
          context: { source: "impactlens", original_filename: opts.filename },
          tags: ["impactlens", "field-media"],
        },
        (err, res) => (err || !res ? reject(err ?? new Error("Empty Cloudinary response")) : resolve(res)),
      );
      stream.end(opts.buffer);
    });
    return toRef(result, opts.filename);
  }

  if (mode === "unsigned") {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(opts.buffer)], { type: opts.mimeType }), opts.filename);
    form.append("upload_preset", config.cloudinary.uploadPreset);
    form.append("folder", folder);
    form.append("tags", "impactlens,field-media");
    const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/auto/upload`, {
      method: "POST",
      body: form,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message ?? "Cloudinary upload failed");
    return toRef(json, opts.filename);
  }

  // Local demo storage — keeps the same reference shape so nothing downstream changes.
  const ext = (opts.filename.split(".").pop() || (resourceType === "video" ? "mp4" : "jpg")).toLowerCase();
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, `${opts.id}.${ext}`), opts.buffer);
  return {
    cloudinaryPublicId: `${config.cloudinary.folder}/uploads/${opts.id}`,
    secureUrl: `/api/media/${opts.id}.${ext}`,
    resourceType,
    format: ext,
    width: 0,
    height: 0,
    bytes: opts.buffer.length,
    createdAt: new Date().toISOString(),
    storage: "local",
    originalFilename: opts.filename,
  };
}

const CLD_URL = /^https:\/\/res\.cloudinary\.com\/([^/]+)\/(image|video)\/upload\/(?:[^/]*,[^/]*\/|[a-z]_[^/]+\/)*(?:v\d+\/)?(.+?)(?:\.([a-z0-9]+))?$/i;

/** Import an existing Cloudinary asset (or any public URL) without losing its original reference. */
export async function importFromUrl(url: string, id: string): Promise<CloudinaryRef> {
  const mode = cloudinaryUploadMode();
  const m = url.match(CLD_URL);

  if (m) {
    const [, , type, publicId, format] = m;
    if (mode === "signed") {
      try {
        const r = await sdk().api.resource(publicId, { resource_type: type });
        return toRef(r);
      } catch {
        /* fall through to parsed reference */
      }
    }
    return {
      cloudinaryPublicId: publicId,
      secureUrl: url,
      resourceType: type === "video" ? "video" : "image",
      format: format ?? "",
      width: 0,
      height: 0,
      createdAt: new Date().toISOString(),
      storage: "cloudinary",
      originalFilename: publicId.split("/").pop(),
    };
  }

  if (mode === "signed") {
    const r = await sdk().uploader.upload(url, {
      folder: `${config.cloudinary.folder}/imports`,
      resource_type: "auto",
      tags: ["impactlens", "imported"],
    });
    return toRef(r);
  }

  const isVideo = /\.(mp4|mov|webm)(\?|$)/i.test(url);
  return {
    cloudinaryPublicId: `${config.cloudinary.folder}/imports/${id}`,
    secureUrl: url,
    resourceType: isVideo ? "video" : "image",
    format: url.split("?")[0].split(".").pop()?.toLowerCase() ?? "",
    width: 0,
    height: 0,
    createdAt: new Date().toISOString(),
    storage: "local",
    originalFilename: url.split("?")[0].split("/").pop(),
  };
}

export async function readLocalUpload(file: string) {
  const safe = path.basename(file);
  return fs.readFile(path.join(UPLOAD_DIR, safe));
}
