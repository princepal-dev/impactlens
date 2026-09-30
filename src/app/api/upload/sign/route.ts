import { errorResponse } from "@/lib/api";
import { directUploadParams } from "@/lib/cloudinary";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Short-lived parameters for uploading a file from the browser straight to Cloudinary. */
export async function POST(req: Request) {
  const limited = rateLimit(req, "upload-sign", 60);
  if (limited) return limited;
  try {
    return Response.json(directUploadParams(), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return errorResponse("upload-sign", e, "Uploads are unavailable right now. Please try again.");
  }
}
