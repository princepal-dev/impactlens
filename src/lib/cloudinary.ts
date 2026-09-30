import "server-only";
import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from "cloudinary";
import { cloudinaryUploadMode, config, requireCloudinary } from "./config";
import type { CloudinaryRef } from "./types";

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

/** EXIF DateTimeOriginal ("2026:03:08 10:21:00") → "2026-03-08". */
function exifDate(r: Record<string, unknown>): string | undefined {
  const meta = (r.image_metadata ?? r.media_metadata) as Record<string, string> | undefined;
  const raw = meta?.DateTimeOriginal ?? meta?.CreateDate ?? meta?.DateTime;
  const m = raw?.match(/^(\d{4})[:-](\d{2})[:-](\d{2})/);
  if (!m || m[1] === "0000") return undefined;
  return `${m[1]}-${m[2]}-${m[3]}`;
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
    originalFilename: originalFilename ?? (res.original_filename ? `${res.original_filename}.${res.format}` : undefined),
    exifDate: exifDate(r as Record<string, unknown>),
  };
}

async function unsignedUpload(file: Blob | string, filename: string | undefined, folder: string) {
  const form = new FormData();
  if (typeof file === "string") form.append("file", file);
  else form.append("file", file, filename);
  form.append("upload_preset", config.cloudinary.uploadPreset);
  form.append("folder", folder);
  form.append("tags", "impactlens,field-media");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/auto/upload`, {
    method: "POST",
    body: form,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "Cloudinary upload failed");
  return json as UploadApiResponse;
}

export async function uploadMedia(opts: {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  folder?: string;
  publicId?: string;
  tags?: string[];
}): Promise<CloudinaryRef> {
  const mode = requireCloudinary();
  const folder = opts.folder ?? `${config.cloudinary.folder}/uploads`;

  if (mode === "signed") {
    const options: UploadApiOptions = {
      folder,
      resource_type: "auto",
      image_metadata: true,
      context: { source: "impactlens", original_filename: opts.filename },
      tags: ["impactlens", "field-media", ...(opts.tags ?? [])],
      ...(opts.publicId ? { public_id: opts.publicId, overwrite: true } : {}),
    };
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = sdk().uploader.upload_stream(options, (err, res) =>
        err || !res ? reject(err ?? new Error("Empty Cloudinary response")) : resolve(res),
      );
      stream.end(opts.buffer);
    });
    return toRef(result, opts.filename);
  }

  const blob = new Blob([new Uint8Array(opts.buffer)], { type: opts.mimeType });
  return toRef(await unsignedUpload(blob, opts.filename, folder), opts.filename);
}

/** Remove an asset from Cloudinary when it belongs to this account (imports from other clouds are left untouched). */
export async function destroyMedia(ref: Pick<CloudinaryRef, "cloudinaryPublicId" | "secureUrl" | "resourceType">) {
  if (cloudinaryUploadMode() !== "signed") return false;
  if (!ref.secureUrl.includes(`/${config.cloudinary.cloudName}/`)) return false;
  const res = await sdk().uploader.destroy(ref.cloudinaryPublicId, { resource_type: ref.resourceType, invalidate: true });
  return res?.result === "ok";
}

const CLD_URL = /^https:\/\/res\.cloudinary\.com\/([^/]+)\/(image|video)\/upload\/(?:[^/]*,[^/]*\/|[a-z]_[^/]+\/)*(?:v\d+\/)?(.+?)(?:\.([a-z0-9]+))?$/i;

/** Import an existing Cloudinary asset by URL (keeping its original reference), or ingest any public media URL. */
export async function importFromUrl(url: string): Promise<CloudinaryRef> {
  const mode = requireCloudinary();
  const m = url.match(CLD_URL);

  if (m) {
    const [, cloud, type, publicId, format] = m;
    if (mode === "signed" && cloud === config.cloudinary.cloudName) {
      try {
        return toRef(await sdk().api.resource(publicId, { resource_type: type, image_metadata: true }));
      } catch {
        /* fall back to the parsed delivery reference */
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

  const folder = `${config.cloudinary.folder}/imports`;
  if (mode === "signed") {
    return toRef(
      await sdk().uploader.upload(url, { folder, resource_type: "auto", image_metadata: true, tags: ["impactlens", "imported"] }),
      url.split("?")[0].split("/").pop(),
    );
  }
  return toRef(await unsignedUpload(url, undefined, folder), url.split("?")[0].split("/").pop());
}
