"use client";

import { AlertTriangle, ArrowRight, CloudUpload, Link2, RotateCcw, UploadCloud, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { requestJSON } from "@/lib/http";
import type { MediaAsset, Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AIAnalysisPanel } from "./AIAnalysisPanel";
import { MediaThumb } from "./MediaThumb";
import { ProcessingStatus, type StepState } from "./ProcessingStatus";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";
import { Input, Panel, Select } from "./ui/panel";

const ACCEPT = "image/jpeg,image/png,image/webp,video/mp4,video/quicktime";
const EXTENSIONS = /\.(jpe?g|png|webp|mp4|mov)$/i;
const FORMATS = ["JPG", "PNG", "WEBP", "MP4", "MOV"];
const MAX_BYTES = 100 * 1024 * 1024;
const CONCURRENCY = 2;
const UPLOAD_TIMEOUT_MS = 10 * 60_000;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Job = {
  key: string;
  name: string;
  preview: string | null;
  isVideo: boolean;
  progress: number;
  queued?: boolean;
  step: number; // 0 upload, 1 created, 2 analyzing, 3 extracting, 4 indexed
  error?: "upload" | "ai";
  errorMessage?: string;
  asset?: MediaAsset;
  source: { file?: File; url?: string };
};

type Task = { key: string; run: () => Promise<void> };

/** Start queued tasks until `CONCURRENCY` are in flight; each completion pulls the next one. */
function drain(queue: { current: Task[] }, active: { current: number }, onStart: (key: string) => void) {
  while (active.current < CONCURRENCY && queue.current.length) {
    const task = queue.current.shift()!;
    active.current++;
    onStart(task.key);
    task.run().finally(() => {
      active.current--;
      drain(queue, active, onStart);
    });
  }
}

export function UploadDropzone({
  projects,
  autoFocus,
  onIndexed,
}: {
  projects: Project[];
  autoFocus?: boolean;
  onIndexed?: (a: MediaAsset) => void;
}) {
  const [drag, setDrag] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [location, setLocation] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const zone = useRef<HTMLDivElement>(null);
  const queue = useRef<Task[]>([]);
  const active = useRef(0);
  const previews = useRef(new Set<string>());

  useEffect(() => {
    if (autoFocus) {
      zone.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      zone.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const patch = (key: string, p: Partial<Job>) => setJobs((js) => js.map((j) => (j.key === key ? { ...j, ...p } : j)));

  const enqueue = useCallback((key: string, run: () => Promise<void>) => {
    queue.current.push({ key, run });
    patch(key, { queued: true });
    drain(queue, active, (k) => patch(k, { queued: false }));
  }, []);

  const analyze = useCallback(
    async (key: string, asset: MediaAsset) => {
      patch(key, { step: 2, asset, error: undefined });
      const t = setTimeout(() => patch(key, { step: 3 }), 900);
      const res = await requestJSON<{ asset: MediaAsset }>("/api/analyze", {
        method: "POST",
        json: { assetId: asset.id, projectId: projectId || undefined },
        timeoutMs: 200_000,
      });
      clearTimeout(t);
      if (!res.ok) {
        const saved = (res.data?.asset as MediaAsset | undefined) ?? asset;
        patch(key, { error: "ai", asset: saved, errorMessage: res.error });
        toast.warning("AI analysis failed", { description: "The asset is saved and can be retried or tagged manually." });
        return;
      }
      patch(key, { step: 3 });
      await wait(450);
      patch(key, { step: 5, asset: res.data.asset });
      onIndexed?.(res.data.asset);
      toast.success("Evidence indexed", { description: res.data.asset.title });
    },
    [projectId, onIndexed],
  );

  const uploadFile = useCallback(
    (key: string, file: File) =>
      new Promise<MediaAsset | null>((resolve) => {
        const fd = new FormData();
        fd.append("file", file);
        if (projectId) fd.append("projectId", projectId);
        if (location.trim()) fd.append("location", location.trim());
        const xhr = new XMLHttpRequest();
        const fail = (message: string) => {
          patch(key, { error: "upload", errorMessage: message });
          toast.error("Upload failed", { description: message });
          resolve(null);
        };
        xhr.open("POST", "/api/upload");
        xhr.timeout = UPLOAD_TIMEOUT_MS;
        xhr.upload.onprogress = (e) => e.lengthComputable && patch(key, { progress: Math.round((e.loaded / e.total) * 100) });
        xhr.onload = () => {
          let json: { asset?: MediaAsset; error?: string } = {};
          try {
            json = JSON.parse(xhr.responseText);
          } catch {}
          if (xhr.status >= 300 || !json.asset) {
            fail(json.error || (xhr.status === 413 ? "The file is too large." : `Upload failed (${xhr.status || "network"}).`));
            return;
          }
          resolve(json.asset);
        };
        xhr.onerror = () => fail("Network error. Check your connection and try again.");
        xhr.ontimeout = () => fail("The upload timed out. Please try again.");
        xhr.send(fd);
      }),
    [projectId, location],
  );

  const importUrlAsset = useCallback(
    async (key: string, url: string) => {
      const res = await requestJSON<{ asset: MediaAsset }>("/api/upload", {
        method: "POST",
        json: { url, projectId: projectId || undefined, location: location.trim() || undefined },
        timeoutMs: 200_000,
      });
      if (res.ok) return res.data.asset;
      patch(key, { error: "upload", errorMessage: res.error });
      toast.error("Upload failed", { description: res.error });
      return null;
    },
    [projectId, location],
  );

  const run = useCallback(
    (job: Job) => {
      patch(job.key, { step: 0, progress: 0, error: undefined, errorMessage: undefined });
      enqueue(job.key, async () => {
        const asset = job.source.url ? await importUrlAsset(job.key, job.source.url) : await uploadFile(job.key, job.source.file!);
        if (!asset) return;
        patch(job.key, { step: 1, progress: 100, asset });
        await wait(400);
        await analyze(job.key, asset);
      });
    },
    [enqueue, importUrlAsset, uploadFile, analyze],
  );

  const retryAnalysis = (j: Job) => j.asset && enqueue(j.key, () => analyze(j.key, j.asset!));

  const dismiss = (j: Job) => {
    queue.current = queue.current.filter((t) => t.key !== j.key);
    if (j.preview?.startsWith("blob:")) {
      URL.revokeObjectURL(j.preview);
      previews.current.delete(j.preview);
    }
    setJobs((js) => js.filter((x) => x.key !== j.key));
  };

  const addFiles = (files: FileList | File[]) => {
    const all = Array.from(files);
    const supported = all.filter((f) => ACCEPT.split(",").includes(f.type) || EXTENSIONS.test(f.name));
    const list = supported.filter((f) => f.size > 0 && f.size <= MAX_BYTES);
    if (supported.length < all.length) toast.error("Unsupported format", { description: `Use ${FORMATS.join(", ")}.` });
    if (list.length < supported.length) toast.error("Some files were skipped", { description: "Files must be under 100 MB." });
    if (!list.length) return;
    const newJobs: Job[] = list.map((f) => {
      const preview = URL.createObjectURL(f);
      previews.current.add(preview);
      return {
        key: crypto.randomUUID(),
        name: f.name,
        preview,
        isVideo: f.type.startsWith("video") || /\.(mp4|mov)$/i.test(f.name),
        progress: 0,
        step: 0,
        source: { file: f },
      };
    });
    setJobs((js) => [...newJobs, ...js]);
    newJobs.forEach(run);
  };

  const importFromUrl = () => {
    const url = importUrl.trim();
    let valid = false;
    try {
      valid = ["http:", "https:"].includes(new URL(url).protocol);
    } catch {}
    if (!valid) {
      toast.error("Enter a valid Cloudinary or public media URL");
      return;
    }
    const job: Job = {
      key: crypto.randomUUID(),
      name: url.split("/").pop()?.split("?")[0] || "cloudinary-asset",
      preview: /\.(mp4|mov|webm)(\?|$)/i.test(url) ? null : url,
      isVideo: /\.(mp4|mov|webm)(\?|$)/i.test(url),
      progress: 0,
      step: 0,
      source: { url },
    };
    setJobs((js) => [job, ...js]);
    setImportOpen(false);
    setImportUrl("");
    run(job);
  };

  const stepsFor = (j: Job) => {
    const s = (i: number): StepState => {
      if (j.error === "upload" && i <= 1) return i === 0 ? "error" : "pending";
      if (j.error === "ai" && i >= 2) return i === 2 ? "error" : "pending";
      return j.step > i ? "done" : j.step === i ? "active" : "pending";
    };
    return [
      {
        label: j.queued && j.step === 0 ? "Waiting in queue…" : j.source.url ? "Importing Cloudinary asset…" : "Uploading to Cloudinary…",
        detail: j.step === 0 && !j.queued ? `${j.progress}%` : undefined,
        state: s(0),
      },
      { label: "Cloudinary asset created", detail: j.asset?.cloudinaryPublicId, state: s(1) },
      { label: "AI analyzing media…", state: s(2) },
      { label: "Extracting impact metadata…", state: s(3) },
      { label: "Evidence indexed", detail: j.step >= 5 && j.asset ? `${j.asset.tags.length} tags · ${j.asset.impactAreas.length} impact areas` : undefined, state: s(4) },
    ];
  };

  return (
    <div className="space-y-5">
      <div
        ref={zone}
        tabIndex={0}
        role="button"
        aria-label="Upload field media"
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "relative overflow-hidden rounded-lg border border-dashed px-6 py-12 text-center outline-none transition-all duration-200 focus-visible:border-accent/70",
          drag ? "border-accent bg-accent/[0.06]" : "border-line-strong bg-panel hover:border-tint/25",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.06),transparent_60%)]" />
        <div className="relative">
          <div className="mx-auto grid size-12 place-items-center rounded-lg border border-accent/30 bg-accent/10">
            <UploadCloud className="size-5 text-accent" />
          </div>
          <h2 className="mt-5 text-[20px] font-medium tracking-tight">Upload field media</h2>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-muted">
            Drop photos or videos here. ImpactLens will automatically analyze and organize them.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <Button variant="primary" onClick={() => input.current?.click()}>
              <CloudUpload /> Select files
            </Button>
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <Link2 /> Upload from Cloudinary
            </Button>
          </div>
          <div className="mx-auto mt-6 flex max-w-xl flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <span className="label-mono whitespace-nowrap">Assign to</span>
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="h-8 w-56 text-[12.5px]" onClick={(e) => e.stopPropagation()}>
              <option value="">Auto-detect project with AI</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Site, e.g. Osian, Rajasthan (optional)"
              className="h-8 w-60 text-[12.5px]"
            />
          </div>
          <div className="mt-5 flex items-center justify-center gap-1.5">
            {FORMATS.map((f) => (
              <span key={f} className="rounded-[3px] border border-line px-1.5 py-0.5 font-mono text-[10px] text-subtle">{f}</span>
            ))}
          </div>
        </div>
        <input ref={input} type="file" multiple accept={ACCEPT} className="hidden" onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {jobs.map((j) => (
        <Panel key={j.key} className="page-in overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_250px_1fr] 2xl:grid-cols-[320px_260px_1fr]">
            <div className="relative aspect-[4/3] border-b border-line bg-media lg:aspect-auto lg:min-h-[260px] lg:border-b-0 lg:border-r">
              {j.asset && j.step >= 1 ? (
                <MediaThumb asset={j.asset} w={600} h={460} className="absolute inset-0 size-full" />
              ) : j.preview ? (
                j.isVideo ? (
                  <video src={j.preview} className="absolute inset-0 size-full object-cover" muted />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={j.preview} alt={j.name} className="absolute inset-0 size-full object-cover" />
                )
              ) : (
                <div className="absolute inset-0 grid place-items-center text-subtle"><UploadCloud className="size-6" /></div>
              )}
              {(j.step === 2 || j.step === 3) && !j.error && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div className="scan-line absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-accent/25 to-transparent" />
                  <div className="absolute inset-0 border-2 border-accent/40" />
                </div>
              )}
              <div className="absolute left-2.5 top-2.5 max-w-[85%] truncate rounded-[3px] bg-black/60 px-1.5 py-0.5 font-mono text-[10.5px] text-white/80 backdrop-blur">{j.name}</div>
              <button
                onClick={() => dismiss(j)}
                className="absolute right-2 top-2 rounded bg-black/60 p-1 text-white/70 hover:text-white"
                aria-label="Dismiss"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="border-b border-line p-5 lg:border-b-0 lg:border-r">
              <div className="label-mono mb-4">Pipeline</div>
              <ProcessingStatus steps={stepsFor(j)} progress={j.progress} />
            </div>

            <div className="p-5">
              {j.error === "upload" && (
                <div className="flex h-full flex-col items-start justify-center gap-3">
                  <div className="flex items-center gap-2 text-warning"><AlertTriangle className="size-4" /> <span className="font-medium">Upload failed</span></div>
                  <p className="text-[13px] text-muted">{j.errorMessage || "Something went wrong while uploading."} Try again.</p>
                  <Button size="sm" onClick={() => run(j)}><RotateCcw /> Try again</Button>
                </div>
              )}
              {j.error === "ai" && (
                <div className="flex h-full flex-col items-start justify-center gap-3">
                  <div className="flex items-center gap-2 text-warning"><AlertTriangle className="size-4" /> <span className="font-medium">AI analysis failed</span></div>
                  <p className="text-[13px] text-muted">{j.errorMessage ? `${j.errorMessage} ` : ""}The asset is saved in Cloudinary and can be retried or tagged manually.</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => retryAnalysis(j)}><RotateCcw /> Retry analysis</Button>
                    {j.asset && <Button size="sm" variant="ghost" asChild><Link href={`/media/${j.asset.id}`}>Tag manually</Link></Button>}
                  </div>
                </div>
              )}
              {!j.error && j.step >= 5 && j.asset && (
                <div className="page-in">
                  <AIAnalysisPanel asset={j.asset} />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/media/${j.asset.id}`}>Open evidence <ArrowRight /></Link>
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/search?q=${encodeURIComponent(`${j.asset.tags[0]?.replace(/-/g, " ") ?? ""} in ${j.asset.location.split(",").pop()?.trim() ?? ""}`)}`}>Find similar evidence</Link>
                    </Button>
                  </div>
                </div>
              )}
              {!j.error && j.step < 5 && (
                <div className="space-y-3">
                  <div className="label-mono">Extracting metadata</div>
                  {["w-3/4", "w-1/2", "w-2/3", "w-5/6", "w-1/3"].map((w, i) => (
                    <div key={i} className={cn("skeleton h-3.5 rounded", w)} />
                  ))}
                  <div className="flex gap-1.5 pt-2">
                    {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-5 w-16 rounded" />)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Panel>
      ))}

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent
          title="Upload from Cloudinary"
          description="Paste a Cloudinary delivery URL (or any public image/video URL). The original asset reference is preserved for traceability."
        >
          <div className="space-y-3">
            <Input
              autoFocus
              placeholder="https://res.cloudinary.com/<cloud>/image/upload/v1/field/site-042.jpg"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && importFromUrl()}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setImportOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={importFromUrl}>Import &amp; analyze</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
