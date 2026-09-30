"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noop = () => () => {};
/** Hydration-safe check for browser speech-recognition support. */
export function useSpeechSupported() {
  return useSyncExternalStore(noop, () => !!recognitionCtor(), () => false);
}

const ERRORS: Record<string, string> = {
  "not-allowed": "Microphone access is blocked. Allow it in your browser to use voice.",
  "service-not-allowed": "Microphone access is blocked. Allow it in your browser to use voice.",
  "audio-capture": "No microphone was found.",
  network: "Voice recognition needs a network connection.",
};

export function useSpeechRecognition({ onFinal, onError }: { onFinal: (text: string) => void; onError?: (message: string) => void }) {
  const supported = useSpeechSupported();
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const rec = useRef<Recognition | null>(null);
  const finalText = useRef("");
  const handlers = useRef({ onFinal, onError });

  useEffect(() => {
    handlers.current = { onFinal, onError };
  });

  const stop = useCallback(() => rec.current?.stop(), []);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    rec.current?.abort();
    const r = new Ctor();
    r.lang = navigator.language || "en-US";
    r.continuous = false;
    r.interimResults = true;
    finalText.current = "";
    r.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText.current += res[0].transcript;
        else live += res[0].transcript;
      }
      setInterim((finalText.current + live).trim());
    };
    r.onerror = (e) => {
      if (e.error !== "no-speech" && e.error !== "aborted") handlers.current.onError?.(ERRORS[e.error] ?? "Voice recognition stopped unexpectedly.");
    };
    r.onend = () => {
      setListening(false);
      setInterim("");
      const text = finalText.current.trim();
      if (text) handlers.current.onFinal(text);
      rec.current = null;
    };
    rec.current = r;
    setListening(true);
    try {
      r.start();
    } catch {
      setListening(false);
    }
  }, []);

  useEffect(() => () => rec.current?.abort(), []);

  return { supported, listening, interim, start, stop };
}

function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  const lang = (navigator.language || "en").slice(0, 2);
  const preferred = [/Google UK English Female/i, /Samantha/i, /Google US English/i, /Natural/i, /Aria|Jenny|Libby/i];
  for (const re of preferred) {
    const v = voices.find((x) => re.test(x.name) && x.lang.startsWith(lang));
    if (v) return v;
  }
  return voices.find((v) => v.lang.startsWith(lang)) ?? null;
}

export function speak(text: string, { onStart, onEnd }: { onStart?: () => void; onEnd?: () => void } = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return onEnd?.();
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) u.voice = voice;
  u.rate = 1.03;
  u.onstart = () => onStart?.();
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
