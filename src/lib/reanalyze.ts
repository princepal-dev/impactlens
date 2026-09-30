import "server-only";
import { aiAvailable } from "./ai";
import { analyzeMedia } from "./analyze";
import { NotConfiguredError } from "./config";
import { analysisFrameUrl } from "./media-url";
import { isLocked, withLock } from "./rate-limit";
import { FIELD_LOG_ENGINE, SAMPLES } from "./samples";
import { addActivity, getAsset, getProject, listAssets, saveAsset } from "./store";
import type { MediaAsset } from "./types";

const WORKER_INTERVAL_MS = 2 * 60_000;
const PAUSE_BETWEEN_MS = 2500;
const LOCK = "reanalyze:queue";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Assets that still need a real AI pass: indexed from a field log, or uploads whose analysis failed. */
export const needsAI = (a: MediaAsset) =>
  (a.status === "indexed" && a.analysisEngine === FIELD_LOG_ENGINE) || a.status === "analysis_failed";

export async function pendingAI() {
  return (await listAssets()).filter(needsAI);
}

export const reanalyzeRunning = () => isLocked(LOCK);

async function reanalyzeOne(asset: MediaAsset) {
  const sample = SAMPLES.find((s) => s.file === asset.id);
  const { metadata, engine } = await analyzeMedia(analysisFrameUrl(asset), {
    filename: asset.originalFilename,
    projectHint: asset.projectId,
    locationHint: asset.location !== "Unknown" ? asset.location : null,
    stageHint: sample?.stage,
    captureDate: asset.date,
  });
  const current = await getAsset(asset.id);
  if (!current || !needsAI(current)) return false;
  await saveAsset({
    ...current,
    ...metadata,
    projectId: getProject(metadata.project)?.id ?? current.projectId,
    status: "indexed",
    analysisEngine: engine,
    analyzedAt: new Date().toISOString(),
    editedAt: undefined,
  });
  return true;
}

/**
 * Run real AI analysis on every asset that is waiting for it, one at a time.
 * Stops early when all providers are paused; returns how many assets were analyzed.
 */
export async function reanalyzePending(): Promise<number | null> {
  return withLock(LOCK, async () => {
    let done = 0;
    for (const asset of await pendingAI()) {
      if (!aiAvailable()) break;
      try {
        if (await withLock(`asset:${asset.id}`, () => reanalyzeOne(asset))) done++;
      } catch (e) {
        if (e instanceof NotConfiguredError) break;
        console.warn(`[reanalyze] ${asset.id}: ${e instanceof Error ? e.message : e}`);
      }
      await sleep(PAUSE_BETWEEN_MS);
    }
    if (done) {
      console.info(`[reanalyze] AI analyzed ${done} waiting asset${done === 1 ? "" : "s"}`);
      await addActivity({ type: "analysis", message: `AI analyzed ${done} waiting photo${done === 1 ? "" : "s"}`, href: "/media" });
    }
    return done;
  });
}

/** Background loop that picks up waiting assets whenever an AI provider is available. */
export function startReanalyzeWorker() {
  const g = globalThis as unknown as { __impactlensReanalyze?: NodeJS.Timeout };
  if (g.__impactlensReanalyze) return;
  const tick = () => {
    if (aiAvailable()) reanalyzePending().catch((e) => console.warn("[reanalyze]", e instanceof Error ? e.message : e));
  };
  setTimeout(tick, 15_000);
  g.__impactlensReanalyze = setInterval(tick, WORKER_INTERVAL_MS);
}
