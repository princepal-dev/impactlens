"use client";

import { Mic } from "lucide-react";
import { MovingBorderButton } from "./aceternity/moving-border";
import { openVoiceAgent, VoiceOrb } from "./VoiceAgent";

export function AskVoiceButton({ label = "Ask by voice" }: { label?: string }) {
  return (
    <MovingBorderButton onClick={() => openVoiceAgent(true)} containerClassName="h-10" className="px-4" borderRadius="0.5rem">
      <Mic className="size-4 text-accent" /> {label}
    </MovingBorderButton>
  );
}

export function AskVoiceOrb() {
  return (
    <button
      onClick={() => openVoiceAgent(true)}
      className="group relative grid place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-teal-300/60"
      aria-label="Ask ImpactLens by voice"
    >
      <span className="absolute inset-[-18px] rounded-full bg-teal-400/20 blur-2xl transition-opacity group-hover:opacity-100 md:opacity-70" />
      <VoiceOrb mode="idle" size={132} className="transition-transform duration-500 group-hover:scale-105" />
      <Mic className="absolute size-8 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]" />
    </button>
  );
}
