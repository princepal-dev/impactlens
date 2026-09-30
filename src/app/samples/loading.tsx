import { HeroSkeleton, Loading, PanelSkeleton } from "@/components/Skeletons";

export default function SamplesLoading() {
  return (
    <Loading label="Loading sample library">
      <HeroSkeleton />
      <div className="mb-3 skeleton h-4 w-36 rounded-full" />
      <div className="mb-6 flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="skeleton aspect-[3/2] w-64 shrink-0 rounded-2xl" />
        ))}
      </div>
      <PanelSkeleton rows={2} />
    </Loading>
  );
}
