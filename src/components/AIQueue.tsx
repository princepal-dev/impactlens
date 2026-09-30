"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { requestJSON } from "@/lib/http";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

type QueueStatus = { pending: number; running: boolean; available: boolean };

const POLL_RUNNING_MS = 4000;
const POLL_IDLE_MS = 30_000;

async function fetchStatus() {
  const res = await requestJSON<QueueStatus>("/api/reanalyze", { timeoutMs: 10_000 });
  return res.ok ? res.data : null;
}

/** Shows photos waiting for real AI analysis and lets the user run the queue now. */
export function AIQueue({ className }: { className?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const lastPending = useRef<number | null>(null);

  const apply = useCallback(
    (next: QueueStatus) => {
      if (lastPending.current !== null && next.pending < lastPending.current) router.refresh();
      lastPending.current = next.pending;
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
    const t = pending ? setInterval(poll, running ? POLL_RUNNING_MS : POLL_IDLE_MS) : undefined;
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [pending, running, apply]);

  async function start() {
    const res = await requestJSON<QueueStatus>("/api/reanalyze", { method: "POST", timeoutMs: 10_000 });
    if (!res.ok) return toast.error("Could not start AI analysis", { description: res.error });
    apply(res.data);
    if (!res.data.running) {
      toast.message("AI is busy right now", { description: "Waiting photos will be analyzed automatically as soon as it's available." });
    }
  }

  if (!status || status.pending === 0) return null;

  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 rounded-2xl border border-line bg-panel p-4 shadow-[var(--panel-shadow)] sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lime text-lime-foreground">
          {status.running ? <Loader2 className="size-[18px] animate-spin" /> : <Sparkles className="size-[18px]" />}
        </span>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold tracking-tight">
            {status.running
              ? `Analyzing with AI · ${status.pending} photo${status.pending === 1 ? "" : "s"} left`
              : `${status.pending} photo${status.pending === 1 ? "" : "s"} waiting for AI analysis`}
          </div>
          <div className="mt-0.5 text-[12.5px] text-muted">
            {status.running
              ? "Titles, descriptions, tags and impact areas update as each photo is analyzed."
              : "They're analyzed automatically when AI is available, or start now."}
          </div>
        </div>
      </div>
      {!status.running && (
        <Button variant="primary" size="sm" onClick={start} className="shrink-0">
          <Sparkles /> Re-analyze all
        </Button>
      )}
    </div>
  );
}
