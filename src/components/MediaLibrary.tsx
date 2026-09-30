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
import { Input } from "./ui/panel";

const PAGE_SIZE = 48;
const STAGES = [
  ["all", "All"],
  ["baseline", "Baseline"],
  ["implementation", "Implementation"],
  ["completed", "Completed"],
  ["monitoring", "Monitoring"],
] as const;

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
    <div className="space-y-8">
      <UploadDropzone
        projects={projects}
        autoFocus={autoUpload}
        onIndexed={(a) => setAssets((list) => [a, ...list.filter((x) => x.id !== a.id)])}
      />

      <section>
        <div className="sticky top-3 z-20 mb-5 flex flex-col gap-3 rounded-xl border border-line bg-panel/85 p-2 pl-4 shadow-[var(--panel-shadow)] backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            {project === "all" ? "All field media" : projects.find((p) => p.id === project)?.name}
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11.5px] font-medium tabular-nums text-accent">{filtered.length}</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex overflow-x-auto rounded-lg border border-line bg-inset p-0.5">
              {STAGES.map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setStage(v)}
                  className={cn(
                    "h-8 whitespace-nowrap rounded-md px-2.5 text-[12.5px] font-medium transition-all",
                    stage === v ? "bg-surface text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.12)]" : "text-muted hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by tag, place…" className="h-9 w-52 pl-8 text-[13px]" />
            </div>
          </div>
        </div>

        <div className={cn("mb-5 flex flex-wrap gap-1.5", !projects.length && "hidden")}>
          {[{ id: "all", name: "All projects" }, ...projects].map((p) => (
            <button
              key={p.id}
              onClick={() => selectProject(p.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[12.5px] transition-colors",
                project === p.id ? "border-accent/40 bg-accent/10 text-accent" : "border-line text-muted hover:border-line-strong hover:text-foreground",
              )}
            >
              {p.name}
              <span className="ml-1.5 text-[11px] tabular-nums opacity-60">
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
              Load more <span className="tabular-nums text-subtle">{filtered.length - visible}</span>
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
