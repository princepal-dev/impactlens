"use client";

import { Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { requestJSON } from "@/lib/http";
import type { Project } from "@/lib/types";
import { CategoryIcon } from "./ImpactBadge";
import { NewProjectDialog } from "./NewProjectDialog";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";
import { Input, Panel, PanelHeader, Select } from "./ui/panel";

const CATEGORIES = ["Water & Sanitation", "Environment", "Renewable Energy", "Infrastructure", "Community", "Other"];
const STATUSES = ["Active", "Monitoring", "Completed"];

type Row = Project & { totalAssets: number };

export function ProjectManager({ projects }: { projects: Row[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Project>>({});
  const [pendingDelete, setPendingDelete] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(id: string) {
    setBusy(true);
    const res = await requestJSON(`/api/projects/${encodeURIComponent(id)}`, { method: "PATCH", json: draft });
    setBusy(false);
    if (!res.ok) return toast.error("Could not update project", { description: res.error });
    toast.success("Project updated");
    setEditing(null);
    router.refresh();
  }

  async function remove(p: Row) {
    setBusy(true);
    const res = await requestJSON(`/api/projects/${encodeURIComponent(p.id)}`, { method: "DELETE" });
    setBusy(false);
    setPendingDelete(null);
    if (!res.ok) return toast.error("Could not delete project", { description: res.error });
    toast.success(`Project "${p.name}" deleted`);
    router.refresh();
  }

  return (
    <Panel>
      <PanelHeader eyebrow="Workspace" title="Projects" action={<NewProjectDialog />} />
      {projects.length === 0 ? (
        <p className="px-5 py-6 text-[13px] text-muted">No projects yet. Create one to start organizing field evidence.</p>
      ) : (
        <ul className="divide-y divide-line">
          {projects.map((p) =>
            editing === p.id ? (
              <li key={p.id} className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-2">
                <Input defaultValue={p.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} aria-label="Name" />
                <Input defaultValue={p.location} onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))} aria-label="Location" />
                <Select defaultValue={p.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))} aria-label="Category">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </Select>
                <Select
                  defaultValue={p.status}
                  onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as Project["status"] }))}
                  aria-label="Status"
                >
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </Select>
                <Input
                  className="sm:col-span-2"
                  defaultValue={p.description}
                  placeholder="Description"
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  aria-label="Description"
                />
                <div className="flex gap-2 sm:col-span-2">
                  <Button size="sm" variant="primary" onClick={() => save(p.id)} disabled={busy}>
                    {busy ? <Loader2 className="animate-spin" /> : <Check />} Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    <X /> Cancel
                  </Button>
                </div>
              </li>
            ) : (
              <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-tint/[0.03]">
                    <CategoryIcon category={p.category} className="size-3.5 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <Link href={`/media?project=${p.slug}`} className="truncate text-[13.5px] font-medium hover:text-accent">
                      {p.name}
                    </Link>
                    <div className="truncate font-mono text-[11px] text-subtle">
                      {p.location} · {p.totalAssets} assets · {p.status}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Edit ${p.name}`}
                    onClick={() => {
                      setDraft({});
                      setEditing(p.id);
                    }}
                  >
                    <Pencil />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label={`Delete ${p.name}`} onClick={() => setPendingDelete(p)} className="hover:text-danger">
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      <Dialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <DialogContent
          title={`Delete "${pendingDelete?.name}"?`}
          description={
            pendingDelete?.totalAssets
              ? `Its ${pendingDelete.totalAssets} evidence assets are kept in the library as unassigned. Reports already generated remain available.`
              : "This project has no evidence yet."
          }
        >
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => pendingDelete && remove(pendingDelete)} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete project
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
