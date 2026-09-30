import { CardGridSkeleton, HeroSkeleton, Loading, PanelSkeleton } from "@/components/Skeletons";

export default function OverviewLoading() {
  return (
    <Loading label="Loading overview">
      <HeroSkeleton />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          <CardGridSkeleton count={4} className="grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4" />
          <CardGridSkeleton count={3} className="grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3" />
        </div>
        <PanelSkeleton rows={6} className="h-fit" />
      </div>
    </Loading>
  );
}
