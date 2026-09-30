"use client";

import { ImageOff } from "lucide-react";
import { useState } from "react";
import { displayUrl, naturalSrcSet, thumbSrcSet, thumbUrl } from "@/lib/media-url";
import type { CloudinaryRef } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SmoothImage } from "./ui/smooth-image";

type Ref = Pick<CloudinaryRef, "secureUrl" | "resourceType"> & { title?: string };

/** Renders a Cloudinary-optimized thumbnail with graceful fallbacks. */
export function MediaThumb({
  asset,
  w = 640,
  h = 420,
  className,
  full,
  sizes,
  priority,
}: {
  asset: Ref;
  w?: number;
  h?: number;
  className?: string;
  full?: boolean;
  /** Rendered width hint; enables a responsive `srcSet` so small screens fetch smaller files. */
  sizes?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

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
          preload="none"
          muted
          playsInline
          controls
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <SmoothImage
      src={full ? displayUrl(asset) : thumbUrl(asset, w, h)}
      srcSet={sizes ? (full ? naturalSrcSet(asset) : thumbSrcSet(asset, w, h)) : undefined}
      sizes={sizes}
      alt={asset.title ?? "Field media"}
      priority={priority}
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
