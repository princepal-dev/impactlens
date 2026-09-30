"use client";

import { AlertTriangle, Brain, ChevronDown, Cpu, Link2, ScanSearch, SearchX, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useRef } from "react";
import { requestJSON } from "@/lib/http";
import type { SearchResponse } from "@/lib/types";
import { cn, fmtDate } from "@/lib/utils";
import { NumberTicker } from "./aceternity/number-ticker";
import { EmptyState } from "./EmptyState";
import { MediaCardSkeleton } from "./MediaCard";
import { PageHero } from "./PageHero";
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
      <PageHero
        center
        icon={Sparkles}
        eyebrow="AI evidence search"
        title="Ask your evidence anything."
        subtitle="Plain-language questions become structured filters over every photo's AI metadata — or tap the mic and just say it."
      >
        <div className="mx-auto max-w-3xl text-left">
          <SearchBar value={q} onChange={setQ} onSubmit={run} loading={loading} />
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => run(s)}
                className={cn(
                  "rounded-full border px-3 py-1 text-[12.5px] backdrop-blur transition-colors",
                  q === s
                    ? "border-teal-300/50 bg-teal-300/15 text-teal-100"
                    : "border-white/10 bg-white/[0.04] text-white/65 hover:border-white/25 hover:text-white",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </PageHero>

      <div>
        {loading && (
          <div>
            <div className="mb-6 flex items-center gap-2 text-[13px] text-accent">
              <Sparkles className="size-4 animate-pulse" /> Interpreting query and searching evidence…
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
            <Panel className="relative mb-6 overflow-hidden">
              <div aria-hidden className="pointer-events-none absolute -left-16 -top-20 size-56 rounded-full bg-accent/10 blur-3xl" />
              <div className="relative flex flex-col gap-5 p-5 lg:flex-row lg:items-center">
                <div className="flex shrink-0 items-center gap-3 lg:w-52">
                  <div className="grid size-10 place-items-center rounded-xl border border-accent/30 bg-gradient-to-b from-accent/25 to-accent/5">
                    <Sparkles className="size-[18px] text-accent" />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-semibold">AI understood</div>
                    <div className="text-[12px] text-subtle">your question as</div>
                  </div>
                </div>
                <div className="flex flex-1 flex-wrap gap-2">
                  {chips.filter(([, v]) => v).map(([k, v], i) => (
                    <span
                      key={k}
                      className="page-in inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/[0.07] py-1 pl-2.5 pr-3 text-[12.5px]"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <span className="text-subtle">{k}</span>
                      <span className="font-medium capitalize text-foreground">{v}</span>
                    </span>
                  ))}
                  {it?.keywords.map((kw, i) => (
                    <span
                      key={kw}
                      className="page-in inline-flex items-center rounded-full border border-line bg-tint/[0.03] px-2.5 py-1 text-[12.5px] text-soft"
                      style={{ animationDelay: `${(chips.length + i) * 60}ms` }}
                    >
                      #{kw}
                    </span>
                  ))}
                  {!chips.some(([, v]) => v) && !it?.keywords.length && <span className="text-[13px] text-muted">A broad search across all evidence.</span>}
                </div>
                <div className="shrink-0 border-line lg:border-l lg:pl-6 lg:text-right">
                  <div className="text-[30px] font-semibold leading-none tabular-nums">
                    <NumberTicker value={String(data.results.length)} />
                  </div>
                  <div className="mt-1 text-[12px] text-muted">matching assets</div>
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {([
              [Brain, "Understands intent", "Extracts project type, location, stage and dates from plain language — typed or spoken."],
              [ScanSearch, "Searches AI metadata", "Matches tags, objects and activities that vision AI generated from every asset."],
              [Link2, "Always traceable", "Every result links back to the original Cloudinary asset and its analysis."],
            ] as const).map(([Icon, t, d], i) => (
              <Panel key={t} className="glow-card relative overflow-hidden p-5">
                <div className="flex items-center justify-between">
                  <div className="grid size-10 place-items-center rounded-xl border border-accent/25 bg-gradient-to-b from-accent/20 to-accent/5">
                    <Icon className="size-[18px] text-accent" />
                  </div>
                  <span className="text-[28px] font-semibold tabular-nums text-tint/[0.08]">0{i + 1}</span>
                </div>
                <div className="mt-4 text-[14.5px] font-semibold tracking-tight">{t}</div>
                <div className="mt-1.5 text-[13px] leading-relaxed text-muted">{d}</div>
              </Panel>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
