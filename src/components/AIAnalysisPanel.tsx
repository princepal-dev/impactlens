"use client";

import { Braces, Sparkles } from "lucide-react";
import { useState } from "react";
import type { MediaAsset } from "@/lib/types";
import { cn, fmtDate, pct } from "@/lib/utils";
import { ImpactBadge, StageBadge } from "./ImpactBadge";
import { Tag } from "./ui/badge";

export function AIAnalysisPanel({ asset, compact }: { asset: MediaAsset; compact?: boolean }) {
  const [raw, setRaw] = useState(false);
  const json = {
    title: asset.title,
    description: asset.description,
    project: asset.project,
    location: asset.location,
    category: asset.category,
    activity: asset.activity,
    tags: asset.tags,
    impactAreas: asset.impactAreas,
    peopleCount: asset.peopleCount,
    objects: asset.objects,
    stage: asset.stage,
    confidence: asset.confidence,
    date: asset.date,
    beforeAfterCandidate: asset.beforeAfterCandidate,
  };

  const fields: [string, React.ReactNode][] = [
    ["Project", asset.project],
    ["Location", asset.location],
    ["Category", asset.category],
    ["Activity", asset.activity],
    ["Stage", <StageBadge key="s" stage={asset.stage} />],
    ["Capture date", fmtDate(asset.date)],
    ["People visible", asset.peopleCount ?? "Not countable"],
    ["Before/after candidate", asset.beforeAfterCandidate ? "Yes" : "No"],
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-accent" />
          <span className="whitespace-nowrap text-[13px] font-medium">AI-generated evidence metadata</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-subtle">Confidence</span>
          <div className="flex items-center gap-2">
            <div className="h-1 w-16 overflow-hidden rounded-full bg-tint/[0.08]">
              <div className="h-full bg-accent" style={{ width: pct(asset.confidence) }} />
            </div>
            <span className="text-[12.5px] font-semibold tabular-nums text-accent">{pct(asset.confidence)}</span>
          </div>
        </div>
      </div>

      {!compact && (
        <>
          <h3 className="mt-4 text-[18px] font-medium leading-snug">{asset.title}</h3>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{asset.description}</p>
        </>
      )}

      <dl className={cn("mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-[13px]", !compact && "rounded-md border border-line bg-tint/[0.015] p-4")}>
        {fields.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="label-mono mb-1">{k}</dt>
            <dd className="line-clamp-2 break-words leading-snug text-foreground" title={typeof v === "string" ? v : undefined}>{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 space-y-3">
        <div>
          <div className="label-mono mb-1.5">Searchable tags</div>
          <div className="flex flex-wrap gap-1">{asset.tags.map((t) => <Tag key={t}>{t}</Tag>)}</div>
        </div>
        <div>
          <div className="label-mono mb-1.5">Impact areas</div>
          <div className="flex flex-wrap gap-1.5">{asset.impactAreas.map((a) => <ImpactBadge key={a} area={a} />)}</div>
        </div>
        {asset.objects.length > 0 && (
          <div>
            <div className="label-mono mb-1.5">Objects detected</div>
            <div className="text-[13px] text-muted">{asset.objects.join(" · ")}</div>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-line pt-3">
        <span className="min-w-0 truncate text-[12px] text-subtle" title={asset.analysisEngine || undefined}>
          Analyzed by {asset.analysisEngine || "—"}
        </span>
        <button onClick={() => setRaw((r) => !r)} className="flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-muted transition-colors hover:text-accent">
          <Braces className="size-3.5" /> {raw ? "Hide" : "View"} JSON
        </button>
      </div>
      {raw && (
        <pre className="scrollbar-thin mt-3 max-h-72 overflow-auto rounded-md border border-line bg-inset p-3 font-mono text-[11.5px] leading-relaxed text-soft">
          {JSON.stringify(json, null, 2)}
        </pre>
      )}
    </div>
  );
}
