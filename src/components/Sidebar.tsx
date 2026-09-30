"use client";

import { BarChart3, Building2, FileText, Images, LayoutGrid, Search, Settings, SplitSquareHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeCycleButton, ThemeToggle } from "./ThemeToggle";

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

export function Sidebar({ online }: { online: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside className="no-print sticky top-0 z-30 flex h-screen w-[232px] shrink-0 flex-col border-r border-line bg-chrome max-lg:hidden">
      <div className="flex h-14 items-center border-b border-line px-5">
        <Link href="/" className="block">
          <Logo />
        </Link>
      </div>

      <div className="label-mono px-5 pb-2 pt-5">Workspace</div>
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

      {online && (
        <Link
          href="/settings"
          className="mx-3 mt-6 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px] text-muted transition-colors hover:bg-tint/[0.03] hover:text-foreground"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-positive opacity-40" />
            <span className="relative inline-flex size-2 rounded-full bg-positive" />
          </span>
          All systems operational
        </Link>
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
