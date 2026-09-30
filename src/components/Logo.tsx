import { Aperture } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-lime text-lime-foreground">
        <Aperture className="size-[18px]" strokeWidth={2.4} />
      </div>
      <span className="text-[16px] font-semibold tracking-tight">ImpactLens</span>
    </div>
  );
}
