"use client";

import { FileText, Images, LayoutGrid, type LucideIcon, ScanSearch, Settings, SplitSquareHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { ThemeCycleButton } from "./ThemeToggle";

type NavItem = { href: string; label: string; icon: LucideIcon };

const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/media", label: "Media", icon: Images },
  { href: "/search", label: "Search", icon: ScanSearch },
  { href: "/compare", label: "Compare", icon: SplitSquareHorizontal },
  { href: "/reports", label: "Reports", icon: FileText },
];

export const isActivePath = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

export const circleButton =
  "grid size-10 shrink-0 place-items-center rounded-full border border-line-strong bg-surface text-soft transition-[background-color,border-color,color,transform] duration-200 hover:border-ink hover:bg-ink hover:text-ink-foreground active:scale-95 [&_svg]:size-[18px]";

export function AppHeader() {
  const pathname = usePathname();
  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-chrome backdrop-blur-xl">
      <div className="flex h-[68px] items-center gap-4 px-4 lg:px-6">
        <Link href="/" className="shrink-0 rounded-xl lg:w-[248px]">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden flex-1 justify-center md:flex">
          <div className="flex items-center gap-0.5 rounded-full border border-line bg-surface p-1">
            {PRIMARY_NAV.map((item) => (
              <TopLink key={item.href} item={item} active={isActivePath(pathname, item.href)} />
            ))}
          </div>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeCycleButton className={circleButton} />
          <Link
            href="/settings"
            aria-label="Settings"
            title="Settings"
            className={cn(circleButton, pathname.startsWith("/settings") && "border-ink bg-ink text-ink-foreground")}
          >
            <Settings />
          </Link>
          <div className="ml-1 hidden items-center gap-2.5 sm:flex">
            <div className="relative grid size-10 place-items-center rounded-full bg-ink text-[13px] font-semibold text-ink-foreground">
              MO
              <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-surface bg-lime" />
            </div>
            <div className="hidden leading-tight xl:block">
              <div className="text-[13.5px] font-semibold">My Organization</div>
              <div className="text-[12px] text-subtle">Workspace admin</div>
            </div>
          </div>
        </div>
      </div>

      <nav aria-label="Primary" className="scrollbar-thin flex gap-1 overflow-x-auto px-4 pb-3 md:hidden">
        {PRIMARY_NAV.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors",
                active ? "bg-ink text-ink-foreground" : "border border-line bg-surface text-muted hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

function TopLink({ item, active }: { item: NavItem; active: boolean }) {
  const { href, label, icon: Icon } = item;
  return (
    <Link
      href={href}
      className={cn(
        "relative flex h-9 items-center gap-2 rounded-full px-4 text-[13.5px] font-medium transition-colors duration-200",
        active ? "bg-ink text-ink-foreground" : "text-muted hover:bg-tint/[0.05] hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}
