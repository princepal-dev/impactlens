import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
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
      className="page-in lift group flex flex-col overflow-hidden rounded-2xl border border-line bg-panel p-2 shadow-[var(--panel-shadow)]"
      style={{ animationDelay: `${Math.min(rank, 8) * 40}ms` }}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-media">
        <MediaThumb asset={asset} w={640} h={400} sizes="(min-width: 1536px) 25vw, (min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw" priority={rank < 4} className="size-full transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.05]" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
          <CloudinaryLabel asset={asset} />
          <span className="rounded-full bg-lime px-2 py-0.5 text-[11px] font-semibold tabular-nums text-lime-foreground">{pct(relevance)} match</span>
        </div>
        <span className="absolute bottom-2.5 right-2.5 grid size-8 translate-y-1 place-items-center rounded-full bg-white text-[#10120a] opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
      <div className="flex flex-1 flex-col px-2.5 pb-2 pt-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-[14.5px] font-semibold tracking-tight">{asset.title}</h3>
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
