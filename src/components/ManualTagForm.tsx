"use client";

import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { requestJSON } from "@/lib/http";
import type { MediaAsset, Project } from "@/lib/types";
import { Button } from "./ui/button";
import { Input, Select } from "./ui/panel";

const textarea =
  "w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-subtle focus-visible:border-ink";

/** Edit (or manually create) an asset's evidence metadata. */
export function ManualTagForm({ asset, projects, onSaved }: { asset: MediaAsset; projects: Project[]; onSaved?: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const indexed = asset.status === "indexed";
  const [f, setF] = useState({
    title: asset.title,
    projectId: asset.projectId ?? "",
    location: asset.location === "Unknown" ? "" : asset.location,
    activity: asset.activity,
    description: asset.description,
    date: asset.date,
    stage: asset.stage,
    tags: asset.tags.join(", "),
    impactAreas: asset.impactAreas.join(", "),
    beforeAfterCandidate: asset.beforeAfterCandidate,
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title.trim()) return toast.error("Title is required");
    setSaving(true);
    const res = await requestJSON(`/api/assets/${encodeURIComponent(asset.id)}`, { method: "PATCH", json: f });
    setSaving(false);
    if (!res.ok) return toast.error("Could not save changes", { description: res.error });
    toast.success(indexed ? "Metadata updated" : "Evidence tagged and indexed");
    onSaved?.();
    router.refresh();
  };

  return (
    <form onSubmit={save} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="space-y-1.5 sm:col-span-2">
        <span className="label-mono">Title</span>
        <Input value={f.title} maxLength={90} onChange={(e) => set("title", e.target.value)} />
      </label>
      <label className="space-y-1.5">
        <span className="label-mono">Project</span>
        <Select value={f.projectId} onChange={(e) => set("projectId", e.target.value)}>
          <option value="">Unassigned</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </label>
      <label className="space-y-1.5">
        <span className="label-mono">Stage</span>
        <Select value={f.stage} onChange={(e) => set("stage", e.target.value as MediaAsset["stage"])}>
          {["baseline", "implementation", "completed", "monitoring"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </label>
      <label className="space-y-1.5">
        <span className="label-mono">Location</span>
        <Input value={f.location} placeholder="City, State" onChange={(e) => set("location", e.target.value)} />
      </label>
      <label className="space-y-1.5">
        <span className="label-mono">Capture date</span>
        <Input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} className="[color-scheme:dark]" />
      </label>
      <label className="space-y-1.5 sm:col-span-2">
        <span className="label-mono">Activity</span>
        <Input value={f.activity} placeholder="e.g. Water tank construction" onChange={(e) => set("activity", e.target.value)} />
      </label>
      <label className="space-y-1.5 sm:col-span-2">
        <span className="label-mono">Description</span>
        <textarea rows={3} value={f.description} maxLength={600} onChange={(e) => set("description", e.target.value)} className={textarea} />
      </label>
      <label className="space-y-1.5 sm:col-span-2">
        <span className="label-mono">Tags (comma separated)</span>
        <Input value={f.tags} onChange={(e) => set("tags", e.target.value)} />
      </label>
      <label className="space-y-1.5 sm:col-span-2">
        <span className="label-mono">Impact areas (comma separated)</span>
        <Input value={f.impactAreas} placeholder="Water Access, Health" onChange={(e) => set("impactAreas", e.target.value)} />
      </label>
      <label className="flex items-center gap-2 text-[13px] text-muted sm:col-span-2">
        <input
          type="checkbox"
          checked={f.beforeAfterCandidate}
          onChange={(e) => set("beforeAfterCandidate", e.target.checked)}
          className="size-4 accent-accent"
        />
        Usable as before/after evidence
      </label>
      <div className="sm:col-span-2">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />} {indexed ? "Save changes" : "Save & index evidence"}
        </Button>
      </div>
    </form>
  );
}
