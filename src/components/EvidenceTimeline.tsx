import Link from "next/link";
import type { MediaAsset, ReportContent } from "@/lib/types";
import { MediaThumb } from "./MediaThumb";

export function EvidenceTimeline({ timeline, assets }: { timeline: ReportContent["timeline"]; assets: Record<string, MediaAsset> }) {
  return (
    <ol className="relative space-y-6 border-l border-line pl-6">
      {timeline.map((t) => (
        <li key={t.month} className="relative">
          <span className="absolute -left-[29px] top-1 size-[9px] rounded-full border-2 border-accent bg-background" />
          <div className="flex flex-wrap items-baseline gap-x-3">
            <span className="print-accent font-mono text-[12px] uppercase tracking-wider text-accent">{t.label}</span>
            <span className="text-[12px] text-subtle">{t.count} asset{t.count > 1 ? "s" : ""}</span>
          </div>
          <div className="mt-1 text-[13.5px]">{t.highlight}</div>
          <div className="mt-2.5 flex gap-2">
            {t.assetIds.map((id) =>
              assets[id] ? (
                <Link key={id} href={`/media/${id}`} className="block overflow-hidden rounded-md border border-line transition-colors hover:border-accent/60" title={assets[id].title}>
                  <MediaThumb asset={assets[id]} w={220} h={150} className="h-[72px] w-[108px]" />
                </Link>
              ) : null,
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
