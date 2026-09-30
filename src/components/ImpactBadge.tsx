import { Droplets, Leaf, Sun, Users, GraduationCap, HeartPulse, Building, Recycle, CloudSun, Sprout } from "lucide-react";
import { cn, STAGE_STYLES } from "@/lib/utils";

const ICONS: [RegExp, typeof Leaf][] = [
  [/water|sanitation|wash/i, Droplets],
  [/energy|solar/i, Sun],
  [/education/i, GraduationCap],
  [/health/i, HeartPulse],
  [/infrastructure/i, Building],
  [/waste/i, Recycle],
  [/climate/i, CloudSun],
  [/biodiversity|agri/i, Sprout],
  [/community|gender|wellbeing/i, Users],
];

export function ImpactBadge({ area, className }: { area: string; className?: string }) {
  const Icon = ICONS.find(([re]) => re.test(area))?.[1] ?? Leaf;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[4px] border border-emerald-400/15 bg-emerald-400/[0.06] px-2 py-0.5 text-[11.5px] text-emerald-300/90",
        className,
      )}
    >
      <Icon className="size-3" />
      {area}
    </span>
  );
}

export function StageBadge({ stage }: { stage: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-[4px] border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider", STAGE_STYLES[stage])}>
      {stage}
    </span>
  );
}

export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const Icon = category.includes("Water") ? Droplets : category.includes("Energy") ? Sun : Leaf;
  return <Icon className={className} />;
}
