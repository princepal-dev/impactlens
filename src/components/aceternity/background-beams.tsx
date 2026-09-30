"use client";

import { motion } from "motion/react";
import { memo } from "react";
import { cn } from "@/lib/utils";

const PATHS = Array.from({ length: 18 }, (_, i) => {
  const o = i * 7;
  return `M${-380 + o} ${-189 - o * 1.2}C${-380 + o} ${-189 - o * 1.2} ${-312 + o} ${216 - o} ${152 + o} ${343 - o}C${616 + o} ${470 - o} ${684 + o} ${875 - o} ${684 + o} ${875 - o}`;
});

export const BackgroundBeams = memo(function BackgroundBeams({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 flex items-center justify-center [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)]", className)}>
      <svg className="absolute size-full" width="100%" height="100%" viewBox="0 0 696 316" fill="none" preserveAspectRatio="xMidYMid slice">
        <path d={PATHS.join("")} stroke="url(#beams-static)" strokeOpacity="0.06" strokeWidth="0.5" />
        {PATHS.map((d, i) => (
          <motion.path key={i} d={d} stroke={`url(#beam-${i})`} strokeOpacity="0.5" strokeWidth="0.6" />
        ))}
        <defs>
          {PATHS.map((_, i) => (
            <motion.linearGradient
              key={i}
              id={`beam-${i}`}
              initial={{ x1: "0%", x2: "0%", y1: "0%", y2: "0%" }}
              animate={{ x1: ["0%", "100%"], x2: ["0%", "95%"], y1: ["0%", "100%"], y2: ["0%", `${93 + (i % 5)}%`] }}
              transition={{ duration: 8 + (i % 6) * 1.7, ease: "easeInOut", repeat: Infinity, delay: (i * 0.7) % 6 }}
            >
              <stop style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
              <stop style={{ stopColor: "var(--accent)" }} />
              <stop offset="32.5%" stopColor="#6ee7b7" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </motion.linearGradient>
          ))}
          <radialGradient id="beams-static" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(352 34) rotate(90) scale(555 1560.62)">
            <stop offset="0.0666667" style={{ stopColor: "var(--subtle)" }} />
            <stop offset="0.243243" style={{ stopColor: "var(--subtle)" }} />
            <stop offset="0.43594" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
});
