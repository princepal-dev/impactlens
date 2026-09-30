"use client";

import { Film, ImageOff } from "lucide-react";
import { useState } from "react";
import { displayUrl, thumbUrl } from "@/lib/media-url";
import type { CloudinaryRef } from "@/lib/types";
import { cn } from "@/lib/utils";

type Ref = Pick<CloudinaryRef, "secureUrl" | "resourceType"> & { title?: string };

/** Renders a Cloudinary-optimized thumbnail with graceful fallbacks. */
export function MediaThumb({
  asset,
  w = 640,
  h = 420,
  className,
  full,
}: {
  asset: Ref;
  w?: number;
  h?: number;
  className?: string;
  full?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = full ? displayUrl(asset) : thumbUrl(asset, w, h);

  if (failed) {
    return (
      <div className={cn("grid place-items-center bg-tint/[0.03] text-subtle", className)}>
        <ImageOff className="size-5" />
      </div>
    );
  }

  if (asset.resourceType === "video" && full) {
    return (
      <div className={cn("relative bg-media", className)}>
        <video
          src={displayUrl(asset)}
          poster={thumbUrl(asset, w, h)}
          className="size-full object-cover"
          preload="metadata"
          muted
          playsInline
          controls={full}
          onError={() => setFailed(true)}
        />
        {!full && <Film className="absolute right-2 top-2 size-4 text-white/80" />}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={asset.title ?? "Field media"}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("bg-tint/[0.03] object-cover", className)}
    />
  );
}
