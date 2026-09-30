import "server-only";
import { NotConfiguredError } from "./config";

/** An error whose message is safe to show to the user. */
export class UserError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

function describe(e: unknown) {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return String(e);
}

/** Map thrown errors to JSON responses without leaking internals or configuration details to the client. */
export function errorResponse(scope: string, e: unknown, fallback: string, status = 500) {
  console.error(`[${scope}]`, describe(e));
  if (e instanceof NotConfiguredError) {
    return Response.json({ error: e.publicMessage, code: "service_unavailable" }, { status: 503 });
  }
  if (e instanceof UserError) return Response.json({ error: e.message }, { status: e.status });
  if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) {
    return Response.json({ error: "The media service took too long to respond. Please try again." }, { status: 504 });
  }
  // Cloudinary rejects with plain objects carrying an HTTP code; 4xx means the media itself was rejected.
  const httpCode = e && typeof e === "object" && "http_code" in e ? Number((e as { http_code: unknown }).http_code) : 0;
  if (httpCode === 401 || httpCode === 403) {
    return Response.json({ error: "Media storage is unavailable right now. Please try again shortly.", code: "service_unavailable" }, { status: 503 });
  }
  if (httpCode >= 400 && httpCode < 500) {
    return Response.json({ error: `Cloudinary rejected the media: ${describe(e)}` }, { status: 422 });
  }
  return Response.json({ error: fallback }, { status });
}

/** Parse a JSON request body into an object; returns an empty object for missing or malformed bodies. */
export async function readBody<T extends object>(req: Request): Promise<Partial<T>> {
  const body = await req.json().catch(() => null);
  return body && typeof body === "object" && !Array.isArray(body) ? (body as Partial<T>) : {};
}

/** Like `readBody`, but keeps only string fields (for simple form-style payloads). */
export async function readStrings(req: Request): Promise<Record<string, string | undefined>> {
  const body = await readBody<Record<string, unknown>>(req);
  return Object.fromEntries(Object.entries(body).filter((e): e is [string, string] => typeof e[1] === "string"));
}
