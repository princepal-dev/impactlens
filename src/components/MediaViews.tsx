"use client";

import { AlertTriangle, ArrowUpRight, CalendarDays, Film, FolderKanban, ImageOff, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { naturalUrl } from "@/lib/media-url";
import type { MediaAsset } from "@/lib/types";
import { cn, fmtDate, pct, STAGE_STYLES } from "@/lib/utils";
import { StageBadge } from "./ImpactBadge";
import { MediaCard } from "./MediaCard";
import { MediaThumb } from "./MediaThumb";

const needsTagging = (a: MediaAsset) => a.status === "analysis_failed" || a.status === "uploaded";

export function TilesView({ assets }: { assets: MediaAsset[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[1800px]:grid-cols-5">
      {assets.map((a) => (
        <MediaCard key={a.id} asset={a} />
      ))}
    </div>
  );
}

/** Photo-first masonry: images keep their shape, details slide in on hover. */
export function GalleryView({ assets }: { assets: MediaAsset[] }) {
  return (
    <div className="columns-2 gap-3 md:columns-3 2xl:columns-4 min-[1800px]:columns-5">
      {assets.map((a) => (
        <GalleryItem key={a.id} asset={a} />
      ))}
    </div>
  );
}

function GalleryItem({ asset: a }: { asset: MediaAsset }) {
  const [failed, setFailed] = useState(false);
  return (
    <Link href={`/media/${a.id}`} className="group relative mb-3 block break-inside-avoid overflow-hidden rounded-2xl bg-media">
      {failed ? (
        <div className="grid aspect-[4/3] place-items-center text-subtle">
          <ImageOff className="size-5" />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={naturalUrl(a)}
          alt={a.title}
          loading="lazy"
          onError={() => setFailed(true)}
          className="block h-auto w-full transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.04]"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <StageBadge stage={a.stage} />
        <span className="grid size-8 place-items-center rounded-full bg-white text-[#10120a] transition-transform duration-300 group-hover:rotate-45">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
      {a.resourceType === "video" && <Film className="absolute right-3 top-3 size-4 text-white/85 group-hover:hidden" />}
      <div className="absolute inset-x-3 bottom-3 text-white">
        <div className="line-clamp-2 text-[14px] font-semibold leading-snug">{a.title}</div>
        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-[var(--ease-out-soft)] group-hover:grid-rows-[1fr]">
          <div className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1.5 text-[12px] text-white/75">
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {a.location}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3" />
                {fmtDate(a.date)}
              </span>
            </div>
            {a.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {a.tags.slice(0, 3).map((t) => (
                  <span key={t} className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] backdrop-blur-md">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

const LIST_COLS = "grid-cols-[minmax(0,1fr)_auto_auto] lg:grid-cols-[minmax(0,2.3fr)_minmax(0,1.3fr)_minmax(0,1.1fr)_100px_118px_120px_36px]";

/** Dense table with every indexed field side by side. */
export function ListView({ assets }: { assets: MediaAsset[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-[var(--panel-shadow)]">
      <div className={cn("hidden gap-4 border-b border-line px-4 py-3 lg:grid", LIST_COLS)}>
        {["Media", "Project", "Location", "Captured", "Stage", "AI confidence", ""].map((h) => (
          <div key={h} className="label-mono">
            {h}
          </div>
        ))}
      </div>
      <ul className="divide-y divide-line">
        {assets.map((a) => (
          <li key={a.id}>
            <Link href={`/media/${a.id}`} className={cn("group grid items-center gap-4 px-4 py-3 transition-colors duration-200 hover:bg-tint/[0.03]", LIST_COLS)}>
              <div className="flex min-w-0 items-center gap-3.5">
                <div className="relative h-12 w-[72px] shrink-0 overflow-hidden rounded-lg bg-media">
                  <MediaThumb asset={a} w={144} h={96} className="size-full transition-transform duration-500 group-hover:scale-110" />
                  {a.resourceType === "video" && <Film className="absolute bottom-1 right-1 size-3 text-white" />}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-semibold tracking-tight">{a.title}</div>
                  <div className="mt-0.5 truncate text-[12px] text-muted">{a.activity || a.tags.slice(0, 3).join(" · ")}</div>
                </div>
              </div>
              <div className="hidden min-w-0 items-center gap-1.5 text-[13px] text-soft lg:flex">
                <FolderKanban className="size-3.5 shrink-0 text-subtle" />
                <span className="truncate">{a.project || "Unassigned"}</span>
              </div>
              <div className="hidden min-w-0 items-center gap-1.5 text-[13px] text-soft lg:flex">
                <MapPin className="size-3.5 shrink-0 text-subtle" />
                <span className="truncate">{a.location}</span>
              </div>
              <div className="hidden text-[13px] tabular-nums text-soft lg:block">{fmtDate(a.date)}</div>
              <div>
                <StageBadge stage={a.stage} />
              </div>
              <div className="hidden lg:block">
                {needsTagging(a) ? (
                  <span className="flex items-center gap-1 text-[12px] text-warning">
                    <AlertTriangle className="size-3.5" /> Needs tagging
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-14 overflow-hidden rounded-full bg-tint/[0.08]">
                      <div className="h-full rounded-full bg-accent" style={{ width: pct(a.confidence) }} />
                    </div>
                    <span className="text-[12px] font-medium tabular-nums text-soft">{pct(a.confidence)}</span>
                  </div>
                )}
              </div>
              <span className="arrow-chip size-8 text-muted">
                <ArrowUpRight className="size-3.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const monthKey = (d: string) => (d ? d.slice(0, 7) : "");
const monthLabel = (key: string) =>
  key ? new Date(`${key}-01T00:00:00Z`).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }) : "Undated";

/** Evidence grouped by capture month, newest first, with a stage breakdown per month. */
export function TimelineView({ assets }: { assets: MediaAsset[] }) {
  const groups = new Map<string, MediaAsset[]>();
  for (const a of [...assets].sort((x, y) => (y.date || "").localeCompare(x.date || ""))) {
    const k = monthKey(a.date);
    groups.set(k, [...(groups.get(k) ?? []), a]);
  }

  return (
    <div className="space-y-2">
      {[...groups].map(([key, items], gi) => {
        const stages = Object.entries(
          items.reduce<Record<string, number>>((acc, a) => ({ ...acc, [a.stage]: (acc[a.stage] ?? 0) + 1 }), {}),
        );
        return (
          <section key={key || "undated"} className="relative pb-6 pl-9">
            {gi < groups.size - 1 && <span className="absolute bottom-0 left-[9px] top-6 w-px bg-line-strong" />}
            <span className="absolute left-0 top-1 grid size-[19px] place-items-center rounded-full bg-lime ring-4 ring-background">
              <span className="size-1.5 rounded-full bg-lime-foreground" />
            </span>
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <h3 className="text-[17px] font-semibold tracking-tight">{monthLabel(key)}</h3>
              <span className="text-[12.5px] text-subtle">
                {items.length} item{items.length === 1 ? "" : "s"}
              </span>
              <div className="flex flex-wrap gap-1">
                {stages.map(([s, n]) => (
                  <span key={s} className={cn("rounded-full px-2 py-px text-[11px] font-medium capitalize", STAGE_STYLES[s])}>
                    {n} {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {items.map((a) => (
                <Link key={a.id} href={`/media/${a.id}`} className="lift group flex flex-col rounded-2xl border border-line bg-panel p-1.5 shadow-[var(--panel-shadow)]">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-media">
                    <MediaThumb asset={a} w={480} h={360} className="size-full transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.05]" />
                    <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[#10120a] shadow-sm">
                      {a.date ? fmtDate(a.date).replace(/,?\s\d{4}$/, "") : "No date"}
                    </span>
                    <span className="absolute bottom-2 left-2">
                      <StageBadge stage={a.stage} />
                    </span>
                  </div>
                  <div className="px-2 pb-1.5 pt-2.5">
                    <div className="truncate text-[13px] font-semibold tracking-tight">{a.title}</div>
                    <div className="mt-0.5 flex items-center justify-between gap-2 text-[11.5px] text-subtle">
                      <span className="truncate">{a.location}</span>
                      {!needsTagging(a) && (
                        <span className="flex shrink-0 items-center gap-0.5 tabular-nums">
                          <Sparkles className="size-3" /> {pct(a.confidence)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
