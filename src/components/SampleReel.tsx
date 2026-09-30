import { ArrowUpRight, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { StageBadge } from "@/components/ImpactBadge";
import { thumbUrl } from "@/lib/media-url";
import { SAMPLES, sampleTitle } from "@/lib/samples";
import type { MediaAsset } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_ITEMS = 16;
const MIN_ITEMS = 6;
const SECONDS_PER_ITEM = 4;

interface ReelItem {
  key: string;
  href: string;
  title: string;
  location: string;
  stage?: string;
  src: string;
  local: boolean;
}

/** Interleaves items across projects so neighbouring cards show different work. */
function interleave<T>(items: T[], group: (item: T) => string, limit: number) {
  const buckets = new Map<string, T[]>();
  for (const item of items) {
    const k = group(item);
    buckets.set(k, [...(buckets.get(k) ?? []), item]);
  }
  const queues = [...buckets.values()];
  const out: T[] = [];
  while (out.length < limit && queues.some((q) => q.length)) {
    for (const q of queues) {
      const next = q.shift();
      if (next && out.length < limit) out.push(next);
    }
  }
  return out;
}

const looksLikeFilename = (title: string) => !title || /\.(jpe?g|png|webp|heic|gif)$/i.test(title);

function reelItems(assets: MediaAsset[]): ReelItem[] {
  const sampleIds = new Set(SAMPLES.map((s) => s.file));
  const loaded = assets.filter((a) => sampleIds.has(a.id) && a.secureUrl && a.resourceType === "image");

  if (loaded.length >= MIN_ITEMS) {
    return interleave(loaded, (a) => a.projectId ?? "", MAX_ITEMS).map((a) => ({
      key: a.id,
      href: `/media/${a.id}`,
      title: looksLikeFilename(a.title) ? sampleTitle(a.id) : a.title,
      location: a.location,
      stage: a.stage,
      src: thumbUrl(a, 480, 320),
      local: false,
    }));
  }

  const bundled = SAMPLES.filter((s) => s.collection === "field");
  return interleave(bundled, (s) => s.projectId, MAX_ITEMS).map((s) => ({
    key: s.file,
    href: "/samples",
    title: sampleTitle(s.file),
    location: s.location,
    stage: s.stage,
    src: `/samples/${s.file}.jpg`,
    local: true,
  }));
}

function ReelCard({ item, hidden }: { item: ReelItem; hidden?: boolean }) {
  return (
    <li className="mr-3 shrink-0">
      <Link
        href={item.href}
        tabIndex={hidden ? -1 : undefined}
        className="group relative block aspect-[3/2] w-60 overflow-hidden rounded-2xl border border-line bg-media sm:w-64"
      >
        {item.local ? (
          <Image
            src={item.src}
            alt={hidden ? "" : item.title}
            fill
            sizes="256px"
            className="object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.06]"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already resizes and formats this thumbnail
          <img
            src={item.src}
            alt={hidden ? "" : item.title}
            width={480}
            height={320}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.06]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="absolute left-2.5 right-2.5 top-2.5 flex items-start justify-between">
          {item.stage ? <StageBadge stage={item.stage} /> : <span />}
          <span className="grid size-7 place-items-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-md transition-all duration-300 group-hover:rotate-45 group-hover:bg-white group-hover:text-[#10120a] group-hover:opacity-100">
            <ArrowUpRight className="size-3.5" />
          </span>
        </div>
        <div className="absolute inset-x-3 bottom-2.5 text-white">
          <div className="truncate text-[13px] font-semibold leading-snug">{item.title}</div>
          <div className="mt-0.5 flex items-center gap-1 truncate text-[11.5px] text-white/65">
            <MapPin className="size-3 shrink-0" /> {item.location}
          </div>
        </div>
      </Link>
    </li>
  );
}

/** Auto-scrolling strip of sample field evidence. Pure CSS animation, no client JavaScript. */
export function SampleReel({ assets, className }: { assets: MediaAsset[]; className?: string }) {
  const items = reelItems(assets);
  if (items.length < MIN_ITEMS) return null;

  return (
    <div
      className={cn("marquee -mx-1 py-1", className)}
      style={{ "--marquee-duration": `${items.length * SECONDS_PER_ITEM}s` } as React.CSSProperties}
    >
      <div className="marquee-track">
        <ul className="flex" aria-label="Sample field evidence">
          {items.map((item) => (
            <ReelCard key={item.key} item={item} />
          ))}
        </ul>
        <ul className="flex" aria-hidden>
          {items.map((item) => (
            <ReelCard key={item.key} item={item} hidden />
          ))}
        </ul>
      </div>
    </div>
  );
}
