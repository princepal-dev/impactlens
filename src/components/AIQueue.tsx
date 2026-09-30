"use client";

import { CheckCircle2, Clock, Loader2, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { requestJSON } from "@/lib/http";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { eta, ProgressBar, ScanThumb } from "./ui/progress";

type QueueItem = { id: string; title: string; thumb: string; engine?: string };
type QueueProgress = {
  total: number;
  done: number;
  failed: number;
  current: QueueItem | null;
  recent: QueueItem[];
  startedAt: number;
  finishedAt: number | null;
};
type QueueStatus = { pending: number; running: boolean; available: boolean; progress: QueueProgress | null };

const POLL_RUNNING_MS = 2500;
const POLL_IDLE_MS = 30_000;

async function fetchStatus() {
  const res = await requestJSON<QueueStatus>("/api/reanalyze", { timeoutMs: 10_000 });
  return res.ok ? res.data : null;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Live progress for photos waiting on real AI analysis, with a way to start the queue now. */
export function AIQueue({ className }: { className?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [requested, setRequested] = useState(false);
  const [finished, setFinished] = useState<QueueProgress | null>(null);
  const lastDone = useRef<number | null>(null);
  const wasRunning = useRef(false);

  const apply = useCallback(
    (next: QueueStatus) => {
      const done = next.progress?.done ?? 0;
      if (lastDone.current !== null && done > lastDone.current) router.refresh();
      lastDone.current = done;
      if (wasRunning.current && !next.running && next.progress && next.progress.done > 0) setFinished(next.progress);
      wasRunning.current = next.running;
      if (next.running) setRequested(false);
      setStatus(next);
    },
    [router],
  );

  const pending = status?.pending ?? 0;
  const running = status?.running ?? false;
  useEffect(() => {
    let cancelled = false;
    const poll = () =>
      fetchStatus().then((next) => {
        if (!cancelled && next) apply(next);
      });
    poll();
    const t = pending || running ? setInterval(poll, running ? POLL_RUNNING_MS : POLL_IDLE_MS) : undefined;
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [pending, running, apply]);

  async function start() {
    setRequested(true);
    const res = await requestJSON<QueueStatus>("/api/reanalyze", { method: "POST", timeoutMs: 10_000 });
    if (!res.ok) {
      setRequested(false);
      return toast.error("Could not start AI analysis", { description: res.error });
    }
    apply(res.data);
  }

  if (!status) return null;

  const shell = cn("page-in mb-6 overflow-hidden rounded-2xl border border-line bg-panel shadow-[var(--panel-shadow)]", className);

  if (status.running && status.progress) {
    const p = status.progress;
    const processed = p.done + p.failed;
    const pct = p.total ? (processed / p.total) * 100 : 0;
    const left = eta(p.startedAt, processed, p.total - processed);
    return (
      <section className={shell} aria-live="polite">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3.5">
            {p.current ? (
              <ScanThumb src={p.current.thumb} className="h-14 w-[74px]" />
            ) : (
              <span className="grid h-14 w-[74px] shrink-0 place-items-center rounded-lg bg-tint/[0.05]">
                <Loader2 className="size-5 animate-spin text-subtle" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[14px] font-semibold tracking-tight">
                <Sparkles className="size-4 shrink-0 text-accent" />
                Analyzing with AI
                <span className="font-normal tabular-nums text-muted">
                  · {processed} of {p.total}
                </span>
              </div>
              <div className="mt-0.5 truncate text-[12.5px] text-muted">
                {p.current ? <>Reading “{p.current.title}”</> : "Preparing the next photo…"}
              </div>
              <ProgressBar value={pct} label="AI analysis progress" className="mt-2.5" />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4 text-[12px] tabular-nums text-subtle sm:flex-col sm:items-end sm:gap-1">
            <span className="text-[20px] font-semibold leading-none text-foreground">{Math.round(pct)}%</span>
            {left && (
              <span className="flex items-center gap-1">
                <Clock className="size-3" /> {left}
              </span>
            )}
          </div>
        </div>
        {p.recent.length > 0 && <RecentStrip items={p.recent} />}
      </section>
    );
  }

  if (finished) {
    return (
      <section className={shell} aria-live="polite">
        <div className="flex items-center gap-3.5 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lime text-lime-foreground">
            <CheckCircle2 className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold tracking-tight">{plural(finished.done, "photo")} analyzed with AI</div>
            <div className="mt-0.5 text-[12.5px] text-muted">
              {pending ? `${plural(pending, "photo")} still waiting · they continue automatically.` : "Titles, tags and impact areas are up to date."}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFinished(null)}
            aria-label="Dismiss"
            className="grid size-8 place-items-center rounded-full text-subtle transition-colors hover:bg-tint/[0.06] hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        {finished.recent.length > 0 && <RecentStrip items={finished.recent} />}
      </section>
    );
  }

  if (!pending) return null;

  const stalled = !!status.progress?.finishedAt && status.progress.done === 0 && status.progress.failed > 0;
  const waiting = (requested && !status.available) || stalled;
  return (
    <section className={shell}>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-lime text-lime-foreground">
            {requested && status.available ? <Loader2 className="size-[18px] animate-spin" /> : <Sparkles className="size-[18px]" />}
            {waiting && <span className="absolute -right-0.5 -top-0.5 size-3 animate-pulse rounded-full border-2 border-panel bg-warning" />}
          </span>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold tracking-tight">{plural(pending, "photo")} waiting for AI analysis</div>
            <div className="mt-0.5 text-[12.5px] text-muted">
              {waiting
                ? "AI is busy right now. Analysis starts automatically as soon as it's available."
                : "They're analyzed automatically when AI is available, or start now."}
            </div>
          </div>
        </div>
        <Button variant={waiting ? "secondary" : "primary"} size="sm" onClick={start} disabled={requested} className="shrink-0">
          {requested ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {requested ? (waiting ? "Waiting for AI…" : "Starting…") : waiting ? "Try again" : "Re-analyze all"}
        </Button>
      </div>
      {waiting && <ProgressBar label="Waiting for AI" className="mx-4 mb-4 h-1" />}
    </section>
  );
}

function RecentStrip({ items }: { items: QueueItem[] }) {
  return (
    <ul className="grid grid-cols-1 gap-2 border-t border-line bg-tint/[0.02] p-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((it) => (
        <li key={it.id} className="page-in">
          <Link href={`/media/${it.id}`} className="flex items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-tint/[0.04]">
            <ScanThumb src={it.thumb} alt={it.title} state="done" className="h-10 w-[52px]" />
            <span className="min-w-0">
              <span className="block truncate text-[12.5px] font-medium">{it.title}</span>
              {it.engine && <span className="block truncate text-[11px] text-subtle">{it.engine}</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
