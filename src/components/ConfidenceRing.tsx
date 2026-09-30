import { cn } from "@/lib/utils";

export function ConfidenceRing({
  value,
  size = 72,
  stroke = 6,
  label,
  className,
  tone = "accent",
}: {
  value: number | null;
  size?: number;
  stroke?: number;
  label?: string;
  className?: string;
  tone?: "accent" | "light";
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = value == null ? 0 : Math.max(0, Math.min(1, value));
  return (
    <div className={cn("relative grid shrink-0 place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={tone === "light" ? "stroke-white/10" : "stroke-tint/10"} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          className={cn("transition-[stroke-dashoffset] duration-1000 ease-out", tone === "light" ? "stroke-teal-300" : "stroke-accent")}
          style={{ filter: `drop-shadow(0 0 6px ${tone === "light" ? "rgba(94,234,212,0.6)" : "color-mix(in srgb, var(--accent) 60%, transparent)"})` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className={cn("font-semibold leading-none tabular-nums", size >= 80 ? "text-[20px]" : "text-[15px]", tone === "light" && "text-white")}>
            {value == null ? "—" : `${Math.round(v * 100)}%`}
          </div>
          {label && <div className={cn("mt-0.5 text-[9.5px] font-medium uppercase tracking-wider", tone === "light" ? "text-white/55" : "text-subtle")}>{label}</div>}
        </div>
      </div>
    </div>
  );
}
