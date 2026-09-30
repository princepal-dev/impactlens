import "server-only";
import { NotConfiguredError } from "./config";

/** Map thrown errors to JSON responses; configuration gaps surface as 503 with an actionable message. */
export function errorResponse(scope: string, e: unknown, fallback: string, status = 500) {
  if (e instanceof NotConfiguredError) {
    return Response.json({ error: e.message, code: "not_configured" }, { status: 503 });
  }
  console.error(`[${scope}]`, e);
  return Response.json({ error: e instanceof Error ? e.message : fallback }, { status });
}
