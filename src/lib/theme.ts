"use client";

import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "./theme-script";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const LIGHT_QUERY = "(prefers-color-scheme: light)";
const listeners = new Set<() => void>();

function readTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function resolve(theme: Theme): ResolvedTheme {
  if (theme !== "system") return theme;
  return window.matchMedia(LIGHT_QUERY).matches ? "light" : "dark";
}

function apply(theme: Theme) {
  const root = document.documentElement;
  const resolved = resolve(theme);
  if (root.classList.contains(resolved)) return;
  root.classList.add("theme-switching");
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
}

const notify = () => listeners.forEach((l) => l());

export function setTheme(theme: Theme) {
  try {
    if (theme === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}
  apply(theme);
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.matchMedia(LIGHT_QUERY).addEventListener("change", onSystemChange);
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.matchMedia(LIGHT_QUERY).removeEventListener("change", onSystemChange);
      window.removeEventListener("storage", onStorage);
    }
  };
}

function onSystemChange() {
  if (readTheme() === "system") {
    apply("system");
    notify();
  }
}

function onStorage(e: StorageEvent) {
  if (e.key === THEME_STORAGE_KEY || e.key === null) {
    apply(readTheme());
    notify();
  }
}

const readResolved = (): ResolvedTheme => (document.documentElement.classList.contains("light") ? "light" : "dark");

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system" as Theme);
  const resolved = useSyncExternalStore(subscribe, readResolved, () => "dark" as ResolvedTheme);
  return { theme, resolved, setTheme };
}
