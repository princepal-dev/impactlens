"use client";

import { AlertTriangle, Download, FileText, History, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { requestJSON } from "@/lib/http";
import type { MediaAsset, Project, ReportContent } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import { ProcessingStatus, type StepState } from "./ProcessingStatus";
import { ReportPreview } from "./ReportPreview";
import { Button } from "./ui/button";
import { Panel, Select } from "./ui/panel";

const STEPS = ["Analyzing project evidence…", "Grouping media…", "Comparing before/after evidence…", "Extracting impact themes…", "Building report…"];
/** Every month from the earliest evidence to the current month (inclusive). */
function monthRange(dates: string[]) {
  const now = new Date().toISOString().slice(0, 7);
  const valid = dates.filter((d) => /^\d{4}-\d{2}/.test(d)).map((d) => d.slice(0, 7));
  const start = valid.length ? valid.reduce((m, d) => (d < m ? d : m)) : now;
  const end = valid.length ? valid.reduce((m, d) => (d > m ? d : m), now) : now;
  const out: string[] = [];
  const cursor = new Date(`${start}-01T00:00:00Z`);
  while (cursor.toISOString().slice(0, 7) <= end) {
    out.push(cursor.toISOString().slice(0, 7));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return out;
}
const monthLabel = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const lastDay = (m: string) => new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7), 0)).toISOString().slice(0, 10);

export function ReportsWorkspace({
  projects,
  assets,
  history: initialHistory,
}: {
  projects: Project[];
  assets: Record<string, MediaAsset>;
  history: ReportContent[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [projectId, setProjectId] = useState(projects.find((p) => p.slug === params.get("project"))?.id ?? projects[0].id);
  const [months] = useState(() => monthRange(Object.values(assets).map((a) => a.date)));
  const [from, setFrom] = useState(months[0]);
  const [to, setTo] = useState(months[months.length - 1]);
  const [step, setStep] = useState(-1);
  const [report, setReport] = useState<ReportContent | null>(() => initialHistory.find((r) => r.id === params.get("id")) ?? null);
  const [history, setHistory] = useState(initialHistory);
  const [error, setError] = useState<string | null>(null);
  const autoRan = useRef(false);
  const busy = step >= 0 && step < STEPS.length;

  const generate = useCallback(async () => {
    setError(null);
    setReport(null);
    setStep(0);
    const request = requestJSON<ReportContent>("/api/report", {
      method: "POST",
      json: { projectId, from: `${from}-01`, to: lastDay(to) },
      timeoutMs: 120_000,
    });
    try {
      for (let i = 1; i < STEPS.length; i++) {
        await new Promise((r) => setTimeout(r, 650));
        setStep(i);
      }
      const res = await request;
      if (!res.ok) throw new Error(res.error);
      const r = res.data;
      await new Promise((done) => setTimeout(done, 400));
      setStep(STEPS.length);
      setReport(r);
      setHistory((h) => [r, ...h]);
      router.replace(`/reports?id=${r.id}`, { scroll: false });
      toast.success("Impact report generated", { description: r.project });
      setTimeout(() => document.getElementById("report-top")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      const message = e instanceof Error && e.message ? e.message : "Report generation failed. Try again.";
      setStep(-1);
      setError(message);
      toast.error("Report generation failed", { description: message });
    }
  }, [projectId, from, to, router]);

  useEffect(() => {
    if (params.get("auto") === "1" && !autoRan.current) {
      autoRan.current = true;
      generate();
    }
  }, [params, generate]);

  async function removeReport(id: string) {
    const res = await requestJSON(`/api/report?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Could not delete report", { description: res.error });
    setHistory((h) => h.filter((r) => r.id !== id));
    if (report?.id === id) {
      setReport(null);
      router.replace("/reports", { scroll: false });
    }
    toast.success("Report deleted");
  }

  const states = STEPS.map((label, i): { label: string; state: StepState } => ({
    label,
    state: step > i ? "done" : step === i ? "active" : "pending",
  }));

  return (
    <div className="space-y-8">
      <div className="no-print grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <Panel className="p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <label className="space-y-1.5">
              <span className="label-mono">Project</span>
              <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={busy}>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </label>
            <label className="space-y-1.5">
              <span className="label-mono">From</span>
              <Select value={from} onChange={(e) => setFrom(e.target.value)} disabled={busy}>
                {months.map((m) => <option key={m} value={m} disabled={m > to}>{monthLabel(m)}</option>)}
              </Select>
            </label>
            <label className="space-y-1.5">
              <span className="label-mono">To</span>
              <Select value={to} onChange={(e) => setTo(e.target.value)} disabled={busy}>
                {months.map((m) => <option key={m} value={m} disabled={m < from}>{monthLabel(m)}</option>)}
              </Select>
            </label>
            <label className="space-y-1.5">
              <span className="label-mono">Scope</span>
              <Select defaultValue="all" disabled={busy}>
                <option value="all">All project media</option>
              </Select>
            </label>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <p className="text-[12.5px] text-muted">
              Reports use only uploaded evidence. No impact statistics are inferred beyond what is visible.
            </p>
            <Button variant="primary" onClick={generate} disabled={busy}>
              <Sparkles /> {busy ? "Generating…" : "Generate Report"}
            </Button>
          </div>

          {(busy || step === STEPS.length) && !report && (
            <div className="page-in mt-6 border-t border-line pt-6">
              <ProcessingStatus steps={states} />
            </div>
          )}
          {error && (
            <div className="mt-6 flex items-center justify-between gap-3 rounded-md border border-warning/30 bg-warning/5 px-4 py-3 text-[13px]">
              <span className="flex items-center gap-2 text-warning"><AlertTriangle className="size-4" /> {error}</span>
              <Button size="sm" onClick={generate}><RotateCcw /> Try again</Button>
            </div>
          )}
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center gap-2 text-[13px] font-medium"><History className="size-4 text-subtle" /> Recent reports</div>
          {history.length ? (
            <ul className="scrollbar-thin mt-3 max-h-56 space-y-1 overflow-auto">
              {history.map((r) => (
                <li key={r.id} className="group relative">
                  <button
                    onClick={() => {
                      setReport(r);
                      setStep(-1);
                      router.replace(`/reports?id=${r.id}`, { scroll: false });
                    }}
                    className={cn(
                      "w-full rounded-md px-2.5 py-2 pr-9 text-left transition-colors hover:bg-white/[0.04]",
                      report?.id === r.id && "bg-white/[0.06]",
                    )}
                  >
                    <div className="truncate text-[13px]">{r.project}</div>
                    <div className="font-mono text-[11px] text-subtle">#{r.id} · {timeAgo(r.generatedAt)}</div>
                  </button>
                  <button
                    onClick={() => removeReport(r.id)}
                    aria-label={`Delete report ${r.id}`}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-subtle opacity-0 transition-all hover:bg-danger/10 hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[12.5px] text-subtle">Generated reports will appear here.</p>
          )}
        </Panel>
      </div>

      <div id="report-top" className="scroll-mt-6">
        {report ? (
          <div className="page-in">
            <div className="no-print mb-4 flex items-center justify-between">
              <div className="label-mono">Report preview</div>
              <Button variant="secondary" onClick={() => window.print()}>
                <Download /> Export Report
              </Button>
            </div>
            <ReportPreview report={report} assets={assets} />
          </div>
        ) : (
          !busy && (
            <EmptyState
              className="no-print"
              icon={FileText}
              title="No report generated yet"
              description="Select a project and reporting period, then generate a traceable impact evidence report in one click."
            />
          )
        )}
      </div>
    </div>
  );
}
