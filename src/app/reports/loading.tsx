import { HeroSkeleton, Loading, PanelSkeleton } from "@/components/Skeletons";

export default function ReportsLoading() {
  return (
    <Loading label="Loading reports">
      <HeroSkeleton />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-line bg-panel p-5">
          <div className="skeleton h-4 w-28 rounded-full" />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton h-3 w-16 rounded-full" />
                <div className="skeleton h-10 rounded-xl" />
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end border-t border-line pt-4">
            <div className="skeleton h-10 w-40 rounded-full" />
          </div>
        </div>
        <PanelSkeleton rows={3} />
      </div>
      <div className="skeleton mt-8 h-[520px] rounded-2xl" />
    </Loading>
  );
}
