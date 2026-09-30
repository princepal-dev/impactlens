import { HeroSkeleton, Loading, PanelSkeleton } from "@/components/Skeletons";

export default function CompareLoading() {
  return (
    <Loading label="Loading comparison">
      <HeroSkeleton />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-line bg-panel p-3">
          <div className="mb-3 flex gap-2">
            <div className="skeleton h-10 flex-1 rounded-xl" />
            <div className="skeleton h-10 flex-1 rounded-xl" />
          </div>
          <div className="skeleton aspect-[16/10] rounded-xl" />
        </div>
        <PanelSkeleton rows={5} />
      </div>
    </Loading>
  );
}
