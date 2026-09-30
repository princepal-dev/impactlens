import { CardGridSkeleton, ChipRowSkeleton, HeroSkeleton, Loading } from "@/components/Skeletons";

export default function MediaLoading() {
  return (
    <Loading label="Loading media library">
      <HeroSkeleton />
      <ChipRowSkeleton />
      <CardGridSkeleton count={12} />
    </Loading>
  );
}
