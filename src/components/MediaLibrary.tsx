"use client";

import { ImageOff, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { MediaAsset, Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import { MediaCard } from "./MediaCard";
import { UploadDropzone } from "./UploadDropzone";
import { Button } from "./ui/button";
import { Input, Select } from "./ui/panel";

const PAGE_SIZE = 48;

export function MediaLibrary({
  initial,
  projects,
  initialProject,
  autoUpload,
}: {
  initial: MediaAsset[];
  projects: Project[];
  initialProject?: string;
  autoUpload?: boolean;
}) {
  const router = useRouter();
  const [assets, setAssets] = useState(initial);
  const [project, setProject] = useState(projects.find((p) => p.slug === initialProject)?.id ?? "all");
  const [stage, setStage] = useState("all");
  const [q, setQ] = useState("");
  const filterKey = `${project}|${stage}|${q}`;
  const [page, setPage] = useState({ key: filterKey, n: PAGE_SIZE });
  const visible = page.key === filterKey ? page.n : PAGE_SIZE;

  const filtered = useMemo(
    () =>
      assets.filter(
        (a) =>
          (project === "all" || a.projectId === project) &&
          (stage === "all" || a.stage === stage) &&
          (!q || `${a.title} ${a.tags.join(" ")} ${a.location} ${a.activity}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [assets, project, stage, q],
  );

  const selectProject = (id: string) => {
    setProject(id);
    const slug = projects.find((p) => p.id === id)?.slug;
    router.replace(slug ? `/media?project=${slug}` : "/media", { scroll: false });
  };

  return (
    <div className="space-y-10">
      <UploadDropzone
        projects={projects}
        autoFocus={autoUpload}
        onIndexed={(a) => setAssets((list) => [a, ...list.filter((x) => x.id !== a.id)])}
      />

      <section>
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="label-mono">Evidence library</div>
            <h2 className="mt-1 text-lg font-medium">
              {project === "all" ? "All field media" : projects.find((p) => p.id === project)?.name}
              <span className="ml-2 font-mono text-[13px] font-normal text-subtle">{filtered.length}</span>
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by tag, place…" className="h-9 w-52 pl-8 text-[13px]" />
            </div>
            <Select value={stage} onChange={(e) => setStage(e.target.value)} className="h-9 w-40 text-[13px]">
              <option value="all">All stages</option>
              <option value="baseline">Baseline</option>
              <option value="implementation">Implementation</option>
              <option value="completed">Completed</option>
              <option value="monitoring">Monitoring</option>
            </Select>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-1.5">
          {[{ id: "all", name: "All projects" }, ...projects].map((p) => (
            <button
              key={p.id}
              onClick={() => selectProject(p.id)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-[12.5px] transition-colors",
                project === p.id ? "border-accent/40 bg-accent/10 text-accent" : "border-line text-muted hover:border-line-strong hover:text-foreground",
              )}
            >
              {p.name}
              <span className="ml-1.5 font-mono text-[11px] opacity-60">
                {p.id === "all" ? assets.length : assets.filter((a) => a.projectId === p.id).length}
              </span>
            </button>
          ))}
        </div>

        {filtered.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.slice(0, visible).map((a) => <MediaCard key={a.id} asset={a} />)}
          </div>
        ) : null}
        {filtered.length > visible ? (
          <div className="mt-6 flex justify-center">
            <Button size="sm" variant="secondary" onClick={() => setPage({ key: filterKey, n: visible + PAGE_SIZE })}>
              Load more <span className="font-mono text-subtle">{filtered.length - visible}</span>
            </Button>
          </div>
        ) : null}
        {filtered.length ? null : (
          <EmptyState
            icon={ImageOff}
            title="No media matches these filters"
            description="Try a different project or stage, or upload new field media above."
            action={<Button size="sm" onClick={() => { setProject("all"); setStage("all"); setQ(""); }}>Clear filters</Button>}
          />
        )}
      </section>
    </div>
  );
}
