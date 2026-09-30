"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { VOICE_EVENT } from "@/lib/voice-events";

const VoiceAgent = dynamic(() => import("./VoiceAgent").then((m) => m.VoiceAgent), { ssr: false });

/** Loads the assistant bundle on first use (button or ⌘J) instead of with every page. */
export function VoiceAgentLoader() {
  const [request, setRequest] = useState<{ listen: boolean } | null>(null);

  useEffect(() => {
    if (request) return;
    const onOpen = (e: Event) => setRequest({ listen: !!(e as CustomEvent<{ listen?: boolean }>).detail?.listen });
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setRequest({ listen: false });
      }
    };
    window.addEventListener(VOICE_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(VOICE_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, [request]);

  return request ? <VoiceAgent openOnMount={request} /> : null;
}
