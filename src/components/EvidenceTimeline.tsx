import Link from "next/link";
import type { MediaAsset, ReportContent } from "@/lib/types";
import { MediaThumb } from "./MediaThumb";

export function EvidenceTimeline({ timeline, assets }: { timeline: ReportContent["timeline"]; assets: Record<string, MediaAsset> }) {
  return (
    <ol className="relative space-y-4 pl-8 before:absolute before:bottom-3 before:left-[11px] before:top-3 before:w-px before:bg-line-strong">
      {timeline.map((t) => (
        <li key={t.month} className="relative">
          <span className="absolute -left-8 top-4 grid size-[23px] place-items-center rounded-full border border-line-strong bg-surface">
            <span className="size-1.5 rounded-full bg-muted" />
          </span>
          <div className="rounded-lg border border-line p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-[13px] font-medium">{t.label}</span>
              <span className="text-[12px] tabular-nums text-subtle">
                {t.count} asset{t.count === 1 ? "" : "s"}
              </span>
            </div>
            <p className="mt-1.5 text-[13.5px] leading-relaxed">{t.highlight}</p>
            {t.assetIds.some((id) => assets[id]) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {t.assetIds.map((id) =>
                  assets[id] ? (
                    <Link key={id} href={`/media/${id}`} className="group block overflow-hidden rounded-lg border border-line transition-colors hover:border-accent/60" title={assets[id].title}>
                      <MediaThumb asset={assets[id]} w={240} h={160} className="h-[76px] w-[114px]" />
                    </Link>
                  ) : null,
                )}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
