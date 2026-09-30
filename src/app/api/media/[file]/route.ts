import { readLocalUpload } from "@/lib/cloudinary";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp4: "video/mp4",
  mov: "video/quicktime",
};

/** Serves locally stored uploads when running without Cloudinary credentials. */
export async function GET(_req: Request, ctx: RouteContext<"/api/media/[file]">) {
  const { file } = await ctx.params;
  try {
    const buf = await readLocalUpload(file);
    const ext = file.split(".").pop()?.toLowerCase() ?? "";
    return new Response(new Uint8Array(buf), {
      headers: { "Content-Type": TYPES[ext] ?? "application/octet-stream", "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
