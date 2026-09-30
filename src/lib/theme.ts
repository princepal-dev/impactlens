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

const notify = () => listeners.forEach((l) => l());

/** Screen point the theme reveal expands from, usually the control that was clicked. */
export type ThemeOrigin = { x: number; y: number };

const REVEAL_MS = 560;

function swapClass(root: HTMLElement, resolved: ResolvedTheme) {
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
}

function apply(theme: Theme, origin?: ThemeOrigin) {
  const root = document.documentElement;
  const resolved = resolve(theme);
  if (root.classList.contains(resolved)) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    root.classList.add("theme-switching");
    swapClass(root, resolved);
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
    return;
  }

  if (!document.startViewTransition) {
    root.classList.add("theme-fade");
    swapClass(root, resolved);
    setTimeout(() => root.classList.remove("theme-fade"), 400);
    return;
  }

  const { x, y } = origin ?? { x: window.innerWidth - 80, y: 40 };
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  root.classList.add("theme-switching");
  const transition = document.startViewTransition(() => {
    swapClass(root, resolved);
    notify();
  });
  transition.ready
    .then(() =>
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: REVEAL_MS, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" },
      ),
    )
    .catch(() => {});
  transition.finished.finally(() => root.classList.remove("theme-switching"));
}

export function setTheme(theme: Theme, origin?: ThemeOrigin) {
  try {
    if (theme === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}
  apply(theme, origin);
  notify();
}

/** Center of the element that triggered a theme change, for the reveal origin. */
export function originFrom(el: Element | null): ThemeOrigin | undefined {
  if (!el) return undefined;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
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
