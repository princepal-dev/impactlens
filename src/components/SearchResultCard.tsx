import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import type { SearchResult } from "@/lib/types";
import { fmtDate, pct } from "@/lib/utils";
import { StageBadge } from "./ImpactBadge";
import { CloudinaryLabel } from "./MediaCard";
import { MediaThumb } from "./MediaThumb";
import { Tag } from "./ui/badge";

export function SearchResultCard({ result, rank }: { result: SearchResult; rank: number }) {
  const { asset, relevance, matched } = result;
  const hl = matched.map((m) => m.toLowerCase());
  return (
    <Link
      href={`/media/${asset.id}`}
      className="page-in group flex flex-col overflow-hidden rounded-xl border border-line bg-panel shadow-[var(--panel-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong"
      style={{ animationDelay: `${Math.min(rank, 8) * 40}ms` }}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <MediaThumb asset={asset} w={640} h={400} className="size-full transition-transform duration-500 group-hover:scale-[1.03]" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
          <CloudinaryLabel asset={asset} />
          <span className="rounded-[4px] bg-black/65 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white backdrop-blur">{pct(relevance)} match</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/40">
          <div className="h-full bg-accent/80" style={{ width: pct(relevance) }} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-[14px] font-medium">{asset.title}</h3>
          <StageBadge stage={asset.stage} />
        </div>
        <div className="mt-1 text-[12.5px] text-muted">{asset.project}</div>
        <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-subtle">
          <span className="flex items-center gap-1"><MapPin className="size-3" />{asset.location}</span>
          <span className="flex items-center gap-1"><CalendarDays className="size-3" />{fmtDate(asset.date)}</span>
        </div>
        <div className="mt-2 text-[12px] text-muted">{asset.activity}</div>
        <div className="mt-3 flex flex-wrap gap-1">
          {asset.tags.slice(0, 5).map((t) => (
            <Tag key={t} active={hl.some((h) => t === h || t.includes(h))}>{t}</Tag>
          ))}
        </div>
      </div>
    </Link>
  );
}
