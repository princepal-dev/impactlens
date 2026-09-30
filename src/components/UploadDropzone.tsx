"use client";

import { AlertTriangle, ArrowRight, CloudUpload, Link2, RotateCcw, UploadCloud, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { MediaAsset, Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AIAnalysisPanel } from "./AIAnalysisPanel";
import { MediaThumb } from "./MediaThumb";
import { ProcessingStatus, type StepState } from "./ProcessingStatus";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";
import { Input, Panel, Select } from "./ui/panel";

const ACCEPT = "image/jpeg,image/png,image/webp,video/mp4,video/quicktime";
const FORMATS = ["JPG", "PNG", "WEBP", "MP4", "MOV"];

type Job = {
  key: string;
  name: string;
  preview: string | null;
  isVideo: boolean;
  progress: number;
  step: number; // 0 upload, 1 created, 2 analyzing, 3 extracting, 4 indexed
  error?: "upload" | "ai";
  errorMessage?: string;
  asset?: MediaAsset;
  source: { file?: File; url?: string };
};

export function UploadDropzone({
  projects,
  storageMode,
  autoFocus,
  onIndexed,
}: {
  projects: Project[];
  storageMode: "signed" | "unsigned" | "local";
  autoFocus?: boolean;
  onIndexed?: (a: MediaAsset) => void;
}) {
  const [drag, setDrag] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const zone = useRef<HTMLDivElement>(null);
  const cloud = storageMode !== "local";

  useEffect(() => {
    if (autoFocus) {
      zone.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      zone.current?.focus();
    }
  }, [autoFocus]);

  const patch = (key: string, p: Partial<Job>) => setJobs((js) => js.map((j) => (j.key === key ? { ...j, ...p } : j)));

  const analyze = useCallback(
    async (key: string, asset: MediaAsset) => {
      patch(key, { step: 2, asset });
      const t = setTimeout(() => patch(key, { step: 3 }), 900);
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetId: asset.id, projectId: projectId || undefined }),
        });
        const json = await res.json();
        clearTimeout(t);
        if (!res.ok) {
          patch(key, { error: "ai", asset: json.asset ?? asset, errorMessage: json.message });
          toast.warning("AI analysis unavailable", { description: "The asset is saved and can be manually tagged." });
          return;
        }
        patch(key, { step: 3 });
        await new Promise((r) => setTimeout(r, 450));
        patch(key, { step: 5, asset: json.asset });
        onIndexed?.(json.asset);
        toast.success("Evidence indexed", { description: json.asset.title });
      } catch {
        clearTimeout(t);
        patch(key, { error: "ai" });
        toast.warning("AI analysis unavailable", { description: "The asset is saved and can be manually tagged." });
      }
    },
    [projectId, onIndexed],
  );

  const run = useCallback(
    (job: Job) => {
      patch(job.key, { step: 0, progress: 0, error: undefined });
      if (job.source.url) {
        fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: job.source.url, projectId: projectId || undefined }),
        })
          .then(async (r) => {
            const json = await r.json();
            if (!r.ok) throw new Error(json.error);
            patch(job.key, { step: 1, progress: 100, asset: json.asset });
            await new Promise((res) => setTimeout(res, 400));
            analyze(job.key, json.asset);
          })
          .catch((e) => {
            patch(job.key, { error: "upload", errorMessage: e.message });
            toast.error("Upload failed", { description: e.message || "Try again." });
          });
        return;
      }
      const fd = new FormData();
      fd.append("file", job.source.file!);
      if (projectId) fd.append("projectId", projectId);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");
      xhr.upload.onprogress = (e) => e.lengthComputable && patch(job.key, { progress: Math.round((e.loaded / e.total) * 100) });
      xhr.onload = async () => {
        let json: { asset?: MediaAsset; error?: string } = {};
        try {
          json = JSON.parse(xhr.responseText);
        } catch {}
        if (xhr.status >= 300 || !json.asset) {
          patch(job.key, { error: "upload", errorMessage: json.error });
          toast.error("Upload failed", { description: json.error || "Try again." });
          return;
        }
        patch(job.key, { step: 1, progress: 100, asset: json.asset });
        await new Promise((r) => setTimeout(r, 450));
        analyze(job.key, json.asset);
      };
      xhr.onerror = () => {
        patch(job.key, { error: "upload" });
        toast.error("Upload failed", { description: "Network error. Try again." });
      };
      xhr.send(fd);
    },
    [analyze, projectId],
  );

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => ACCEPT.split(",").includes(f.type));
    if (!list.length) {
      toast.error("Unsupported format", { description: `Use ${FORMATS.join(", ")}.` });
      return;
    }
    const newJobs: Job[] = list.map((f) => ({
      key: crypto.randomUUID(),
      name: f.name,
      preview: URL.createObjectURL(f),
      isVideo: f.type.startsWith("video"),
      progress: 0,
      step: 0,
      source: { file: f },
    }));
    setJobs((js) => [...newJobs, ...js]);
    newJobs.forEach(run);
  };

  const importFromUrl = () => {
    if (!/^https?:\/\//.test(importUrl.trim())) {
      toast.error("Enter a valid Cloudinary or public media URL");
      return;
    }
    const url = importUrl.trim();
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
      { label: j.source.url ? "Importing Cloudinary asset…" : cloud ? "Uploading to Cloudinary…" : "Uploading to demo storage…", detail: j.step === 0 ? `${j.progress}%` : undefined, state: s(0) },
      { label: cloud || j.source.url ? "Cloudinary asset created" : "Asset stored (demo mode)", detail: j.asset?.cloudinaryPublicId, state: s(1) },
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
          drag ? "border-accent bg-accent/[0.06]" : "border-line-strong bg-panel hover:border-white/25",
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
          <div className="mx-auto mt-6 flex max-w-sm flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <span className="label-mono whitespace-nowrap">Assign to</span>
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="h-8 w-60 text-[12.5px]" onClick={(e) => e.stopPropagation()}>
              <option value="">Auto-detect project with AI</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
          <div className="mt-5 flex items-center justify-center gap-1.5">
            {FORMATS.map((f) => (
              <span key={f} className="rounded-[3px] border border-line px-1.5 py-0.5 font-mono text-[10px] text-subtle">{f}</span>
            ))}
          </div>
        </div>
        <input ref={input} type="file" multiple accept={ACCEPT} className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
      </div>

      {jobs.map((j) => (
        <Panel key={j.key} className="page-in overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_250px_1fr] 2xl:grid-cols-[320px_260px_1fr]">
            <div className="relative aspect-[4/3] border-b border-line bg-black lg:aspect-auto lg:min-h-[260px] lg:border-b-0 lg:border-r">
              {j.asset && j.step >= 1 && j.asset.storage === "cloudinary" ? (
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
                onClick={() => setJobs((js) => js.filter((x) => x.key !== j.key))}
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
                  <div className="flex items-center gap-2 text-warning"><AlertTriangle className="size-4" /> <span className="font-medium">AI analysis unavailable</span></div>
                  <p className="text-[13px] text-muted">The asset is still saved and can be manually tagged.</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => j.asset && analyze(j.key, j.asset)}><RotateCcw /> Retry analysis</Button>
                    {j.asset && <Button size="sm" variant="ghost" asChild><Link href={`/media/${j.asset.id}?tag=1`}>Tag manually</Link></Button>}
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
