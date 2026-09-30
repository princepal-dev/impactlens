import { serviceStatus } from "@/lib/config";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Liveness/readiness probe for uptime monitors and deploy checks. */
export async function GET() {
  let database = false;
  try {
    database = !!db().prepare("SELECT 1 AS ok").get();
  } catch (e) {
    console.error("[health] database check failed", e);
  }
  const services = serviceStatus();
  const checks = { database, storage: services.storage.connected, ai: services.ai.connected };
  const status = !database ? "down" : checks.storage && checks.ai ? "ok" : "degraded";
  return Response.json(
    { status, checks, time: new Date().toISOString() },
    { status: database ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
