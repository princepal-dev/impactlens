"use client";

import { AlertTriangle, ChevronDown, Cpu, SearchX, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { SearchResponse } from "@/lib/types";
import { cn, fmtDate } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import { MediaCardSkeleton } from "./MediaCard";
import { SearchBar } from "./SearchBar";
import { SearchResultCard } from "./SearchResultCard";
import { Button } from "./ui/button";
import { Panel } from "./ui/panel";

const SUGGESTIONS = [
  "Water projects in Rajasthan",
  "Solar installations",
  "Before/after road development",
  "Projects involving schools",
  "Evidence of tree plantation",
  "Renewable energy projects",
  "Completed projects in 2026",
];

export function EvidenceSearch() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState(false);
  const [inspector, setInspector] = useState(false);

  const run = useCallback(
    async (query: string) => {
      setQ(query);
      setLoading(true);
      setError(false);
      router.replace(`/search?q=${encodeURIComponent(query)}`, { scroll: false });
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        if (!res.ok) throw new Error();
        setData(await res.json());
      } catch {
        setError(true);
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    if (!initial) return;
    const t = setTimeout(() => run(initial), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const it = data?.interpretation;
  const chips: [string, string | undefined][] = it
    ? [
        ["Project type", it.category],
        ["Location", it.location],
        ["Activity", it.activity],
        ["Project", it.project],
        ["Stage", it.stage],
        ["After", it.dateAfter && fmtDate(it.dateAfter)],
        ["Before", it.dateBefore && fmtDate(it.dateBefore)],
        ["Evidence type", it.beforeAfter ? "Before / after" : undefined],
      ]
    : [];

  return (
    <div>
      <div className="mx-auto max-w-3xl">
        <SearchBar value={q} onChange={setQ} onSubmit={run} loading={loading} />
        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => run(s)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-[12.5px] transition-colors",
                q === s ? "border-accent/40 bg-accent/10 text-accent" : "border-line text-muted hover:border-line-strong hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12">
        {loading && (
          <div>
            <div className="mb-6 flex items-center gap-2 text-[13px] text-accent">
              <Sparkles className="size-4 animate-pulse" /> Interpreting query and searching evidence…
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <MediaCardSkeleton key={i} />)}
            </div>
          </div>
        )}

        {!loading && error && (
          <EmptyState
            tone="error"
            icon={AlertTriangle}
            title="Search is temporarily unavailable"
            description="Something went wrong while searching. Try again."
            action={<Button size="sm" onClick={() => run(q)}>Try again</Button>}
          />
        )}

        {!loading && data && (
          <div className="page-in">
            <Panel className="mb-6 overflow-hidden">
              <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
                <div className="flex shrink-0 items-center gap-2 lg:w-48">
                  <Sparkles className="size-4 text-accent" />
                  <span className="text-[13px] font-medium">AI interpretation</span>
                </div>
                <div className="flex flex-1 flex-wrap gap-x-8 gap-y-3">
                  {chips.filter(([, v]) => v).map(([k, v]) => (
                    <div key={k}>
                      <div className="label-mono">{k}</div>
                      <div className="mt-0.5 text-[14px] capitalize text-foreground">{v}</div>
                    </div>
                  ))}
                  {it && it.keywords.length > 0 && (
                    <div>
                      <div className="label-mono">Visual concepts</div>
                      <div className="mt-0.5 text-[14px] text-foreground">{it.keywords.join(", ")}</div>
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[22px] font-semibold tabular-nums">{data.results.length}</div>
                  <div className="text-[12px] text-muted">matching assets</div>
                </div>
              </div>
              <button
                onClick={() => setInspector((v) => !v)}
                className="flex w-full items-center gap-2 border-t border-line px-5 py-2.5 font-mono text-[11px] text-subtle transition-colors hover:text-muted"
              >
                <Cpu className="size-3.5" /> Query inspector
                <span className="ml-auto">{data.diagnostics.ms} ms · {data.diagnostics.scanned} assets scanned</span>
                <ChevronDown className={cn("size-3.5 transition-transform", inspector && "rotate-180")} />
              </button>
              {inspector && (
                <div className="grid grid-cols-1 gap-4 border-t border-line bg-black/30 px-5 py-4 font-mono text-[11.5px] md:grid-cols-3">
                  <div><div className="text-subtle">interpreter</div><div className="mt-1 text-zinc-300">{data.diagnostics.interpreter}</div></div>
                  <div><div className="text-subtle">ranking</div><div className="mt-1 text-zinc-300">{data.diagnostics.ranking}</div></div>
                  <div>
                    <div className="text-subtle">filters{data.diagnostics.relaxed && " (relaxed)"}</div>
                    <div className="mt-1 space-y-0.5 text-zinc-300">
                      {data.diagnostics.filtersApplied.length ? data.diagnostics.filtersApplied.map((f) => <div key={f}>{f}</div>) : "none"}
                    </div>
                  </div>
                </div>
              )}
            </Panel>

            {data.results.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.results.map((r, i) => <SearchResultCard key={r.asset.id} result={r} rank={i} />)}
              </div>
            ) : (
              <EmptyState icon={SearchX} title="No matching evidence found" description="Try another query — for example a project type, place or activity." />
            )}
          </div>
        )}

        {!loading && !data && !error && (
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-3 md:grid-cols-3">
            {[
              ["Understands intent", "Extracts project type, location, stage and dates from plain language."],
              ["Searches AI metadata", "Matches tags, objects and activities generated from every asset."],
              ["Always traceable", "Every result links back to the original Cloudinary asset."],
            ].map(([t, d], i) => (
              <Panel key={t} className="p-4">
                <div className="font-mono text-[11px] text-accent">0{i + 1}</div>
                <div className="mt-2 text-[13.5px] font-medium">{t}</div>
                <div className="mt-1 text-[12.5px] leading-relaxed text-muted">{d}</div>
              </Panel>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
