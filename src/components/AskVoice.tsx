"use client";

import { AudioLines } from "lucide-react";
import { Button, type ButtonProps } from "./ui/button";
import { openVoiceAgent } from "./VoiceAgent";

export function AskVoiceButton({ label = "Ask by voice", variant = "secondary" }: { label?: string; variant?: ButtonProps["variant"] }) {
  return (
    <Button variant={variant} onClick={() => openVoiceAgent(true)}>
      <AudioLines /> {label}
    </Button>
  );
}
