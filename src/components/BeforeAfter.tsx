"use client";

import { ArrowRight, ChevronsLeftRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { displayUrl } from "@/lib/media-url";
import type { MediaAsset } from "@/lib/types";
import { cn, fmtDate } from "@/lib/utils";
import { StageBadge } from "./ImpactBadge";
import { MediaThumb } from "./MediaThumb";

function Caption({ label, asset, align = "left" }: { label: string; asset: MediaAsset; align?: "left" | "right" }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-1 pt-3", align === "right" && "flex-row-reverse text-right")}>
      <div className="min-w-0">
        <div className="eyebrow !text-[10px]">{label}</div>
        <Link href={`/media/${asset.id}`} className="mt-1 block truncate text-[13.5px] font-medium hover:text-accent">{asset.title}</Link>
        <div className="mt-0.5 text-[12px] text-subtle">{fmtDate(asset.date)} · {asset.location}</div>
      </div>
      <StageBadge stage={asset.stage} />
    </div>
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
      <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <div>
          <div className="overflow-hidden rounded-lg border border-line">
            <MediaThumb asset={before} w={900} h={600} className="aspect-[3/2] w-full" />
          </div>
          <Caption label="Before" asset={before} />
        </div>
        <div className="grid size-10 place-items-center self-center rounded-full border border-accent/40 bg-accent/10 max-md:mx-auto max-md:rotate-90">
          <ArrowRight className="size-4 text-accent" />
        </div>
        <div>
          <div className="overflow-hidden rounded-lg border border-line">
            <MediaThumb asset={after} w={900} h={600} className="aspect-[3/2] w-full" />
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
        className="relative aspect-[16/9] cursor-ew-resize select-none overflow-hidden rounded-lg border border-line bg-media"
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={displayUrl(after)} alt={after.title} className="absolute inset-0 size-full object-cover" draggable={false} />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={displayUrl(before)} alt={before.title} className="absolute inset-0 size-full object-cover" draggable={false} />
        </div>
        <div className="pointer-events-none absolute inset-y-0 w-px bg-white/90 shadow-[0_0_12px_rgba(0,0,0,0.6)]" style={{ left: `${pos}%` }}>
          <div className="absolute left-1/2 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-black/60 backdrop-blur">
            <ChevronsLeftRight className="size-4 text-white" />
          </div>
        </div>
        <span className="absolute left-3 top-3 rounded-[3px] bg-black/60 px-2 py-1 font-mono text-[10.5px] uppercase tracking-widest text-white/85">Before</span>
        <span className="absolute right-3 top-3 rounded-[3px] bg-accent px-2 py-1 font-mono text-[10.5px] uppercase tracking-widest text-accent-foreground">After</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Caption label="Before" asset={before} />
        <Caption label="After" asset={after} align="right" />
      </div>
    </div>
  );
}
