"use client";

import { Mic } from "lucide-react";
import { Button } from "./ui/button";
import { openVoiceAgent } from "./VoiceAgent";

export function AskVoiceButton({ label = "Ask by voice" }: { label?: string }) {
  return (
    <Button variant="secondary" onClick={() => openVoiceAgent(true)}>
      <Mic /> {label}
    </Button>
  );
}
