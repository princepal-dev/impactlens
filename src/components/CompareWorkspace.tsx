"use client";

import { AlertTriangle, Columns2, Eye, FileText, Info, Loader2, RotateCcw, SplitSquareHorizontal, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { requestJSON } from "@/lib/http";
import type { ComparisonResult, MediaAsset, Project } from "@/lib/types";
import { cn, fmtDate, pct } from "@/lib/utils";
import { BeforeAfter } from "./BeforeAfter";
import { EmptyState } from "./EmptyState";
import { ImpactBadge } from "./ImpactBadge";
import { Button } from "./ui/button";
import { Panel, PanelHeader, Select } from "./ui/panel";

const ALL = "all";

export function CompareWorkspace({
  projects,
  assets,
  defaults,
  initialProject,
  initialAfter,
}: {
  projects: Project[];
  assets: MediaAsset[];
  defaults: Record<string, [string, string]>;
  initialProject?: string;
  initialAfter?: string;
}) {
  const router = useRouter();
  const inScope = (scope: string) =>
    assets
      .filter((a) => a.status === "indexed" && (scope === ALL || a.projectId === scope))
      .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));

  const pairFor = (scope: string, requestedAfter?: string): [string, string] => {
    const pl = inScope(scope);
    const has = (id?: string) => !!id && pl.some((x) => x.id === id);
    const d = scope === ALL ? undefined : defaults[scope];
    const after = requestedAfter && has(requestedAfter) ? requestedAfter : has(d?.[1]) ? d![1] : pl.at(-1)?.id ?? "";
    const before =
      has(d?.[0]) && d![0] !== after
        ? d![0]
        : (pl.find((x) => x.id !== after && x.stage === "baseline") ?? pl.find((x) => x.id !== after))?.id ?? "";
    return [before, after];
  };

  const [scope, setScope] = useState(() => {
    const fromSlug = projects.find((p) => p.slug === initialProject);
    if (fromSlug) return fromSlug.id;
    const requested = assets.find((a) => a.id === initialAfter);
    if (requested) return requested.projectId ?? ALL;
    return projects.find((p) => inScope(p.id).length >= 2)?.id ?? ALL;
  });
  const list = inScope(scope);
  const [[beforeId, afterId], setPair] = useState<[string, string]>(() => pairFor(scope, initialAfter));
  const [mode, setMode] = useState<"slider" | "side">("side");
  const [attempt, setAttempt] = useState(0);
  const [resp, setResp] = useState<{ key: string; data?: ComparisonResult; error?: string }>({ key: "" });

  const before = list.find((a) => a.id === beforeId);
  const after = list.find((a) => a.id === afterId);
  const key = `${beforeId}|${afterId}|${attempt}`;
  const loading = !!before && !!after && resp.key !== key;
  const result = resp.key === key ? resp.data ?? null : null;
  const error = resp.key === key ? resp.error : undefined;

  useEffect(() => {
    if (!before || !after) return;
    const controller = new AbortController();
    requestJSON<ComparisonResult>("/api/compare", {
      method: "POST",
      json: { beforeId: before.id, afterId: after.id },
      signal: controller.signal,
      timeoutMs: 120_000,
    }).then((r) => {
      if (controller.signal.aborted) return;
      setResp(r.ok ? { key, data: r.data } : { key, error: r.error });
    });
    return () => controller.abort();
  }, [before, after, key]);

  const changeScope = (next: string) => {
    setScope(next);
    setPair(pairFor(next));
    const slug = projects.find((p) => p.id === next)?.slug;
    router.replace(slug ? `/compare?project=${slug}` : "/compare", { scroll: false });
  };

  const allCount = inScope(ALL).length;
  const reportProject = projects.find((p) => p.id === (scope === ALL ? after?.projectId : scope));

  return (
    <div className="space-y-6">
      <Panel className="p-4 pl-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end [&_.label-mono]:flex [&_.label-mono]:items-center [&_.label-mono]:gap-1.5">
          <label className="space-y-1.5">
            <span className="label-mono">Project</span>
            <Select value={scope} onChange={(e) => changeScope(e.target.value)}>
              <option value={ALL}>All media ({allCount})</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name} ({inScope(p.id).length})</option>)}
            </Select>
          </label>
          <label className="space-y-1.5">
            <span className="label-mono"><span className="size-2 rounded-full bg-ink" /> Before</span>
            <Select value={beforeId} onChange={(e) => setPair([e.target.value, afterId])}>
              {list.map((a) => <option key={a.id} value={a.id} disabled={a.id === afterId}>{fmtDate(a.date)} — {a.title}</option>)}
            </Select>
          </label>
          <label className="space-y-1.5">
            <span className="label-mono"><span className="size-2 rounded-full bg-lime" /> After</span>
            <Select value={afterId} onChange={(e) => setPair([beforeId, e.target.value])}>
              {list.map((a) => <option key={a.id} value={a.id} disabled={a.id === beforeId}>{fmtDate(a.date)} — {a.title}</option>)}
            </Select>
          </label>
          <div className="flex rounded-full border border-line bg-inset p-1">
            {([["side", Columns2, "Side by side"], ["slider", SplitSquareHorizontal, "Slider"]] as const).map(([m, Icon, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-medium transition-colors duration-200",
                  mode === m ? "bg-ink text-ink-foreground" : "text-muted hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {list.length < 2 ? (
        <EmptyState
          icon={Eye}
          title={scope === ALL ? "Add another photo to compare" : "This project needs at least two photos"}
          description={
            scope === ALL
              ? "Comparison pairs an earlier photo with a later one. Upload at least two photos of the same site."
              : "Upload a baseline and a later photo of the same site to this project, or compare across all media."
          }
          action={
            <>
              <Button variant="primary" asChild>
                <Link href="/media?upload=1"><Upload /> Upload media</Link>
              </Button>
              {scope !== ALL && allCount >= 2 && (
                <Button variant="secondary" onClick={() => changeScope(ALL)}>Compare all media</Button>
              )}
            </>
          }
        />
      ) : before && after ? (
        <div className="page-in" key={`${beforeId}-${afterId}-${mode}`}>
          <BeforeAfter before={before} after={after} mode={mode} />
        </div>
      ) : (
        <EmptyState icon={Eye} title="Select two photos to compare" description="Choose an earlier and a later photo of the same site." />
      )}

      {before && after && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Panel>
            <PanelHeader
              eyebrow="Based on uploaded media"
              title="Comparison insights"
              action={result && !loading && <span className="max-w-[50%] truncate text-[12px] text-subtle" title={result.engine}>{result.engine}</span>}
            />
            <div className="relative p-5">
              {loading && (
                <div className="space-y-3">
                  <div className="mb-4 flex items-center gap-2 text-[13px] text-muted">
                    <Loader2 className="size-3.5 animate-spin" /> Comparing both frames…
                  </div>
                  {["w-11/12", "w-3/4", "w-5/6", "w-2/3"].map((w, i) => <div key={i} className={cn("skeleton h-4 rounded", w)} />)}
                </div>
              )}
              {!loading && error && (
                <div className="flex items-center justify-between gap-3 text-[13px] text-warning">
                  <span className="flex items-center gap-2"><AlertTriangle className="size-4" /> {error}</span>
                  <Button size="sm" onClick={() => setAttempt((n) => n + 1)}><RotateCcw /> Retry</Button>
                </div>
              )}
              {!loading && result && (
                <div className="page-in">
                  <p className="text-[14.5px] leading-relaxed text-soft">{result.summary}</p>
                  <div className="label-mono mb-3 mt-6">Observed changes</div>
                  <ul className="space-y-2">
                    {result.observations.map((o) => (
                      <li key={o} className="flex gap-2.5 text-[13.5px] leading-relaxed">
                        <span className="mt-[7px] size-2 shrink-0 rounded-full bg-lime" />
                        <span className="text-foreground/90">{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Panel>

          <div className="space-y-6">
            <Panel className="p-5">
              <div className="label-mono">Potential impact areas</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(result?.impactAreas ?? []).map((a) => <ImpactBadge key={a} area={a} />)}
                {!result && <div className="skeleton h-6 w-40 rounded-full" />}
              </div>
              <div className="mt-6 border-t border-line pt-5">
                <div className="flex items-baseline justify-between">
                  <div className="label-mono">Comparison confidence</div>
                  <div className="text-[20px] font-semibold tabular-nums">{result ? pct(result.confidence) : "—"}</div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-tint/[0.08]">
                  <div className="h-full rounded-full bg-lime transition-[width] duration-500" style={{ width: result ? pct(result.confidence) : "0%" }} />
                </div>
              </div>
            </Panel>
            <Panel className="p-5">
              <div className="flex items-center gap-2 text-[13px] font-medium"><Info className="size-4 text-warning" /> Verification notes</div>
              <ul className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-muted">
                {(result?.caveats ?? []).map((c) => <li key={c}>{c}</li>)}
              </ul>
              {reportProject && (
                <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                  <Link href={`/reports?project=${reportProject.slug}`}><FileText /> Add to impact report</Link>
                </Button>
              )}
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
