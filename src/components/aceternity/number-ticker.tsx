"use client";

import { useInView, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef } from "react";

/**
 * Counts up the leading number in `value` (e.g. "1,240", "92%") when it scrolls into view.
 * The final value is rendered by default so off-screen and printed copies are always correct.
 */
export function NumberTicker({ value, className }: { value: string; className?: string }) {
  const match = value.match(/^([\d,]+(?:\.\d+)?)(.*)$/);
  const target = match ? Number(match[1].replace(/,/g, "")) : NaN;
  const suffix = match?.[2] ?? "";
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { damping: 40, stiffness: 120 });
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || !Number.isFinite(target)) return;
    spring.jump(0);
    motionValue.set(target);
  }, [inView, target, motionValue, spring]);

  useEffect(() => {
    if (!Number.isFinite(target)) return;
    const render = (v: number) => {
      if (ref.current) ref.current.textContent = `${Math.round(v).toLocaleString("en-IN")}${suffix}`;
    };
    const unsubscribe = spring.on("change", render);
    const settle = () => {
      spring.jump(target);
      render(target);
    };
    window.addEventListener("beforeprint", settle);
    return () => {
      unsubscribe();
      window.removeEventListener("beforeprint", settle);
    };
  }, [spring, suffix, target]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
