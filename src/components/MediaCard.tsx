import { AlertTriangle, CalendarDays, Film, Loader2, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import type { MediaAsset } from "@/lib/types";
import { fmtDate, pct } from "@/lib/utils";
import { ImpactBadge, StageBadge } from "./ImpactBadge";
import { MediaThumb } from "./MediaThumb";
import { Tag } from "./ui/badge";

export function CloudinaryLabel({ asset }: { asset: Pick<MediaAsset, "format"> }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-[3px] bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/85 backdrop-blur">
      <span className="size-1 rounded-full bg-accent" />
      Cloudinary{asset.format ? ` · ${asset.format}` : " optimized"}
    </span>
  );
}

export function MediaCard({ asset, highlight, relevance }: { asset: MediaAsset; highlight?: string[]; relevance?: number }) {
  const hl = new Set((highlight ?? []).map((h) => h.toLowerCase()));
  const analyzing = asset.status === "analyzing";
  const failed = asset.status === "analysis_failed" || asset.status === "uploaded";

  return (
    <Link
      href={`/media/${asset.id}`}
      className="glow-card group flex flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-[var(--panel-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:bg-panel-strong"
    >
      <div className="relative aspect-[3/2] overflow-hidden">
        <MediaThumb asset={asset} className="size-full transition-transform duration-500 group-hover:scale-[1.03]" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
          <CloudinaryLabel asset={asset} />
          {relevance !== undefined ? (
            <span className="rounded-[4px] bg-accent px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-accent-foreground">{pct(relevance)} relevant</span>
          ) : (
            asset.resourceType === "video" && <Film className="size-4 text-white/80" />
          )}
        </div>
        {analyzing && (
          <div className="absolute inset-0 grid place-items-center bg-black/60 backdrop-blur-[2px]">
            <span className="flex items-center gap-2 text-xs text-accent"><Loader2 className="size-3.5 animate-spin" /> Analyzing…</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-[14px] font-medium leading-snug">{asset.title}</h3>
          <StageBadge stage={asset.stage} />
        </div>
        <div className="mt-1 line-clamp-1 text-[12.5px] text-muted">{asset.project}</div>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-subtle">
          <span className="flex min-w-0 items-center gap-1"><MapPin className="size-3 shrink-0" /><span className="truncate">{asset.location}</span></span>
          <span className="flex items-center gap-1"><CalendarDays className="size-3" />{fmtDate(asset.date)}</span>
        </div>
        {asset.activity && <div className="mt-2 line-clamp-2 text-[12px] leading-snug text-muted">{asset.activity}</div>}
        <div className="mt-3 flex flex-wrap gap-1">
          {asset.tags.slice(0, 4).map((t) => (
            <Tag key={t} active={hl.has(t) || [...hl].some((h) => t.includes(h))}>{t}</Tag>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          {asset.impactAreas[0] ? <ImpactBadge area={asset.impactAreas[0]} className="min-w-0" /> : <span />}
          {failed ? (
            <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] text-warning"><AlertTriangle className="size-3" /> Needs tagging</span>
          ) : (
            <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[11.5px] tabular-nums text-subtle">
              <Sparkles className="size-3 text-accent/70" /> AI {pct(asset.confidence)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function MediaCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel shadow-[var(--panel-shadow)]">
      <div className="skeleton aspect-[3/2]" />
      <div className="space-y-2.5 p-4">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="flex gap-1 pt-1">
          <div className="skeleton h-4 w-12 rounded" />
          <div className="skeleton h-4 w-16 rounded" />
          <div className="skeleton h-4 w-10 rounded" />
        </div>
      </div>
    </div>
  );
}
