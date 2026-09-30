"use client";

import { AlertTriangle, Columns2, Eye, FileText, Info, RotateCcw, Sparkles, SplitSquareHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { requestJSON } from "@/lib/http";
import type { ComparisonResult, MediaAsset, Project } from "@/lib/types";
import { cn, fmtDate, pct } from "@/lib/utils";
import { BeforeAfter } from "./BeforeAfter";
import { EmptyState } from "./EmptyState";
import { ImpactBadge } from "./ImpactBadge";
import { Button } from "./ui/button";
import { Panel, PanelHeader, Select } from "./ui/panel";

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
  const startProject = projects.find((p) => p.slug === initialProject) ?? projects[0];
  const [projectId, setProjectId] = useState(startProject.id);
  const list = useMemo(
    () => assets.filter((a) => a.projectId === projectId && a.status === "indexed").sort((a, b) => a.date.localeCompare(b.date)),
    [assets, projectId],
  );

  const pairFor = (pid: string, after?: string): [string, string] => {
    const d = defaults[pid];
    const pl = assets.filter((a) => a.projectId === pid).sort((a, b) => a.date.localeCompare(b.date));
    const b = d?.[0] ?? pl[0]?.id ?? "";
    const a = after && pl.some((x) => x.id === after) ? after : d?.[1] ?? pl.at(-1)?.id ?? "";
    return [b === a ? pl[0]?.id ?? b : b, a];
  };

  const [[beforeId, afterId], setPair] = useState<[string, string]>(() => pairFor(startProject.id, initialAfter));
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

  const changeProject = (pid: string) => {
    setProjectId(pid);
    setPair(pairFor(pid));
    router.replace(`/compare?project=${projects.find((p) => p.id === pid)?.slug}`, { scroll: false });
  };

  const project = projects.find((p) => p.id === projectId)!;

  return (
    <div className="space-y-6">
      <Panel className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-end">
          <label className="space-y-1.5">
            <span className="label-mono">Project</span>
            <Select value={projectId} onChange={(e) => changeProject(e.target.value)}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </label>
          <label className="space-y-1.5">
            <span className="label-mono">Before</span>
            <Select value={beforeId} onChange={(e) => setPair([e.target.value, afterId])}>
              {list.map((a) => <option key={a.id} value={a.id} disabled={a.id === afterId}>{fmtDate(a.date)} — {a.title}</option>)}
            </Select>
          </label>
          <label className="space-y-1.5">
            <span className="label-mono">After</span>
            <Select value={afterId} onChange={(e) => setPair([beforeId, e.target.value])}>
              {list.map((a) => <option key={a.id} value={a.id} disabled={a.id === beforeId}>{fmtDate(a.date)} — {a.title}</option>)}
            </Select>
          </label>
          <div className="flex rounded-md border border-line-strong p-0.5">
            {([["side", Columns2, "Side by side"], ["slider", SplitSquareHorizontal, "Slider"]] as const).map(([m, Icon, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn("flex h-9 items-center gap-1.5 rounded-[5px] px-3 text-[12.5px] transition-colors", mode === m ? "bg-tint/10 text-foreground" : "text-muted hover:text-foreground")}
              >
                <Icon className="size-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {before && after ? (
        <div className="page-in" key={`${beforeId}-${afterId}-${mode}`}>
          <BeforeAfter before={before} after={after} mode={mode} />
        </div>
      ) : (
        <EmptyState icon={Eye} title="Select two assets to compare" description="Choose a before and an after asset from the same project." />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel>
          <PanelHeader
            eyebrow="Based on uploaded media"
            title={<span className="flex items-center gap-2"><Sparkles className="size-4 text-accent" /> Comparison insights</span>}
            action={result && !loading && <span className="font-mono text-[11px] text-subtle">{result.engine}</span>}
          />
          <div className="p-5">
            {loading && (
              <div className="space-y-3">
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
                <p className="text-[14px] leading-relaxed text-soft">{result.summary}</p>
                <div className="label-mono mb-2 mt-5">Observed changes</div>
                <ul className="space-y-2">
                  {result.observations.map((o) => (
                    <li key={o} className="flex gap-2.5 text-[13.5px] leading-relaxed">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
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
              {!result && <div className="skeleton h-6 w-40 rounded" />}
            </div>
            <div className="mt-6 flex items-end justify-between">
              <div>
                <div className="label-mono">Comparison confidence</div>
                <div className="mt-1 text-[32px] font-semibold tabular-nums">{result ? pct(result.confidence) : "—"}</div>
              </div>
              <div className="mb-2 h-1.5 w-32 overflow-hidden rounded-full bg-tint/[0.06]">
                <div className="h-full bg-accent transition-[width] duration-500" style={{ width: result ? pct(result.confidence) : "0%" }} />
              </div>
            </div>
          </Panel>
          <Panel className="p-5">
            <div className="flex items-center gap-2 text-[13px] font-medium"><Info className="size-4 text-warning" /> Verification notes</div>
            <ul className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-muted">
              {(result?.caveats ?? []).map((c) => <li key={c}>{c}</li>)}
            </ul>
            <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
              <Link href={`/reports?project=${project.slug}`}><FileText /> Add to impact report</Link>
            </Button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
