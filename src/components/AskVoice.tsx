"use client";

import { AudioLines } from "lucide-react";
import { Button, type ButtonProps } from "./ui/button";
import { openVoiceAgent } from "@/lib/voice-events";

export function AskVoiceButton({ label = "Ask by voice", variant = "secondary" }: { label?: string; variant?: ButtonProps["variant"] }) {
  return (
    <Button variant={variant} onClick={() => openVoiceAgent(true)}>
      <AudioLines /> {label}
    </Button>
  );
}
