"use client";

import { ArrowRight, ArrowUpRight, Loader2, Mic, MicOff, Send, Square, Volume2, VolumeX, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { AssistantAction, AssistantReply } from "@/lib/assistant";
import { requestJSON } from "@/lib/http";
import { speak, stopSpeaking, useSpeechRecognition } from "@/lib/speech";
import type { MediaAsset } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MediaThumb } from "./MediaThumb";

export const VOICE_EVENT = "impactlens:voice";

type Mode = "idle" | "listening" | "thinking" | "speaking";
type Turn =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "assistant"; text: string; assets: MediaAsset[]; action: AssistantAction | null; engine: string };

const SUGGESTIONS = [
  "How much evidence do we have?",
  "Show me solar installations",
  "Which project has the most evidence?",
  "Open the impact reports",
];

export function openVoiceAgent(listen = true) {
  window.dispatchEvent(new CustomEvent(VOICE_EVENT, { detail: { listen } }));
}

export function VoiceOrb({ mode, size = 56, className }: { mode: Mode; size?: number; className?: string }) {
  const Icon = mode === "thinking" ? Loader2 : mode === "speaking" ? Volume2 : Mic;
  const icon = Math.round(size * 0.4);
  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center rounded-full border transition-colors",
        mode === "listening"
          ? "border-danger/40 bg-danger/10 text-danger"
          : mode === "idle"
            ? "border-line-strong bg-surface text-muted"
            : "border-accent/40 bg-accent/10 text-accent",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {mode === "listening" && <span className="absolute inset-0 animate-ping rounded-full border border-danger/40" />}
      <Icon className={cn(mode === "thinking" && "animate-spin")} style={{ width: icon, height: icon }} />
    </span>
  );
}

function AssetStrip({ assets }: { assets: MediaAsset[] }) {
  if (!assets.length) return null;
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {assets.map((a) => (
        <Link key={a.id} href={`/media/${a.id}`} className="group relative overflow-hidden rounded-md border border-line">
          <MediaThumb asset={a} w={320} h={200} className="aspect-[16/10] w-full transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-1.5 pt-6">
            <div className="line-clamp-1 text-[11.5px] font-medium text-white">{a.title}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function VoiceAgent() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const [muted, setMuted] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const turnsRef = useRef(turns);
  const mutedRef = useRef(muted);

  useEffect(() => {
    turnsRef.current = turns;
    mutedRef.current = muted;
  });

  const ask = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q) return;
      stopSpeaking();
      const history = turnsRef.current.slice(-6).map((t) => ({ role: t.role, text: t.text }));
      setTurns((t) => [...t, { id: nextId.current++, role: "user", text: q }]);
      setText("");
      setMode("thinking");
      const res = await requestJSON<AssistantReply>("/api/assistant", { method: "POST", json: { question: q, history }, timeoutMs: 60_000 });
      if (!res.ok) {
        setMode("idle");
        setTurns((t) => [...t, { id: nextId.current++, role: "assistant", text: res.error, assets: [], action: null, engine: "" }]);
        return;
      }
      const r = res.data;
      setTurns((t) => [...t, { id: nextId.current++, role: "assistant", text: r.answer, assets: r.assets, action: r.action, engine: r.engine }]);
      if (r.action?.navigate) setTimeout(() => router.push(r.action!.href), 900);
      if (mutedRef.current) setMode("idle");
      else speak(r.answer, { onStart: () => setMode("speaking"), onEnd: () => setMode("idle") });
    },
    [router],
  );

  const speech = useSpeechRecognition({
    onFinal: (t) => ask(t),
    onError: (message) => toast.error(message),
  });

  const listen = useCallback(() => {
    stopSpeaking();
    speech.start();
  }, [speech]);

  useEffect(() => {
    const onOpen = (e: Event) => {
      setOpen(true);
      if ((e as CustomEvent<{ listen?: boolean }>).detail?.listen && speech.supported) setTimeout(listen, 250);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener(VOICE_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(VOICE_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, [listen, speech.supported]);

  useEffect(() => {
    if (!open) {
      stopSpeaking();
      speech.stop();
    }
  }, [open, speech]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [turns, speech.interim, mode]);

  const view: Mode = speech.listening ? "listening" : mode;
  const status =
    view === "listening" ? "Listening…" : view === "thinking" ? "Searching your evidence…" : view === "speaking" ? "Speaking" : speech.supported ? "Tap the mic and ask anything" : "Type a question below";

  return (
    <div className="no-print">
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-5 right-5 z-50"
          >
            <button
              onClick={() => openVoiceAgent(true)}
              aria-label="Ask ImpactLens by voice"
              className="flex h-10 items-center gap-2 rounded-full border border-line-strong bg-surface px-3.5 text-[13px] font-medium shadow-lg shadow-black/10 transition-colors hover:border-tint/30"
            >
              <Mic className="size-4 text-muted" />
              <span className="max-sm:hidden">Ask ImpactLens</span>
              <kbd className="font-mono text-[11px] text-subtle max-md:hidden">⌘J</kbd>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-label="ImpactLens voice assistant"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed bottom-5 right-5 z-50 flex max-h-[min(680px,calc(100vh-40px))] w-[min(420px,calc(100vw-40px))] origin-bottom-right flex-col overflow-hidden rounded-xl border border-line-strong bg-surface shadow-2xl shadow-black/25"
          >
            <header className="flex items-center gap-3 border-b border-line px-4 py-3">
              <VoiceOrb mode={view} size={30} />
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-medium">Ask ImpactLens</div>
                <div className="truncate text-[12px] text-muted">{status}</div>
              </div>
              <button
                onClick={() => {
                  setMuted((m) => !m);
                  stopSpeaking();
                  if (view === "speaking") setMode("idle");
                }}
                className="rounded-md p-1.5 text-subtle transition-colors hover:bg-tint/5 hover:text-foreground"
                aria-label={muted ? "Unmute voice replies" : "Mute voice replies"}
                title={muted ? "Voice replies off" : "Voice replies on"}
              >
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
              <button onClick={() => setOpen(false)} className="rounded-md p-1.5 text-subtle transition-colors hover:bg-tint/5 hover:text-foreground" aria-label="Close assistant">
                <X className="size-4" />
              </button>
            </header>

            <div ref={scroller} className="scrollbar-thin min-h-[260px] flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {turns.length === 0 && !speech.interim && (
                <div className="flex flex-col items-center pb-2 pt-4 text-center">
                  <button onClick={speech.supported ? listen : undefined} className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent/50" aria-label="Start listening">
                    <VoiceOrb mode={view} size={56} />
                  </button>
                  <h3 className="mt-4 text-[15px] font-medium">Ask about your evidence</h3>
                  <p className="mt-1 max-w-[280px] text-[13px] leading-relaxed text-muted">
                    Speak naturally. Answers come from your indexed field media, with links to the source.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => ask(s)}
                        className="rounded-md border border-line px-2.5 py-1 text-[12.5px] text-muted transition-colors hover:border-line-strong hover:text-foreground"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {turns.map((t) =>
                t.role === "user" ? (
                  <div key={t.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-tint/[0.08] px-3.5 py-2 text-[13.5px] leading-snug">{t.text}</div>
                  </div>
                ) : (
                  <div key={t.id} className="flex gap-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] leading-relaxed">
                        {t.text}
                      </div>
                      <AssetStrip assets={t.assets} />
                      {t.action && !t.action.navigate && (
                        <Link
                          href={t.action.href}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-[12.5px] font-medium transition-colors hover:border-accent/50 hover:text-accent"
                        >
                          {t.action.label} <ArrowUpRight className="size-3.5" />
                        </Link>
                      )}
                      {t.action?.navigate && (
                        <div className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-accent">
                          <ArrowRight className="size-3.5" /> Opening {t.action.label}
                        </div>
                      )}
                      {t.engine && <div className="mt-1.5 text-[11px] text-subtle">{t.engine}</div>}
                    </div>
                  </div>
                ),
              )}

              {speech.interim && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md border border-dashed border-accent/50 px-3.5 py-2 text-[13.5px] italic text-muted">{speech.interim}</div>
                </div>
              )}
              {view === "thinking" && (
                <div className="flex items-center gap-2 text-[12.5px] text-muted">
                  <Loader2 className="size-3.5 animate-spin text-accent" /> Searching your evidence…
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(text);
              }}
              className="flex items-center gap-2 border-t border-line p-3"
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={speech.listening ? "Listening…" : "Ask a question…"}
                aria-label="Ask a question"
                className="h-10 min-w-0 flex-1 rounded-full border border-line-strong bg-background px-4 text-[13.5px] outline-none placeholder:text-subtle focus-visible:border-accent/60"
              />
              {text.trim() ? (
                <button type="submit" disabled={view === "thinking"} className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground transition-opacity disabled:opacity-50" aria-label="Send">
                  <Send className="size-4" />
                </button>
              ) : speech.supported ? (
                <button
                  type="button"
                  onClick={speech.listening ? speech.stop : listen}
                  disabled={view === "thinking"}
                  className={cn(
                    "relative grid size-10 shrink-0 place-items-center rounded-full transition-all disabled:opacity-50",
                    speech.listening ? "bg-danger text-white" : "bg-accent text-accent-foreground hover:scale-105",
                  )}
                  aria-label={speech.listening ? "Stop listening" : "Start listening"}
                >
                  {speech.listening && <span className="absolute inset-0 animate-ping rounded-full bg-danger/40" />}
                  {speech.listening ? <Square className="relative size-3.5 fill-current" /> : <Mic className="size-4" />}
                </button>
              ) : (
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-subtle" title="Voice input isn't supported in this browser">
                  <MicOff className="size-4" />
                </span>
              )}
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
