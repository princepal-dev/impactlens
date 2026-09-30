"use client";

import { BarChart3, Building2, FileText, Images, LayoutGrid, Search, Settings, SplitSquareHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeCycleButton, ThemeToggle } from "./ThemeToggle";

const AI_NAMES: Record<string, string> = { gemini: "Gemini", openai: "OpenAI", openrouter: "OpenRouter" };

const NAV = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/media", label: "Media Library", icon: Images },
  { href: "/search", label: "Evidence Search", icon: Search },
  { href: "/compare", label: "Compare", icon: SplitSquareHorizontal },
  { href: "/reports", label: "Impact Reports", icon: FileText },
];

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative grid size-7 place-items-center rounded-[5px] border border-accent/40 bg-accent/10">
        <div className="size-2.5 rotate-45 border border-accent" />
        <div className="absolute size-1 rounded-full bg-accent" />
      </div>
      <span className="text-[15px] font-semibold tracking-tight">ImpactLens</span>
    </div>
  );
}

export function Sidebar({ services }: { services: { storage: boolean; ai: string | null } }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const live = services.storage && !!services.ai;

  return (
    <aside className="no-print sticky top-0 z-30 flex h-screen w-[232px] shrink-0 flex-col border-r border-line bg-chrome max-lg:hidden">
      <div className="px-5 pb-6 pt-5">
        <Link href="/" className="block">
          <Logo />
        </Link>
        <p className="mt-2 text-[11px] leading-4 text-subtle">Impact &amp; sustainability media intelligence</p>
      </div>

      <div className="label-mono px-5 pb-2">Workspace</div>
      <nav className="flex flex-col gap-0.5 px-3">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-[13.5px] transition-colors",
              isActive(href) ? "bg-tint/[0.06] text-foreground" : "text-muted hover:bg-tint/[0.03] hover:text-foreground",
            )}
          >
            {isActive(href) && <span className="absolute -left-3 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r bg-accent" />}
            <Icon className={cn("size-4", isActive(href) ? "text-accent" : "text-subtle group-hover:text-muted")} />
            {label}
          </Link>
        ))}
      </nav>

      {live && (
        <div className="mx-5 mt-8 rounded-md border border-line p-3">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-positive" />
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted">Live pipeline</span>
          </div>
          <div className="mt-2 space-y-1 text-[11px] text-subtle">
            <div className="flex justify-between"><span>Storage</span><span className="text-muted">Cloudinary</span></div>
            <div className="flex justify-between"><span>AI</span><span className="text-muted">{AI_NAMES[services.ai!] ?? services.ai}</span></div>
          </div>
        </div>
      )}

      <div className="mt-auto border-t border-line p-3">
        <div className="mb-2 flex items-center justify-between gap-2 px-2.5 py-1">
          <span className="text-[12px] text-subtle">Theme</span>
          <ThemeToggle />
        </div>
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-md px-2.5 py-2 text-[13.5px] transition-colors",
            pathname.startsWith("/settings") ? "bg-tint/[0.06] text-foreground" : "text-muted hover:bg-tint/[0.03] hover:text-foreground",
          )}
        >
          <Settings className="size-4 text-subtle" /> Settings
        </Link>
        <div className="mt-2 flex items-center gap-3 rounded-md px-2.5 py-2">
          <div className="grid size-7 place-items-center rounded-[5px] bg-tint/[0.06] text-[11px] font-semibold text-muted">
            <Building2 className="size-3.5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[12.5px] text-foreground">My Organization</div>
            <div className="truncate text-[11px] text-subtle">Sustainability team</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <div className="no-print sticky top-0 z-30 flex items-center gap-4 overflow-x-auto border-b border-line bg-chrome px-4 py-3 backdrop-blur lg:hidden">
      <Logo />
      <div className="flex flex-1 gap-1">
        {[...NAV, { href: "/settings", label: "Settings", icon: BarChart3 }].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "whitespace-nowrap rounded px-2 py-1 text-xs",
              (href === "/" ? pathname === "/" : pathname.startsWith(href)) ? "bg-tint/10 text-foreground" : "text-muted",
            )}
          >
            {label}
          </Link>
        ))}
      </div>
      <ThemeCycleButton />
    </div>
  );
}
