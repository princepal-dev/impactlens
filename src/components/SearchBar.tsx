"use client";

import { ArrowRight, Loader2, Search } from "lucide-react";
import { useEffect, useRef } from "react";
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
      className="group relative flex items-center gap-2 rounded-lg border border-line-strong bg-surface p-2 shadow-[0_20px_60px_-30px_rgba(45,212,191,0.25)] transition-colors focus-within:border-accent/50"
    >
      <Search className="ml-3 size-5 shrink-0 text-subtle transition-colors group-focus-within:text-accent" />
      <input
        ref={ref}
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search your impact evidence"
        className="h-12 min-w-0 flex-1 bg-transparent text-[16px] text-foreground outline-none placeholder:text-subtle"
      />
      <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[10.5px] text-subtle md:block">/</kbd>
      <Button type="submit" variant="primary" size="lg" disabled={loading || !value.trim()} className="shrink-0">
        {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
        <span className="max-sm:hidden">Search Evidence</span>
      </Button>
    </form>
  );
}
