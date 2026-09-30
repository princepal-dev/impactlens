"use client";

import { motion, stagger, useAnimate } from "motion/react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export function TextGenerateEffect({
  words,
  className,
  duration = 0.45,
  delay = 0.025,
}: {
  words: string;
  className?: string;
  duration?: number;
  delay?: number;
}) {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    animate("span", { opacity: 1, filter: "blur(0px)" }, { duration, delay: stagger(delay) });
  }, [words, animate, duration, delay]);

  return (
    <div ref={scope} className={cn("text-generate", className)}>
      {words.split(" ").map((word, i) => (
        <motion.span key={`${word}-${i}`} className="opacity-0" style={{ filter: "blur(6px)" }}>
          {word}{" "}
        </motion.span>
      ))}
    </div>
  );
}
