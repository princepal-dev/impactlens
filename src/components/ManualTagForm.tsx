"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { MediaAsset, Project } from "@/lib/types";
import { Button } from "./ui/button";
import { Input, Select } from "./ui/panel";

export function ManualTagForm({ asset, projects }: { asset: MediaAsset; projects: Project[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    title: asset.title,
    projectId: asset.projectId ?? projects[0].id,
    location: asset.location === "Unknown" ? "" : asset.location,
    activity: asset.activity,
    tags: asset.tags.join(", "),
    stage: asset.stage,
  });

  const save = async () => {
    setSaving(true);
    const p = projects.find((x) => x.id === f.projectId)!;
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId: asset.id,
        metadata: {
          title: f.title,
          projectId: p.id,
          project: p.name,
          category: p.category,
          location: f.location || p.location,
          activity: f.activity,
          tags: f.tags.split(",").map((t) => t.trim().toLowerCase().replace(/\s+/g, "-")).filter(Boolean),
          stage: f.stage,
          confidence: 1,
          impactAreas: asset.impactAreas.length ? asset.impactAreas : [p.category],
          description: asset.description || `${f.activity} documented at ${f.location || p.location}.`,
        },
      }),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) return toast.error("Could not save tags", { description: "Try again." });
    toast.success("Evidence tagged and indexed");
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="space-y-1.5 sm:col-span-2"><span className="label-mono">Title</span><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
      <label className="space-y-1.5"><span className="label-mono">Project</span>
        <Select value={f.projectId} onChange={(e) => setF({ ...f, projectId: e.target.value })}>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </label>
      <label className="space-y-1.5"><span className="label-mono">Stage</span>
        <Select value={f.stage} onChange={(e) => setF({ ...f, stage: e.target.value as MediaAsset["stage"] })}>
          {["baseline", "implementation", "completed", "monitoring"].map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </label>
      <label className="space-y-1.5"><span className="label-mono">Location</span><Input value={f.location} placeholder="City, State" onChange={(e) => setF({ ...f, location: e.target.value })} /></label>
      <label className="space-y-1.5"><span className="label-mono">Activity</span><Input value={f.activity} onChange={(e) => setF({ ...f, activity: e.target.value })} /></label>
      <label className="space-y-1.5 sm:col-span-2"><span className="label-mono">Tags (comma separated)</span><Input value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} /></label>
      <div className="sm:col-span-2"><Button variant="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save & index evidence"}</Button></div>
    </div>
  );
}
