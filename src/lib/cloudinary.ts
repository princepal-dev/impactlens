import "server-only";
import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from "cloudinary";
import { UserError } from "./api";
import { cloudinaryUploadMode, config, requireCloudinary } from "./config";
import type { CloudinaryRef } from "./types";

const UPLOAD_TIMEOUT_MS = 120_000;

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
    signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.secure_url) throw new Error(json?.error?.message ?? `Cloudinary upload failed (${res.status})`);
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
      timeout: UPLOAD_TIMEOUT_MS,
      context: { source: "impactlens", original_filename: opts.filename.replace(/[|=]/g, "_").slice(0, 200) },
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

const DIRECT_FORMATS = "jpg,jpeg,png,webp,mp4,mov";

/**
 * Parameters for a browser upload straight to Cloudinary. Serverless request bodies are capped
 * (4.5 MB on Vercel), so files never pass through the app server.
 */
export function directUploadParams() {
  const mode = requireCloudinary();
  const url = `https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/auto/upload`;
  const folder = `${config.cloudinary.folder}/uploads`;
  const tags = "impactlens,field-media";
  if (mode === "unsigned") return { url, fields: { upload_preset: config.cloudinary.uploadPreset, folder, tags } };
  const params = { allowed_formats: DIRECT_FORMATS, folder, image_metadata: "true", tags, timestamp: String(Math.round(Date.now() / 1000)) };
  const signature = sdk().utils.api_sign_request(params, config.cloudinary.apiSecret);
  return { url, fields: { ...params, api_key: config.cloudinary.apiKey, signature } };
}

export type DirectUpload = {
  public_id?: unknown;
  resource_type?: unknown;
  secure_url?: unknown;
  format?: unknown;
  width?: unknown;
  height?: unknown;
  bytes?: unknown;
  created_at?: unknown;
};

/** Turn a finished browser upload into a trusted reference, re-reading the asset from Cloudinary when possible. */
export async function refFromDirectUpload(upload: DirectUpload, filename: string | null): Promise<CloudinaryRef> {
  const mode = requireCloudinary();
  const publicId = typeof upload.public_id === "string" ? upload.public_id : "";
  const type = upload.resource_type === "video" ? "video" : upload.resource_type === "image" ? "image" : null;
  if (!publicId || !type) throw new UserError("Upload could not be verified. Please try again.");

  if (mode === "signed") {
    const res = await sdk()
      .api.resource(publicId, { resource_type: type, image_metadata: true })
      .catch(() => null);
    if (!res) throw new UserError("Upload could not be verified. Please try again.");
    return toRef(res, filename ?? undefined);
  }

  const secureUrl = typeof upload.secure_url === "string" ? upload.secure_url : "";
  if (!secureUrl.startsWith(`https://res.cloudinary.com/${config.cloudinary.cloudName}/`)) {
    throw new UserError("Upload could not be verified. Please try again.");
  }
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  return toRef(
    {
      public_id: publicId,
      resource_type: type,
      secure_url: secureUrl,
      format: typeof upload.format === "string" ? upload.format : "",
      width: num(upload.width),
      height: num(upload.height),
      bytes: num(upload.bytes),
      created_at: typeof upload.created_at === "string" ? upload.created_at : undefined,
    },
    filename ?? undefined,
  );
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
      await sdk().uploader.upload(url, {
        folder,
        resource_type: "auto",
        image_metadata: true,
        timeout: UPLOAD_TIMEOUT_MS,
        tags: ["impactlens", "imported"],
      }),
      url.split("?")[0].split("/").pop(),
    );
  }
  return toRef(await unsignedUpload(url, undefined, folder), url.split("?")[0].split("/").pop());
}
