"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { Toaster } from "sonner";
import { useTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/** Segmented Light / Dark / System switch. */
export function ThemeToggle({ className, showLabels = false }: { className?: string; showLabels?: boolean }) {
  const { theme, setTheme } = useTheme();
  return (
    <div role="radiogroup" aria-label="Theme" className={cn("inline-flex rounded-md border border-line bg-tint/[0.03] p-0.5", className)}>
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          title={label}
          onClick={() => setTheme(value)}
          className={cn(
            "flex h-7 flex-1 items-center justify-center gap-1.5 rounded-[5px] px-2 text-[12px] transition-colors",
            theme === value ? "bg-surface text-foreground shadow-sm ring-1 ring-line" : "text-subtle hover:text-foreground",
          )}
        >
          <Icon className="size-3.5" />
          {showLabels && label}
        </button>
      ))}
    </div>
  );
}

/** One-tap switch between light and dark for compact headers. */
export function ThemeCycleButton({ className }: { className?: string }) {
  const { resolved, setTheme } = useTheme();
  const next = resolved === "dark" ? "light" : "dark";
  const Icon = resolved === "dark" ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={cn("grid size-8 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-tint/[0.05] hover:text-foreground", className)}
    >
      <Icon className="size-4" />
    </button>
  );
}

export function ThemedToaster() {
  const { resolved } = useTheme();
  return (
    <Toaster
      theme={resolved}
      position="bottom-right"
      toastOptions={{
        style: { background: "var(--surface)", border: "1px solid var(--line-strong)", color: "var(--foreground)", borderRadius: 8 },
      }}
    />
  );
}
