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
    <Panel className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-muted">{label}</span>
        <Icon className="size-4 text-subtle" />
      </div>
      <div className="mt-3 text-[28px] font-semibold leading-none tracking-tight tabular-nums">{value}</div>
      <div className="mt-2.5 flex items-center gap-2 text-[12.5px] text-subtle">
        {trend && <span className="whitespace-nowrap font-medium text-positive">{trend}</span>}
        <span>{hint}</span>
      </div>
    </Panel>
  );
}
