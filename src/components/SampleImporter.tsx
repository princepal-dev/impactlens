"use client";

import { CheckCircle2, CloudUpload, Loader2, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

type SampleStatus = { file: string; projectId: string; status: string | null };

const CONCURRENCY = 2;

export function SampleImporter({ ready, compact = false }: { ready: boolean; compact?: boolean }) {
  const router = useRouter();
  const [samples, setSamples] = useState<SampleStatus[] | null>(null);
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ file: string; error: string }[]>([]);
  const stop = useRef(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/samples")
      .then((r) => r.json())
      .then((d: SampleStatus[]) => alive && setSamples(d))
      .catch(() => alive && setSamples([]));
    return () => {
      alive = false;
    };
  }, []);

  const done = samples?.filter((s) => s.status === "indexed").length ?? 0;
  const total = samples?.length ?? 0;
  const remaining = total - done;

  async function run() {
    if (!samples) return;
    stop.current = false;
    setRunning(true);
    setErrors([]);
    const queue = samples.filter((s) => s.status !== "indexed").map((s) => s.file);
    let imported = 0;
    let fatal: string | null = null;

    const worker = async () => {
      while (queue.length && !stop.current && !fatal) {
        const file = queue.shift()!;
        setCurrent((c) => [...c, file]);
        try {
          const res = await fetch("/api/samples", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file }),
          });
          const json = await res.json();
          if (res.status === 503) fatal = json.error;
          if (!res.ok) throw new Error(json.error ?? "Import failed");
          imported++;
          setSamples((list) => list?.map((s) => (s.file === file ? { ...s, status: "indexed" } : s)) ?? list);
        } catch (e) {
          setErrors((list) => [...list, { file, error: e instanceof Error ? e.message : String(e) }]);
        } finally {
          setCurrent((c) => c.filter((f) => f !== file));
        }
      }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    if (imported) await fetch("/api/samples", { method: "PATCH", body: JSON.stringify({ imported }) });
    setRunning(false);
    router.refresh();
    if (fatal) toast.error(fatal);
    else if (imported) toast.success(`${imported} sample photos uploaded to Cloudinary and analyzed`);
  }

  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <Panel id="samples" className={compact ? "p-5" : "p-6"}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <div className="label-mono">Sample evidence</div>
          <h3 className="mt-1.5 text-[15px] font-medium">Import {total || 30} sample field photos</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            Uploads bundled photos from Rajasthan, Delhi and Maharashtra projects to your Cloudinary account and runs real AI
            analysis on each one. Only the project, site and capture date are supplied; everything else is generated from the image.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {running ? (
            <Button variant="secondary" size="sm" onClick={() => (stop.current = true)}>
              <Square /> Stop
            </Button>
          ) : remaining > 0 ? (
            <Button variant="primary" size="sm" onClick={run} disabled={!ready || !samples}>
              <CloudUpload /> {done ? `Import remaining ${remaining}` : "Import samples"}
            </Button>
          ) : samples ? (
            <span className="flex items-center gap-1.5 text-[12.5px] text-positive">
              <CheckCircle2 className="size-4" /> All samples indexed
            </span>
          ) : null}
        </div>
      </div>

      {samples && (done > 0 || running) && (
        <div className="mt-5">
          <div className="flex justify-between font-mono text-[11px] text-subtle">
            <span>
              {done}/{total} indexed
            </span>
            <span>{pct}%</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          {running && current.length > 0 && (
            <div className="mt-2.5 flex items-center gap-2 font-mono text-[11px] text-muted">
              <Loader2 className="size-3 animate-spin text-accent" /> Uploading &amp; analyzing {current.join(", ")}
            </div>
          )}
        </div>
      )}

      {!ready && <p className="mt-4 text-[12px] text-warning">Connect Cloudinary and Gemini first.</p>}

      {errors.length > 0 && (
        <ul className="mt-4 space-y-1 rounded-md border border-danger/25 bg-danger/[0.05] p-3 font-mono text-[11px] text-danger">
          {errors.slice(0, 5).map((e) => (
            <li key={e.file}>
              {e.file}: {e.error}
            </li>
          ))}
          {errors.length > 5 && <li>…and {errors.length - 5} more. Run the import again to retry.</li>}
        </ul>
      )}
    </Panel>
  );
}
