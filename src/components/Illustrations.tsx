import { cn } from "@/lib/utils";

function Scene({ after, className }: { after?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-line-strong shadow-xl",
        after ? "bg-gradient-to-b from-sky-400/40 to-sky-200/10" : "bg-gradient-to-b from-stone-400/40 to-amber-200/10",
        className,
      )}
    >
      <svg viewBox="0 0 160 110" className="absolute inset-0 size-full" preserveAspectRatio="none">
        <path d="M0 70 Q40 48 80 66 T160 58 V110 H0Z" className={after ? "fill-emerald-500/60" : "fill-amber-700/45"} />
        <path d="M0 86 Q50 72 100 84 T160 80 V110 H0Z" className={after ? "fill-emerald-700/70" : "fill-stone-600/50"} />
        {after && (
          <>
            <circle cx="36" cy="64" r="7" className="fill-emerald-400/80" />
            <circle cx="58" cy="70" r="5" className="fill-emerald-300/80" />
            <circle cx="118" cy="62" r="8" className="fill-emerald-400/80" />
            <rect x="84" y="72" width="22" height="8" rx="2" className="fill-sky-300/80" />
          </>
        )}
        <circle cx={after ? 130 : 128} cy="24" r="9" className={after ? "fill-amber-200/90" : "fill-orange-200/70"} />
      </svg>
      <span
        className={cn(
          "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider",
          after ? "bg-accent text-accent-foreground" : "bg-black/60 text-white/85",
        )}
      >
        {after ? "After" : "Before"}
      </span>
    </div>
  );
}

export function CompareIllustration() {
  return (
    <div className="relative h-[132px] w-[300px]">
      <Scene className="absolute left-2 top-3 h-[110px] w-[150px] -rotate-6" />
      <Scene after className="absolute right-2 top-3 h-[110px] w-[150px] rotate-6" />
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-accent to-transparent" />
      <div className="absolute left-1/2 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-accent/50 bg-surface shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_45%,transparent)]">
        <svg viewBox="0 0 24 24" className="size-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" />
        </svg>
      </div>
    </div>
  );
}

export function ReportIllustration() {
  return (
    <div className="relative h-[168px] w-[240px]">
      <div className="absolute left-10 top-3 h-[150px] w-[130px] -rotate-6 rounded-xl border border-line bg-surface-raised shadow-lg" />
      <div className="absolute left-[62px] top-0 h-[160px] w-[140px] rotate-3 overflow-hidden rounded-xl border border-line-strong bg-surface shadow-2xl">
        <div className="relative h-[62px] overflow-hidden bg-[#06110f] p-2.5">
          <div className="absolute -right-6 -top-8 size-20 rounded-full bg-teal-400/30 blur-xl" />
          <div className="h-1.5 w-10 rounded-full bg-teal-300/70" />
          <div className="mt-2 h-2 w-24 rounded-full bg-white/80" />
          <div className="mt-1 h-2 w-16 rounded-full bg-white/50" />
          <div className="mt-2.5 flex gap-1">
            {[0, 1, 2].map((i) => <div key={i} className="h-3 w-7 rounded-sm border border-white/15 bg-white/10" />)}
          </div>
        </div>
        <div className="space-y-1.5 p-2.5">
          {["w-11/12", "w-4/5", "w-3/5"].map((w) => <div key={w} className={cn("h-1.5 rounded-full bg-tint/15", w)} />)}
          <div className="flex items-end gap-1 pt-2">
            {[40, 65, 50, 85, 70].map((h, i) => (
              <div key={i} className="w-4 rounded-sm bg-gradient-to-t from-accent/40 to-accent" style={{ height: `${h * 0.34}px` }} />
            ))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-2 right-3 grid size-9 place-items-center rounded-full border border-accent/50 bg-surface shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_45%,transparent)]">
        <svg viewBox="0 0 24 24" className="size-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l1.9 5.8L20 10l-5 3.6L16.5 20 12 16.5 7.5 20 9 13.6 4 10l6.1-1.2z" />
        </svg>
      </div>
    </div>
  );
}
