"use client";

import { FileText, Images, LayoutGrid, type LucideIcon, Search, Settings, SplitSquareHorizontal } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ThemeCycleButton } from "./ThemeToggle";
import { openVoiceAgent, VoiceOrb } from "./VoiceAgent";

export type SidebarCounts = { assets: number; reports: number; projects: number };

type NavItem = { href: string; label: string; icon: LucideIcon; count?: keyof SidebarCounts };

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Workspace",
    items: [
      { href: "/", label: "Overview", icon: LayoutGrid },
      { href: "/media", label: "Media Library", icon: Images, count: "assets" },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { href: "/search", label: "Evidence Search", icon: Search },
      { href: "/compare", label: "Compare", icon: SplitSquareHorizontal },
      { href: "/reports", label: "Impact Reports", icon: FileText, count: "reports" },
    ],
  },
];

const ALL_ITEMS = [...SECTIONS.flatMap((s) => s.items), { href: "/settings", label: "Settings", icon: Settings }];

const activeFor = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative grid size-7 place-items-center rounded-md border border-accent/40 bg-gradient-to-b from-accent/25 to-accent/5 shadow-[0_0_14px_-2px_color-mix(in_srgb,var(--accent)_50%,transparent)]">
        <div className="size-2.5 rotate-45 border border-accent" />
        <div className="absolute size-1 rounded-full bg-accent" />
      </div>
      <span className="text-[15px] font-semibold tracking-tight">ImpactLens</span>
    </div>
  );
}

/** Live counts that follow navigation, so uploads and new reports show up without a reload. */
function useCounts(initial: SidebarCounts) {
  const pathname = usePathname();
  const [counts, setCounts] = useState(initial);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/stats", { signal: controller.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: SidebarCounts | null) => d && setCounts(d))
      .catch(() => {});
    return () => controller.abort();
  }, [pathname]);
  return counts;
}

export function Sidebar({ online, counts: initialCounts }: { online: boolean; counts: SidebarCounts }) {
  const pathname = usePathname();
  const counts = useCounts(initialCounts);

  return (
    <aside className="no-print sticky top-0 z-30 flex h-screen w-[248px] shrink-0 flex-col overflow-hidden border-r border-line bg-chrome max-lg:hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top_left,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_70%)]" />
      <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-64 w-px bg-gradient-to-b from-accent/50 via-accent/10 to-transparent" />

      <div className="relative flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
        <Link href="/" className="block">
          <Logo />
        </Link>
        <ThemeCycleButton className="size-7" />
      </div>

      <div className="scrollbar-thin relative flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-3">
        <Link
          href="/search"
          className="group mt-4 flex h-9 items-center gap-2 rounded-lg border border-line bg-surface/60 px-2.5 text-[13px] text-subtle shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:border-accent/40 hover:text-muted"
        >
          <Search className="size-3.5 transition-colors group-hover:text-accent" />
          <span className="flex-1 truncate">Search evidence…</span>
          <kbd className="rounded border border-line bg-tint/[0.03] px-1.5 font-mono text-[10.5px]">/</kbd>
        </Link>

        {SECTIONS.map((section) => (
          <div key={section.title} className="mt-6">
            <div className="label-mono mb-2 px-2.5">{section.title}</div>
            <nav className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <NavLink key={item.href} item={item} active={activeFor(pathname, item.href)} count={item.count ? counts[item.count] : undefined} />
              ))}
            </nav>
          </div>
        ))}

        <div className="mt-6">
          <div className="label-mono mb-2 px-2.5">System</div>
          <NavLink item={{ href: "/settings", label: "Settings", icon: Settings }} active={pathname.startsWith("/settings")} />
          {online && (
            <Link
              href="/settings"
              className="mt-1 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] text-muted transition-colors hover:bg-tint/[0.04] hover:text-foreground"
            >
              <span className="relative ml-2 flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-positive opacity-40" />
                <span className="relative inline-flex size-2 rounded-full bg-positive" />
              </span>
              <span className="ml-1.5">All systems operational</span>
            </Link>
          )}
        </div>

        <button
          onClick={() => openVoiceAgent(true)}
          className="group relative mt-auto overflow-hidden rounded-xl border border-line bg-panel p-3 text-left shadow-[var(--panel-shadow)] transition-colors hover:border-accent/40"
        >
          <div aria-hidden className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-accent/15 blur-2xl opacity-60 transition-opacity group-hover:opacity-100" />
          <div className="relative flex items-center gap-3">
            <VoiceOrb mode="idle" size={32} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">Ask ImpactLens</div>
              <div className="truncate text-[11.5px] text-subtle">Talk to your evidence · ⌘J</div>
            </div>
          </div>
        </button>
      </div>

      <div className="relative shrink-0 border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-lg px-1.5 py-1">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-teal-400 to-emerald-600 text-[11px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
            MO
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-medium text-foreground">My Organization</div>
            <div className="truncate text-[11px] text-subtle">
              {counts.projects} project{counts.projects === 1 ? "" : "s"} · {counts.assets} asset{counts.assets === 1 ? "" : "s"}
            </div>
          </div>        </div>
      </div>
    </aside>
  );
}

function NavLink({ item, active, count }: { item: NavItem; active: boolean; count?: number }) {
  const { href, label, icon: Icon } = item;
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-2 py-1.5 text-[13.5px] transition-colors",
        active ? "font-medium text-foreground" : "text-muted hover:bg-tint/[0.04] hover:text-foreground",
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="absolute inset-0 rounded-lg border border-accent/20 bg-gradient-to-r from-accent/[0.14] to-accent/[0.03]"
        >
          <span className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-accent shadow-[0_0_10px_var(--accent)]" />
        </motion.span>
      )}
      <span
        className={cn(
          "relative grid size-7 shrink-0 place-items-center rounded-md border transition-colors",
          active
            ? "border-accent/30 bg-accent/15 text-accent shadow-[0_0_12px_-2px_color-mix(in_srgb,var(--accent)_45%,transparent)]"
            : "border-transparent text-subtle group-hover:border-line group-hover:text-muted",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="relative flex-1 truncate">{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "relative rounded-full px-1.5 py-px text-[11px] font-medium tabular-nums",
            active ? "bg-accent/15 text-accent" : "bg-tint/[0.06] text-subtle",
          )}
        >
          {count.toLocaleString("en-IN")}
        </span>
      )}
    </Link>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <div className="no-print sticky top-0 z-30 border-b border-line bg-chrome backdrop-blur-xl lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/"><Logo /></Link>
        <div className="flex items-center gap-1">
          <button
            onClick={() => openVoiceAgent(true)}
            aria-label="Ask ImpactLens by voice"
            className="grid size-8 place-items-center rounded-md hover:bg-tint/[0.05]"
          >
            <VoiceOrb mode="idle" size={22} />
          </button>
          <ThemeCycleButton />
        </div>
      </div>
      <nav className="scrollbar-thin flex gap-1 overflow-x-auto px-3 pb-2.5">
        {ALL_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = activeFor(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12.5px] transition-colors",
                active ? "border-accent/30 bg-accent/10 font-medium text-accent" : "border-line text-muted hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
