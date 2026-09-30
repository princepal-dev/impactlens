import type { LucideIcon } from "lucide-react";
import { NumberTicker } from "./aceternity/number-ticker";
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
    <Panel className="glow-card group relative overflow-hidden p-5 transition-colors hover:border-line-strong">
      <div className="flex items-center justify-between">
        <span className="label-mono">{label}</span>
        <Icon className="size-4 text-subtle transition-colors group-hover:text-accent" />
      </div>
      <NumberTicker value={value} className="mt-5 block text-[34px] font-semibold leading-none tracking-tight tabular-nums" />
      <div className="mt-3 flex items-center gap-2 text-[12.5px] text-muted">
        {trend && <span className="whitespace-nowrap text-[12px] font-medium text-positive">{trend}</span>}
        <span>{hint}</span>
      </div>
    </Panel>
  );
}
