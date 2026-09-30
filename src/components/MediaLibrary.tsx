"use client";

import { CalendarRange, ImageOff, LayoutDashboard, LayoutGrid, type LucideIcon, Rows3, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MediaView } from "@/lib/media-views";
import type { MediaAsset, Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import { GalleryView, ListView, TilesView, TimelineView } from "./MediaViews";
import { UploadDropzone } from "./UploadDropzone";
import { Button } from "./ui/button";
import { Input } from "./ui/panel";

const PAGE_SIZE = 24;
const STAGES = [
  ["all", "All"],
  ["baseline", "Baseline"],
  ["implementation", "Implementation"],
  ["completed", "Completed"],
  ["monitoring", "Monitoring"],
] as const;

const VIEWS: { id: MediaView; label: string; icon: LucideIcon; hint: string }[] = [
  { id: "tiles", label: "Tiles", icon: LayoutGrid, hint: "Cards with full AI metadata" },
  { id: "gallery", label: "Gallery", icon: LayoutDashboard, hint: "Photo-first masonry" },
  { id: "list", label: "List", icon: Rows3, hint: "Every field in a sortable table" },
  { id: "timeline", label: "Timeline", icon: CalendarRange, hint: "Grouped by capture month" },
];

export function MediaLibrary({
  initial,
  projects,
  initialProject,
  initialView = "tiles",
  autoUpload,
}: {
  initial: MediaAsset[];
  projects: Project[];
  initialProject?: string;
  initialView?: MediaView;
  autoUpload?: boolean;
}) {
  const router = useRouter();
  const [assets, setAssets] = useState(initial);
  const [project, setProject] = useState(projects.find((p) => p.slug === initialProject)?.id ?? "all");
  const [stage, setStage] = useState("all");
  const [view, setView] = useState<MediaView>(initialView);
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

  const syncUrl = (projectId: string, nextView: MediaView) => {
    const qs = new URLSearchParams();
    const slug = projects.find((p) => p.id === projectId)?.slug;
    if (slug) qs.set("project", slug);
    if (nextView !== "tiles") qs.set("view", nextView);
    router.replace(qs.size ? `/media?${qs}` : "/media", { scroll: false });
  };

  const selectProject = (id: string) => {
    setProject(id);
    syncUrl(id, view);
  };

  const selectView = (v: MediaView) => {
    setView(v);
    syncUrl(project, v);
  };

  const shown = filtered.slice(0, visible);
  const hasMore = filtered.length > visible;
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setPage({ key: filterKey, n: visible + PAGE_SIZE }),
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, filterKey, visible]);

  return (
    <div className="space-y-8">
      <UploadDropzone
        projects={projects}
        autoFocus={autoUpload}
        onIndexed={(a) => setAssets((list) => [a, ...list.filter((x) => x.id !== a.id)])}
      />

      <section>
        <div className="sticky top-[80px] z-20 mb-4 flex flex-col gap-3 rounded-2xl border border-line bg-panel/90 p-2 pl-5 shadow-[var(--panel-shadow)] backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            {project === "all" ? "All field media" : projects.find((p) => p.id === project)?.name}
            <span className="rounded-full bg-lime px-2 py-0.5 text-[11.5px] font-semibold tabular-nums text-lime-foreground">{filtered.length}</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex overflow-x-auto rounded-full border border-line bg-inset p-1">
              {STAGES.map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setStage(v)}
                  className={cn(
                    "h-8 whitespace-nowrap rounded-full px-3.5 text-[12.5px] font-medium transition-colors duration-200",
                    stage === v ? "bg-ink text-ink-foreground" : "text-muted hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by tag, place…" className="h-10 w-56 pl-9 text-[13px]" />
            </div>
          </div>
        </div>

        <div className="mb-5 flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
        <div className={cn("flex flex-wrap gap-1.5", !projects.length && "invisible")}>
          {[{ id: "all", name: "All projects" }, ...projects].map((p) => (
            <button
              key={p.id}
              onClick={() => selectProject(p.id)}
              className={cn(
                "h-9 rounded-full border px-4 text-[13px] font-medium transition-colors duration-200",
                project === p.id ? "border-ink bg-ink text-ink-foreground" : "border-line bg-panel text-muted hover:border-line-strong hover:text-foreground",
              )}
            >
              {p.name}
              <span className="ml-1.5 text-[11px] tabular-nums opacity-60">
                {p.id === "all" ? assets.length : assets.filter((a) => a.projectId === p.id).length}
              </span>
            </button>
          ))}
        </div>

          <div role="radiogroup" aria-label="Media view" className="flex shrink-0 self-start rounded-full border border-line bg-panel p-1 shadow-[var(--panel-shadow)] md:self-auto">
            {VIEWS.map(({ id, label, icon: Icon, hint }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={view === id}
                title={hint}
                onClick={() => selectView(id)}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition-colors duration-200",
                  view === id ? "bg-lime text-lime-foreground" : "text-muted hover:bg-tint/[0.05] hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" />
                <span className="max-sm:hidden">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {filtered.length ? (
          <div key={view} className="page-in">
            {view === "gallery" ? (
              <GalleryView assets={shown} />
            ) : view === "list" ? (
              <ListView assets={shown} />
            ) : view === "timeline" ? (
              <TimelineView assets={shown} />
            ) : (
              <TilesView assets={shown} />
            )}
          </div>
        ) : null}
        {hasMore ? (
          <div ref={sentinel} className="mt-6 flex justify-center">
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
