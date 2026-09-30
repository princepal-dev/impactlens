import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepState = "pending" | "active" | "done" | "error";

export function ProcessingStatus({
  steps,
  progress,
}: {
  steps: { label: string; detail?: string; state: StepState }[];
  progress?: number;
}) {
  return (
    <ol className="space-y-0">
      {steps.map((s, i) => (
        <li key={s.label} className="relative flex gap-3.5 pb-5 last:pb-0">
          {i < steps.length - 1 && (
            <span className={cn("absolute left-[11px] top-6 h-[calc(100%-20px)] w-px", s.state === "done" ? "bg-accent/40" : "bg-line")} />
          )}
          <span
            className={cn(
              "relative z-10 mt-0.5 grid size-[23px] shrink-0 place-items-center rounded-full border transition-colors duration-300",
              s.state === "done" && "border-accent/50 bg-accent/15 text-accent",
              s.state === "active" && "border-accent/60 bg-background text-accent",
              s.state === "pending" && "border-line-strong bg-background text-subtle",
              s.state === "error" && "border-danger/50 bg-danger/10 text-danger",
            )}
          >
            {s.state === "done" && <Check className="size-3" strokeWidth={3} />}
            {s.state === "active" && <Loader2 className="size-3 animate-spin" />}
            {s.state === "error" && <X className="size-3" strokeWidth={3} />}
            {s.state === "pending" && <span className="size-1 rounded-full bg-current" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className={cn("text-[13.5px] transition-colors", s.state === "pending" ? "text-subtle" : "text-foreground")}>{s.label}</div>
            {s.detail && <div className="mt-0.5 truncate text-[12px] text-subtle">{s.detail}</div>}
            {s.state === "active" && i === 0 && progress !== undefined && (
              <div className="mt-2 h-1 w-full max-w-xs overflow-hidden rounded-full bg-tint/[0.06]">
                <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
