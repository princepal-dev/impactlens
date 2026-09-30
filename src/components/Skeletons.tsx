import { cn } from "@/lib/utils";

const bar = "rounded-full bg-white/10";

/** Placeholder for the dark hero band at the top of every page. */
export function HeroSkeleton({ stats = true, search = false }: { stats?: boolean; search?: boolean }) {
  return (
    <div className="mb-6 rounded-2xl bg-hero p-5 lg:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className={cn(bar, "h-7 w-56")} />
          <div className="mt-2.5 h-4 w-96 max-w-full rounded-full bg-white/[0.06]" />
        </div>
        <div className="hidden gap-2 lg:flex">
          <div className="h-10 w-32 rounded-full bg-white/[0.06]" />
          <div className="h-10 w-36 rounded-full bg-lime/30" />
        </div>
      </div>
      {search && <div className="mt-5 h-14 rounded-2xl bg-white/[0.07]" />}
      {stats && (
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={cn("h-[124px] rounded-2xl", i === 0 ? "bg-lime/30" : "bg-white/[0.05]")} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CardGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-2xl border border-line bg-panel p-2">
          <div className="skeleton aspect-[3/2] rounded-xl" />
          <div className="skeleton mx-1.5 mt-3 h-4 w-3/4 rounded-full" />
          <div className="skeleton mx-1.5 mb-1.5 mt-2 h-3 w-1/2 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function PanelSkeleton({ rows = 3, className, media }: { rows?: number; className?: string; media?: boolean }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-panel p-5 shadow-[var(--panel-shadow)]", className)}>
      <div className="skeleton h-4 w-40 rounded-full" />
      {media && <div className="skeleton mt-4 aspect-[16/9] rounded-xl" />}
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton size-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="skeleton h-3.5 rounded-full" style={{ width: `${80 - ((i * 13) % 35)}%` }} />
              <div className="skeleton h-3 w-1/3 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChipRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton h-9 rounded-full" style={{ width: `${72 + ((i * 29) % 60)}px` }} />
      ))}
      <div className="skeleton ml-auto h-9 w-44 rounded-full" />
    </div>
  );
}

/** Wrapper announcing the loading state to assistive technology. */
export function Loading({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div aria-busy="true" aria-label={label} role="status">
      {children}
    </div>
  );
}
