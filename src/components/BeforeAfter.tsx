"use client";

import { ArrowRight, ChevronsLeftRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { naturalSrcSet, naturalUrl } from "@/lib/media-url";
import type { MediaAsset } from "@/lib/types";
import { cn, fmtDate } from "@/lib/utils";
import { StageBadge } from "./ImpactBadge";
import { MediaThumb } from "./MediaThumb";
import { SmoothImage } from "./ui/smooth-image";

function Caption({ label, asset, align = "left" }: { label: string; asset: MediaAsset; align?: "left" | "right" }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-1 pt-3", align === "right" && "flex-row-reverse text-right")}>
      <div className="min-w-0">
        <div className="eyebrow !text-[10px]">{label}</div>
        <Link href={`/media/${asset.id}`} className="mt-1 block truncate text-[14px] font-semibold tracking-tight transition-colors hover:text-muted">{asset.title}</Link>
        <div className="mt-0.5 text-[12px] text-subtle">{fmtDate(asset.date)} · {asset.location}</div>
      </div>
      <StageBadge stage={asset.stage} />
    </div>
  );
}

const SLIDER_SIZES = "(min-width: 1280px) 60vw, 100vw";
const SIDE_SIZES = "(min-width: 768px) 40vw, 100vw";

function SlideImage({ asset }: { asset: MediaAsset }) {
  return (
    <SmoothImage
      src={naturalUrl(asset, 1600)}
      srcSet={naturalSrcSet(asset)}
      sizes={SLIDER_SIZES}
      alt={asset.title}
      loading="eager"
      className="absolute inset-0 size-full object-cover"
      draggable={false}
    />
  );
}

export function BeforeAfter({ before, after, mode }: { before: MediaAsset; after: MediaAsset; mode: "slider" | "side" }) {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const move = useCallback((clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  }, []);

  if (mode === "side") {
    return (
      <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div>
          <div className="overflow-hidden rounded-2xl border border-line bg-media">
            <MediaThumb asset={before} w={900} h={600} sizes={SIDE_SIZES} className="aspect-[3/2] w-full" />
          </div>
          <Caption label="Before" asset={before} />
        </div>
        <div className="grid size-10 place-items-center self-center rounded-full bg-lime text-lime-foreground max-md:mx-auto max-md:rotate-90">
          <ArrowRight className="size-4" />
        </div>
        <div>
          <div className="overflow-hidden rounded-2xl border border-line bg-media">
            <MediaThumb asset={after} w={900} h={600} sizes={SIDE_SIZES} className="aspect-[3/2] w-full" />
          </div>
          <Caption label="After" asset={after} align="right" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        ref={box}
        className="relative aspect-[16/9] cursor-ew-resize select-none overflow-hidden rounded-2xl border border-line bg-media"
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          move(e.clientX);
        }}
        onPointerMove={(e) => dragging.current && move(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5));
          if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 5));
        }}
        tabIndex={0}
        role="slider"
        aria-valuenow={Math.round(pos)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Before and after comparison"
      >
        <SlideImage asset={after} />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <SlideImage asset={before} />
        </div>
        <div className="pointer-events-none absolute inset-y-0 w-px bg-white/90 shadow-[0_0_12px_rgba(0,0,0,0.6)]" style={{ left: `${pos}%` }}>
          <div className="absolute left-1/2 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white shadow-lg">
            <ChevronsLeftRight className="size-4 text-[#10120a]" />
          </div>
        </div>
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11.5px] font-medium text-white backdrop-blur-md">Before</span>
        <span className="absolute right-3 top-3 rounded-full bg-lime px-2.5 py-1 text-[11.5px] font-medium text-lime-foreground">After</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Caption label="Before" asset={before} />
        <Caption label="After" asset={after} align="right" />
      </div>
    </div>
  );
}
