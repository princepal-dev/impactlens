import { Loading, PanelSkeleton } from "@/components/Skeletons";

export default function AssetLoading() {
  return (
    <Loading label="Loading media">
      <div className="mb-6 border-b border-line pb-6">
        <div className="skeleton h-4 w-32 rounded-full" />
        <div className="skeleton mt-4 h-7 w-96 max-w-full rounded-full" />
        <div className="mt-3 flex gap-3">
          <div className="skeleton h-6 w-24 rounded-full" />
          <div className="skeleton h-6 w-40 rounded-full" />
          <div className="skeleton h-6 w-28 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(400px,1fr)]">
        <div className="overflow-hidden rounded-2xl border border-line bg-panel">
          <div className="skeleton aspect-[3/2] max-h-[560px] w-full" />
          <div className="border-t border-line px-4 py-3">
            <div className="skeleton h-3.5 w-56 rounded-full" />
          </div>
        </div>
        <div className="space-y-6">
          <PanelSkeleton rows={4} />
          <PanelSkeleton rows={3} />
        </div>
      </div>
    </Loading>
  );
}
