"use client";

import { type ImgHTMLAttributes, useCallback, useState } from "react";
import { cn } from "@/lib/utils";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  /** Above-the-fold image: fetch eagerly at high priority and skip the fade. */
  priority?: boolean;
};

/** `<img>` that loads lazily, decodes off the main thread, shimmers while loading and fades in when ready. */
export function SmoothImage({ priority, className, onLoad, alt = "", src, ...props }: Props) {
  const [loadedSrc, setLoadedSrc] = useState<unknown>(null);
  const loaded = loadedSrc === src;

  // Images that finished loading before hydration never fire onLoad.
  const ref = useCallback(
    (img: HTMLImageElement | null) => {
      if (img?.complete && img.naturalWidth) setLoadedSrc(src);
    },
    [src],
  );

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      onLoad={(e) => {
        setLoadedSrc(src);
        onLoad?.(e);
      }}
      className={cn(!priority && (loaded ? "img-in" : "img-loading"), className)}
      {...props}
    />
  );
}
