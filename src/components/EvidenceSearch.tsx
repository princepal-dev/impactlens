"use client";

import { AlertTriangle, ChevronDown, Cpu, Loader2, SearchX } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useRef } from "react";
import { requestJSON } from "@/lib/http";
import type { SearchResponse } from "@/lib/types";
import { cn, fmtDate } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import { MediaCardSkeleton } from "./MediaCard";
import { PageHeader } from "./PageHeader";
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
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);
  const [inspector, setInspector] = useState(false);

  const run = useCallback(
    async (query: string) => {
      setQ(query);
      setLoading(true);
      setError(null);
      const id = ++latest.current;
      router.replace(`/search?q=${encodeURIComponent(query)}`, { scroll: false });
      const res = await requestJSON<SearchResponse>("/api/search", { method: "POST", json: { query }, timeoutMs: 60_000 });
      if (id !== latest.current) return;
      if (res.ok) setData(res.data);
      else {
        setError(res.error);
        setData(null);
      }
      setLoading(false);
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
      <PageHeader title="Evidence Search" subtitle="Ask in plain language, or use the mic. The query is turned into filters over every asset's AI metadata.">
        <div className="max-w-4xl">
          <SearchBar value={q} onChange={setQ} onSubmit={run} loading={loading} />
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[12.5px] text-subtle">Try</span>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => run(s)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-[12.5px] transition-colors",
                  q === s ? "border-line-strong bg-tint/[0.06] text-foreground" : "border-line text-muted hover:border-line-strong hover:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </PageHeader>

      <div>
        {loading && (
          <div>
            <div className="mb-6 flex items-center gap-2 text-[13px] text-muted">
              <Loader2 className="size-3.5 animate-spin" /> Searching evidence…
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => <MediaCardSkeleton key={i} />)}
            </div>
          </div>
        )}

        {!loading && error && (
          <EmptyState
            tone="error"
            icon={AlertTriangle}
            title="Search is temporarily unavailable"
            description={error}
            action={<Button size="sm" onClick={() => run(q)}>Try again</Button>}
          />
        )}

        {!loading && data && (
          <div className="page-in">
            <Panel className="mb-6 overflow-hidden">
              <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center">
                <div className="shrink-0 text-[13px] text-muted lg:w-32">Interpreted as</div>
                <div className="flex flex-1 flex-wrap gap-1.5">
                  {chips.filter(([, v]) => v).map(([k, v]) => (
                    <span key={k} className="inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-[12.5px]">
                      <span className="text-subtle">{k}</span>
                      <span className="font-medium capitalize text-foreground">{v}</span>
                    </span>
                  ))}
                  {it?.keywords.map((kw) => (
                    <span key={kw} className="inline-flex items-center rounded-md bg-tint/[0.05] px-2 py-1 text-[12.5px] text-soft">{kw}</span>
                  ))}
                  {!chips.some(([, v]) => v) && !it?.keywords.length && <span className="text-[13px] text-muted">A broad search across all evidence.</span>}
                </div>
                <div className="shrink-0 text-[13px] text-muted">
                  <span className="font-semibold tabular-nums text-foreground">{data.results.length}</span> {data.results.length === 1 ? "result" : "results"}
                </div>
              </div>
              <button
                onClick={() => setInspector((v) => !v)}
                className="flex w-full items-center gap-2 border-t border-line px-5 py-2.5 text-[12px] text-subtle transition-colors hover:text-muted"
              >
                <Cpu className="size-3.5" /> Query inspector
                <span className="ml-auto">{data.diagnostics.ms} ms · {data.diagnostics.scanned} assets scanned</span>
                <ChevronDown className={cn("size-3.5 transition-transform", inspector && "rotate-180")} />
              </button>
              {inspector && (
                <div className="grid grid-cols-1 gap-4 border-t border-line bg-inset px-5 py-4 font-mono text-[11.5px] md:grid-cols-3">
                  <div><div className="text-subtle">interpreter</div><div className="mt-1 text-soft">{data.diagnostics.interpreter}</div></div>
                  <div><div className="text-subtle">ranking</div><div className="mt-1 text-soft">{data.diagnostics.ranking}</div></div>
                  <div>
                    <div className="text-subtle">filters{data.diagnostics.relaxed && " (relaxed)"}</div>
                    <div className="mt-1 space-y-0.5 text-soft">
                      {data.diagnostics.filtersApplied.length ? data.diagnostics.filtersApplied.map((f) => <div key={f}>{f}</div>) : "none"}
                    </div>
                  </div>
                </div>
              )}
            </Panel>

            {data.results.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {data.results.map((r, i) => <SearchResultCard key={r.asset.id} result={r} rank={i} />)}
              </div>
            ) : (
              <EmptyState icon={SearchX} title="No matching evidence found" description="Try another query — for example a project type, place or activity." />
            )}
          </div>
        )}

        {!loading && !data && !error && (
          <div className="max-w-4xl space-y-2 text-[13px] leading-relaxed text-muted">
            <p>Search understands project type, place, stage and dates — for example “tree plantation in Delhi after March 2026”.</p>
            <p>Every result links back to its original Cloudinary asset and the AI analysis behind the match.</p>
          </div>
        )}
      </div>
    </div>
  );
}
