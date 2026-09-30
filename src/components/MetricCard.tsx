import type { LucideIcon } from "lucide-react";
import { Panel } from "./ui/panel";

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  trend?: string;
}) {
  return (
    <Panel className="group relative overflow-hidden p-5 transition-colors hover:border-line-strong">
      <div className="flex items-center justify-between">
        <span className="label-mono">{label}</span>
        <Icon className="size-4 text-subtle transition-colors group-hover:text-accent" />
      </div>
      <div className="mt-5 text-[34px] font-semibold leading-none tracking-tight tabular-nums">{value}</div>
      <div className="mt-3 flex items-center gap-2 text-[12.5px] text-muted">
        {trend && <span className="whitespace-nowrap font-mono text-[11px] text-positive">{trend}</span>}
        <span>{hint}</span>
      </div>
    </Panel>
  );
}
