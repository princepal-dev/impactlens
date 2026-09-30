"use client";

import { FolderPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/panel";

const CATEGORIES = ["Water & Sanitation", "Environment", "Renewable Energy", "Infrastructure", "Community", "Other"];

export function NewProjectDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not create project");
      toast.success(`Project "${json.name}" created`);
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <FolderPlus /> New Project
        </Button>
      </DialogTrigger>
      <DialogContent title="New project" description="Evidence uploaded to this project is grouped, compared and reported together.">
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="label-mono">Name</span>
            <Input name="name" required maxLength={80} placeholder="Odisha Mangrove Restoration" className="mt-1.5" autoFocus />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label-mono">Category</span>
              <Select name="category" defaultValue="Environment" className="mt-1.5">
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </label>
            <label className="block">
              <span className="label-mono">Primary location</span>
              <Input name="location" required maxLength={80} placeholder="Kendrapara, Odisha" className="mt-1.5" />
            </label>
          </div>
          <label className="block">
            <span className="label-mono">Description</span>
            <textarea
              name="description"
              rows={3}
              maxLength={400}
              placeholder="What the project delivers and where."
              className="mt-1.5 w-full rounded-md border border-line-strong bg-[#111] px-3 py-2 text-sm text-foreground outline-none placeholder:text-subtle focus-visible:border-accent/60"
            />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <FolderPlus />} Create project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
