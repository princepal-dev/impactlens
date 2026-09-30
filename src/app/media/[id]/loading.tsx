import { Loading, PanelSkeleton } from "@/components/Skeletons";

export default function AssetLoading() {
  return (
    <Loading label="Loading evidence">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="space-y-2.5">
          <div className="skeleton h-3.5 w-40 rounded-full" />
          <div className="skeleton h-7 w-80 max-w-full rounded-full" />
        </div>
        <div className="skeleton hidden h-10 w-36 rounded-full sm:block" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(400px,1fr)]">
        <div className="space-y-6">
          <div className="skeleton aspect-[4/3] rounded-2xl" />
          <PanelSkeleton rows={3} />
        </div>
        <div className="space-y-6">
          <PanelSkeleton rows={5} />
          <PanelSkeleton rows={2} />
        </div>
      </div>
    </Loading>
  );
}
