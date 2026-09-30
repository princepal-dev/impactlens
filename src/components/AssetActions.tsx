"use client";

import { Loader2, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { requestJSON } from "@/lib/http";
import type { MediaAsset, Project } from "@/lib/types";
import { ManualTagForm } from "./ManualTagForm";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";

export function AssetActions({ asset, projects }: { asset: MediaAsset; projects: Project[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState<"analyze" | "delete" | null>(null);

  async function reanalyze() {
    setBusy("analyze");
    const res = await requestJSON<{ asset: MediaAsset }>("/api/analyze", { method: "POST", json: { assetId: asset.id }, timeoutMs: 200_000 });
    setBusy(null);
    router.refresh();
    if (!res.ok) return toast.error(res.error, { description: "Try again in a moment." });
    toast.success("Evidence re-analyzed", { description: res.data.asset.title });
  }

  async function remove() {
    setBusy("delete");
    const res = await requestJSON(`/api/assets/${encodeURIComponent(asset.id)}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) return toast.error("Could not delete this asset", { description: res.error });
    toast.success("Asset deleted");
    router.push("/media");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
          <Pencil /> Edit metadata
        </Button>
        <Button size="sm" variant="secondary" onClick={reanalyze} disabled={busy !== null}>
          {busy === "analyze" ? <Loader2 className="animate-spin" /> : <RotateCcw />} {busy === "analyze" ? "Analyzing…" : "Re-analyze"}
        </Button>
        <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)} disabled={busy !== null}>
          <Trash2 /> Delete
        </Button>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent title="Edit evidence metadata" description="Corrections are saved to the evidence index and used in search, comparisons and reports." className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <ManualTagForm asset={asset} projects={projects} onSaved={() => setEditing(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent title="Delete this evidence?" description="The evidence record and its original media in Cloudinary will be permanently removed. Existing reports keep their text but lose the link to this asset.">
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="danger" onClick={remove} disabled={busy === "delete"}>
              {busy === "delete" ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
