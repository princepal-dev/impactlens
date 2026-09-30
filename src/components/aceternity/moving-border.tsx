"use client";

import { motion, useAnimationFrame, useMotionTemplate, useMotionValue, useTransform } from "motion/react";
import * as React from "react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export function MovingBorder({
  children,
  duration = 3000,
  rx,
  ry,
}: {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  ry?: string;
}) {
  const pathRef = useRef<SVGRectElement>(null);
  const progress = useMotionValue(0);

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength();
    if (length) progress.set((time * (length / duration)) % length);
  });

  const x = useTransform(progress, (v) => pathRef.current?.getPointAtLength(v).x ?? 0);
  const y = useTransform(progress, (v) => pathRef.current?.getPointAtLength(v).y ?? 0);
  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="absolute size-full" width="100%" height="100%">
        <rect fill="none" width="100%" height="100%" rx={rx} ry={ry} ref={pathRef} />
      </svg>
      <motion.div style={{ position: "absolute", top: 0, left: 0, display: "inline-block", transform }}>{children}</motion.div>
    </>
  );
}

export function MovingBorderButton({
  children,
  className,
  containerClassName,
  borderRadius = "0.625rem",
  duration = 3200,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  containerClassName?: string;
  borderRadius?: string;
  duration?: number;
}) {
  return (
    <button
      className={cn("group relative overflow-hidden bg-transparent p-px outline-none focus-visible:ring-2 focus-visible:ring-accent/50", containerClassName)}
      style={{ borderRadius }}
      {...props}
    >
      <div className="absolute inset-0" style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}>
        <MovingBorder duration={duration} rx="20%" ry="20%">
          <div className="size-16 bg-[radial-gradient(var(--accent)_40%,transparent_60%)] opacity-90" />
        </MovingBorder>
      </div>
      <div
        className={cn(
          "relative flex size-full items-center justify-center gap-2 border border-line bg-surface/90 text-sm font-medium text-foreground backdrop-blur-xl transition-colors group-hover:bg-surface",
          className,
        )}
        style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}
      >
        {children}
      </div>
    </button>
  );
}
