import "server-only";
import { aiAvailable, foregroundIdleMs, runInBackground } from "./ai";
import { analyzeMedia } from "./analyze";
import { NotConfiguredError } from "./config";
import { analysisFrameUrl, thumbUrl } from "./media-url";
import { isLocked, withLock } from "./rate-limit";
import { FIELD_LOG_ENGINE, SAMPLES } from "./samples";
import { addActivity, getAsset, getProject, listAssets, saveAsset } from "./store";
import type { MediaAsset } from "./types";

const WORKER_INTERVAL_MS = 2 * 60_000;
const PAUSE_BETWEEN_MS = 2500;
/** Providers limit tokens per minute, so the queue waits until user-facing AI calls have been quiet this long. */
const FOREGROUND_QUIET_MS = 30_000;
const LOCK = "reanalyze:queue";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface QueueItem {
  id: string;
  title: string;
  thumb: string;
  engine?: string;
}

export interface QueueProgress {
  total: number;
  done: number;
  failed: number;
  current: QueueItem | null;
  recent: QueueItem[];
  startedAt: number;
  finishedAt: number | null;
}

const g = globalThis as unknown as { __impactlensQueue?: QueueProgress | null };
export const queueProgress = () => g.__impactlensQueue ?? null;

const item = (a: MediaAsset, engine?: string): QueueItem => ({ id: a.id, title: a.title, thumb: thumbUrl(a, 160, 120), engine });

/** Assets that still need a real AI pass: indexed from a field log, or uploads whose analysis failed. */
export const needsAI = (a: MediaAsset) =>
  (a.status === "indexed" && a.analysisEngine === FIELD_LOG_ENGINE) || a.status === "analysis_failed";

export async function pendingAI() {
  return (await listAssets()).filter(needsAI);
}

export const reanalyzeRunning = () => isLocked(LOCK);

async function reanalyzeOne(asset: MediaAsset): Promise<MediaAsset | null> {
  const sample = SAMPLES.find((s) => s.file === asset.id);
  const { metadata, engine } = await analyzeMedia(analysisFrameUrl(asset), {
    filename: asset.originalFilename,
    projectHint: asset.projectId,
    locationHint: asset.location !== "Unknown" ? asset.location : null,
    stageHint: sample?.stage,
    captureDate: asset.date,
  });
  const current = await getAsset(asset.id);
  if (!current || !needsAI(current)) return null;
  return saveAsset({
    ...current,
    ...metadata,
    projectId: getProject(metadata.project)?.id ?? current.projectId,
    status: "indexed",
    analysisEngine: engine,
    analyzedAt: new Date().toISOString(),
    editedAt: undefined,
  });
}

/**
 * Run real AI analysis on every asset that is waiting for it, one at a time.
 * Stops early when all providers are paused; returns how many assets were analyzed.
 */
export async function reanalyzePending(): Promise<number | null> {
  return withLock(LOCK, async () => {
    const queue = await pendingAI();
    const progress: QueueProgress = { total: queue.length, done: 0, failed: 0, current: null, recent: [], startedAt: Date.now(), finishedAt: null };
    g.__impactlensQueue = progress;
    for (const asset of queue) {
      while (foregroundIdleMs() < FOREGROUND_QUIET_MS) await sleep(3000);
      if (!aiAvailable()) break;
      progress.current = item(asset);
      try {
        const updated = await withLock(`asset:${asset.id}`, () => runInBackground(() => reanalyzeOne(asset)));
        if (updated) {
          progress.done++;
          progress.recent = [item(updated, updated.analysisEngine), ...progress.recent].slice(0, 4);
        }
      } catch (e) {
        progress.failed++;
        if (e instanceof NotConfiguredError) break;
        console.warn(`[reanalyze] ${asset.id}: ${e instanceof Error ? e.message : e}`);
      }
      progress.current = null;
      await sleep(PAUSE_BETWEEN_MS);
    }
    progress.current = null;
    progress.finishedAt = Date.now();
    const done = progress.done;
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
