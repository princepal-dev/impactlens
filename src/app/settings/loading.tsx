import { HeroSkeleton, Loading, PanelSkeleton } from "@/components/Skeletons";

export default function SettingsLoading() {
  return (
    <Loading label="Loading settings">
      <HeroSkeleton stats={false} />
      <div className="space-y-6">
        <PanelSkeleton rows={3} />
        <PanelSkeleton rows={4} />
      </div>
    </Loading>
  );
}
