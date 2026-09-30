"use client";

import { ArrowRight, Loader2, Mic, Search, Square } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useSpeechRecognition } from "@/lib/speech";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export function SearchBar({
  value,
  onChange,
  onSubmit,
  loading,
  placeholder = "Show me water projects completed in Rajasthan after January 2026",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  loading?: boolean;
  placeholder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const speech = useSpeechRecognition({
    onFinal: (t) => {
      onChange(t);
      onSubmit(t);
    },
    onError: (message) => toast.error(message),
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if ((e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) && !["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value.trim());
      }}
      className="group relative flex items-center gap-2 rounded-lg border border-line-strong bg-surface p-2 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors focus-within:border-accent/50"
    >
      <Search className="ml-3 size-5 shrink-0 text-subtle transition-colors group-focus-within:text-accent" />
      <input
        ref={ref}
        autoFocus
        value={speech.listening ? speech.interim : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={speech.listening ? "Listening…" : placeholder}
        aria-label="Search your impact evidence"
        className="h-12 min-w-0 flex-1 bg-transparent text-[16px] text-foreground outline-none placeholder:text-subtle"
      />
      {speech.supported && (
        <button
          type="button"
          onClick={speech.listening ? speech.stop : speech.start}
          className={cn(
            "relative grid size-10 shrink-0 place-items-center rounded-full transition-colors",
            speech.listening ? "bg-danger text-white" : "text-subtle hover:bg-tint/5 hover:text-accent",
          )}
          aria-label={speech.listening ? "Stop voice search" : "Search by voice"}
          title="Search by voice"
        >
          {speech.listening && <span className="absolute inset-0 animate-ping rounded-full bg-danger/40" />}
          {speech.listening ? <Square className="relative size-3.5 fill-current" /> : <Mic className="size-[18px]" />}
        </button>
      )}
      <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[10.5px] text-subtle md:block">/</kbd>
      <Button type="submit" variant="primary" size="lg" disabled={loading || !value.trim()} className="shrink-0">
        {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
        <span className="max-sm:hidden">Search Evidence</span>
      </Button>
    </form>
  );
}
