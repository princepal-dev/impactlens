"use client";

import { CheckCircle2, Clock, CloudUpload, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { eta, ProgressBar, ScanThumb } from "@/components/ui/progress";
import { requestJSON } from "@/lib/http";
import type { SampleCollection } from "@/lib/samples";

type SampleStatus = {
  file: string;
  title: string;
  preview: string;
  projectId: string;
  collection: SampleCollection;
  status: string | null;
  engine: string | null;
};
type RunState = { collection: SampleCollection; startedAt: number; processed: number; queued: number };
type Result = { file: string; ok: boolean; engine: string | null };

const CONCURRENCY = 2;
const timestamp = () => Date.now();

const COLLECTIONS: { id: SampleCollection; title: string; description: React.ReactNode }[] = [
  {
    id: "unsplash",
    title: "Unsplash photo collection",
    description: (
      <>
        Coastal clean-up in Goa and forest restoration in Uttarakhand, each with clear before, during and after photos. Free
        photos from{" "}
        <a href="https://unsplash.com" target="_blank" rel="noreferrer" className="text-foreground underline-offset-2 hover:underline">
          Unsplash
        </a>
        , credited on every asset.
      </>
    ),
  },
  {
    id: "field",
    title: "Field photo collection",
    description: "Water, greening and solar projects in Rajasthan, Delhi and Maharashtra.",
  },
];

export function SampleImporter({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [samples, setSamples] = useState<SampleStatus[] | null>(null);
  const [run, setRun] = useState<RunState | null>(null);
  const [current, setCurrent] = useState<{ file: string; at: number }[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const running = run?.collection ?? null;
  const [errors, setErrors] = useState<{ file: string; error: string }[]>([]);
  const stop = useRef(false);

  useEffect(() => {
    let alive = true;
    requestJSON<SampleStatus[]>("/api/samples", { timeoutMs: 20_000 }).then((r) => {
      if (alive) setSamples(r.ok && Array.isArray(r.data) ? r.data : []);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  async function start(collection: SampleCollection) {
    if (!samples) return;
    stop.current = false;
    setErrors([]);
    setResults([]);
    const queue = samples.filter((s) => s.collection === collection && s.status !== "indexed").map((s) => s.file);
    setRun({ collection, startedAt: timestamp(), processed: 0, queued: queue.length });
    let imported = 0;
    let fatal: string | null = null;

    const worker = async () => {
      while (queue.length && !stop.current && !fatal) {
        const file = queue.shift()!;
        setCurrent((c) => [...c, { file, at: Date.now() }]);
        let res = await requestJSON<{ asset?: { analysisEngine?: string } }>("/api/samples", { method: "POST", json: { file }, timeoutMs: 200_000 });
        if (!res.ok && res.status === 429) {
          await new Promise((r) => setTimeout(r, 15_000));
          res = await requestJSON<{ asset?: { analysisEngine?: string } }>("/api/samples", { method: "POST", json: { file }, timeoutMs: 200_000 });
        }
        if (res.ok) {
          imported++;
          const engine = res.data.asset?.analysisEngine ?? null;
          setSamples((list) => list?.map((s) => (s.file === file ? { ...s, status: "indexed", engine } : s)) ?? list);
          setResults((r) => [{ file, ok: true, engine }, ...r].slice(0, 6));
        } else {
          if (res.status === 503) fatal = res.error;
          const error = res.error;
          setErrors((list) => [...list, { file, error }]);
          setSamples((list) => list?.map((s) => (s.file === file ? { ...s, status: "analysis_failed" } : s)) ?? list);
          setResults((r) => [{ file, ok: false, engine: null }, ...r].slice(0, 6));
        }
        setCurrent((c) => c.filter((f) => f.file !== file));
        setRun((r) => (r ? { ...r, processed: r.processed + 1 } : r));
      }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    if (imported) await requestJSON("/api/samples", { method: "PATCH", json: { imported } });
    setRun(null);
    setCurrent([]);
    router.refresh();
    if (fatal) toast.error(fatal);
    else if (imported) toast.success(`${imported} sample photos indexed`);
  }

  return (
    <Panel id="samples" className="scroll-mt-24">
      <div className={compact ? "px-5 pb-1 pt-5" : "px-6 pb-1 pt-6"}>
        <div className="label-mono">Sample evidence</div>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted">
          Each photo goes through the full pipeline: stored in Cloudinary, analyzed by AI and indexed for search, comparison and
          reporting. Projects are created automatically.
        </p>
      </div>
      <ul className="divide-y divide-line">
        {COLLECTIONS.map((c) => {
          const items = samples?.filter((s) => s.collection === c.id) ?? [];
          const done = items.filter((s) => s.status === "indexed").length;
          const total = items.length;
          const remaining = total - done;
          const pct = total ? Math.round((done / total) * 100) : 0;
          const active = running === c.id;
          return (
            <li key={c.id} className={compact ? "px-5 py-4" : "px-6 py-5"}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-xl">
                  <h3 className="text-[14px] font-medium">
                    {c.title} <span className="font-normal text-subtle">· {total || "…"} photos</span>
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{c.description}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {active ? (
                    <Button variant="secondary" size="sm" onClick={() => (stop.current = true)}>
                      <Square /> Stop
                    </Button>
                  ) : remaining > 0 ? (
                    <Button variant={c.id === "unsplash" ? "primary" : "secondary"} size="sm" onClick={() => start(c.id)} disabled={!samples || !!running}>
                      <CloudUpload /> {done ? `Load remaining ${remaining}` : "Load photos"}
                    </Button>
                  ) : samples ? (
                    <span className="flex items-center gap-1.5 text-[12.5px] text-positive">
                      <CheckCircle2 className="size-4" /> All indexed
                    </span>
                  ) : null}
                </div>
              </div>

              {!samples && <div className="skeleton mt-4 h-1.5 w-full rounded-full" />}

              {samples && active && run && (
                <div className="page-in mt-4 rounded-xl border border-line bg-tint/[0.02] p-3.5" aria-live="polite">
                  <div className="flex items-center justify-between gap-3 text-[12.5px]">
                    <span className="font-medium">
                      Importing · <span className="tabular-nums">{done}/{total}</span> indexed
                    </span>
                    <span className="flex items-center gap-1 tabular-nums text-subtle">
                      <Clock className="size-3" />
                      {eta(run.startedAt, run.processed, run.queued - run.processed) ?? "Estimating time…"}
                    </span>
                  </div>
                  <ProgressBar value={pct} label={`${c.title} import progress`} className="mt-2" />
                  {current.length > 0 && (
                    <ul className="mt-3.5 space-y-2.5">
                      {current.map(({ file, at }) => {
                        const s = items.find((x) => x.file === file);
                        return (
                          <li key={file} className="page-in flex items-center gap-3">
                            {s && <ScanThumb src={s.preview} alt={s.title} className="h-10 w-[54px]" />}
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[13px] font-medium">{s?.title ?? file}</div>
                              <div className="text-[11.5px] tabular-nums text-subtle">
                                Uploading & analyzing with AI · {Math.max(0, Math.round((now - at) / 1000))}s
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {results.length > 0 && (
                    <ul className="mt-3.5 flex flex-wrap gap-2 border-t border-line pt-3">
                      {results.map((r) => {
                        const s = items.find((x) => x.file === r.file);
                        return s ? (
                          <li key={r.file} className="page-in" title={`${s.title}${r.engine ? ` · ${r.engine}` : ""}`}>
                            <ScanThumb src={s.preview} alt={s.title} state={r.ok ? "done" : "error"} className="h-9 w-12" />
                          </li>
                        ) : null;
                      })}
                    </ul>
                  )}
                </div>
              )}

              {samples && !active && done > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-[12px] tabular-nums text-subtle">
                    <span>
                      {done}/{total} indexed
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <ProgressBar value={pct} label={`${c.title} progress`} className="mt-1.5 h-1" />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {errors.length > 0 && (
        <ul className="mx-6 mb-6 space-y-1 rounded-xl border border-danger/25 bg-danger/[0.05] p-3 text-[12px] text-danger">
          {errors.slice(0, 5).map((e) => (
            <li key={e.file}>
              {samples?.find((x) => x.file === e.file)?.title ?? e.file}: {e.error}
            </li>
          ))}
          {errors.length > 5 && <li>…and {errors.length - 5} more. Load again to retry.</li>}
        </ul>
      )}
    </Panel>
  );
}
