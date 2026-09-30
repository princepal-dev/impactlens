import { HeroSkeleton, Loading } from "@/components/Skeletons";

export default function SearchLoading() {
  return (
    <Loading label="Loading search">
      <HeroSkeleton stats={false} search />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-panel p-5">
            <div className="skeleton size-10 rounded-full" />
            <div className="skeleton mt-4 h-4 w-2/3 rounded-full" />
            <div className="skeleton mt-2 h-3 w-full rounded-full" />
            <div className="skeleton mt-1.5 h-3 w-4/5 rounded-full" />
          </div>
        ))}
      </div>
    </Loading>
  );
}
