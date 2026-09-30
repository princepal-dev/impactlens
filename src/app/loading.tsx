export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-6 rounded-2xl bg-hero p-5 lg:p-6">
        <div className="h-7 w-56 rounded-full bg-white/10" />
        <div className="mt-2.5 h-4 w-96 max-w-full rounded-full bg-white/[0.06]" />
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={i === 0 ? "h-[124px] rounded-2xl bg-lime/30" : "h-[124px] rounded-2xl bg-white/[0.05]"} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-panel p-2">
            <div className="skeleton aspect-[3/2] rounded-xl" />
            <div className="skeleton mx-1.5 mt-3 h-4 w-3/4 rounded-full" />
            <div className="skeleton mx-1.5 mb-1.5 mt-2 h-3 w-1/2 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
