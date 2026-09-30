import "server-only";
import { NotConfiguredError } from "./config";

/** Map thrown errors to JSON responses without leaking configuration details to the client. */
export function errorResponse(scope: string, e: unknown, fallback: string, status = 500) {
  console.error(`[${scope}]`, e instanceof Error ? e.message : e);
  if (e instanceof NotConfiguredError) {
    return Response.json({ error: e.publicMessage, code: "service_unavailable" }, { status: 503 });
  }
  return Response.json({ error: e instanceof Error ? e.message : fallback }, { status });
}
