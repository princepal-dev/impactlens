"use client";

import { FileText, Images, LayoutGrid, type LucideIcon, Mic, Search, Settings, SplitSquareHorizontal } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ThemeCycleButton } from "./ThemeToggle";
import { openVoiceAgent } from "./VoiceAgent";

export type SidebarCounts = { assets: number; reports: number; projects: number };

type NavItem = { href: string; label: string; icon: LucideIcon; count?: keyof SidebarCounts };

const SECTIONS: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: "/", label: "Overview", icon: LayoutGrid },
      { href: "/media", label: "Media Library", icon: Images, count: "assets" },
    ],
  },
  {
    title: "Analyze",
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
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative grid size-6 place-items-center rounded-md bg-accent">
        <div className="size-2 rotate-45 border-[1.5px] border-accent-foreground" />
      </div>
      <span className="text-[14.5px] font-semibold tracking-tight">ImpactLens</span>
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

export function Sidebar({ counts: initialCounts }: { counts: SidebarCounts }) {
  const pathname = usePathname();
  const counts = useCounts(initialCounts);

  return (
    <aside className="no-print sticky top-0 z-30 flex h-screen w-[240px] shrink-0 flex-col border-r border-line bg-chrome max-lg:hidden">
      <div className="flex h-14 shrink-0 items-center px-4">
        <Link href="/" className="rounded-md px-1 py-1">
          <Logo />
        </Link>
      </div>

      <div className="scrollbar-thin flex min-h-0 flex-1 flex-col overflow-y-auto px-3">
        <Link
          href="/search"
          className="flex h-8 items-center gap-2 rounded-md border border-line bg-surface px-2.5 text-[13px] text-subtle transition-colors hover:border-line-strong hover:text-muted"
        >
          <Search className="size-3.5" />
          <span className="flex-1">Search</span>
          <kbd className="font-mono text-[11px] text-subtle">/</kbd>
        </Link>

        {SECTIONS.map((section, i) => (
          <nav key={i} className="mt-5 flex flex-col gap-px">
            {section.title && <div className="mb-1 px-2 text-[12px] font-medium text-subtle">{section.title}</div>}
            {section.items.map((item) => (
              <NavLink key={item.href} item={item} active={activeFor(pathname, item.href)} count={item.count ? counts[item.count] : undefined} />
            ))}
          </nav>
        ))}

        <div className="mt-auto flex flex-col gap-px pb-2 pt-6">
          <button
            onClick={() => openVoiceAgent(true)}
            className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13.5px] text-muted transition-colors hover:bg-tint/[0.05] hover:text-foreground"
          >
            <Mic className="size-4 text-subtle" />
            <span className="flex-1 text-left">Ask ImpactLens</span>
            <kbd className="font-mono text-[11px] text-subtle">⌘J</kbd>
          </button>
          <NavLink item={{ href: "/settings", label: "Settings", icon: Settings }} active={pathname.startsWith("/settings")} />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5 border-t border-line px-4 py-3">
        <div className="grid size-7 shrink-0 place-items-center rounded-md bg-tint/10 text-[11px] font-semibold text-soft">MO</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium leading-tight">My Organization</div>
          <div className="truncate text-[11.5px] text-subtle">
            {counts.projects} project{counts.projects === 1 ? "" : "s"} · {counts.assets} asset{counts.assets === 1 ? "" : "s"}
          </div>
        </div>
        <ThemeCycleButton className="size-7" />
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
        "relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13.5px] transition-colors",
        active ? "text-foreground" : "text-muted hover:bg-tint/[0.05] hover:text-foreground",
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
          className="absolute inset-0 rounded-md bg-tint/[0.08]"
        />
      )}
      <Icon className={cn("relative size-4 shrink-0", active ? "text-foreground" : "text-subtle")} />
      <span className="relative flex-1 truncate">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="relative text-[12px] tabular-nums text-subtle">{count.toLocaleString("en-IN")}</span>
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
            className="grid size-8 place-items-center rounded-md text-muted hover:bg-tint/[0.05] hover:text-foreground"
          >
            <Mic className="size-4" />
          </button>
          <ThemeCycleButton />
        </div>
      </div>
      <nav className="scrollbar-thin flex gap-1 overflow-x-auto px-3 pb-2">
        {ALL_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = activeFor(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                active ? "bg-tint/[0.08] text-foreground" : "text-muted hover:text-foreground",
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
