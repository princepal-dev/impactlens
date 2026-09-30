"use client";

import {
  ArrowUpRight,
  AudioLines,
  CloudUpload,
  Database,
  FilePlus2,
  LayoutDashboard,
  type LucideIcon,
  Mic,
  Plus,
  Settings2,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { thumbUrl } from "@/lib/media-url";
import type { WorkspaceSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { openVoiceAgent } from "./VoiceAgent";

export { Logo } from "./Logo";

type NavItem = { label: string; icon: LucideIcon; href?: string; onClick?: () => void; kbd?: string; active?: (p: string) => boolean };

const NAV: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/", active: (p) => p === "/" },
  { label: "Upload media", icon: CloudUpload, href: "/media?upload=1" },
  { label: "Sample library", icon: Database, href: "/settings#samples" },
  { label: "Settings", icon: Settings2, href: "/settings", active: (p) => p.startsWith("/settings") },
];

/** Live workspace data that follows navigation, so uploads and new projects show up without a reload. */
function useSummary(initial: WorkspaceSummary) {
  const pathname = usePathname();
  const [summary, setSummary] = useState(initial);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/stats", { signal: controller.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: WorkspaceSummary | null) => d && setSummary(d))
      .catch(() => {});
    return () => controller.abort();
  }, [pathname]);
  return summary;
}

export function Sidebar({ initial }: { initial: WorkspaceSummary }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const summary = useSummary(initial);
  const activeProject = params.get("project");

  return (
    <aside className="no-print sticky top-[88px] flex h-[calc(100vh-108px)] w-[248px] shrink-0 flex-col rounded-2xl border border-line bg-panel p-3 shadow-[var(--panel-shadow)] max-lg:hidden">
      <nav className="flex flex-col gap-0.5">
        {NAV.map((item) => (
          <SideLink key={item.label} item={item} active={item.active?.(pathname) ?? false} />
        ))}
      </nav>

      <button
        type="button"
        onClick={() => openVoiceAgent(true)}
        className="hero-panel group mt-3 rounded-2xl p-4 text-left ring-1 ring-inset ring-lime/25 transition-[transform,box-shadow] duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:ring-lime/50"
      >
        <div className="flex items-center justify-between">
          <span className="relative grid size-10 place-items-center rounded-full bg-lime text-lime-foreground">
            <span className="launcher-pulse absolute inset-0 rounded-full bg-lime" />
            <AudioLines className="relative size-5" />
          </span>
          <kbd className="rounded-full border border-white/15 px-2 py-0.5 font-mono text-[10.5px] text-white/60">⌘J</kbd>
        </div>
        <div className="mt-3 text-[15px] font-semibold tracking-tight">Ask ImpactLens</div>
        <div className="mt-0.5 text-[12px] leading-snug text-white/60">Ask about your evidence by voice or text.</div>
        <span className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/10 px-3 text-[12px] font-medium text-white transition-colors duration-200 group-hover:bg-lime group-hover:text-lime-foreground">
          <Mic className="size-3.5" /> Start talking
        </span>
      </button>

      <div className="mx-2 my-4 h-px bg-line" />

      <div className="flex items-center justify-between px-2">
        <span className="text-[14px] font-semibold tracking-tight">Projects</span>
        <Link
          href="/settings#projects"
          aria-label="Manage projects"
          title="Manage projects"
          className="grid size-7 place-items-center rounded-full border border-line-strong text-muted transition-colors hover:border-ink hover:bg-ink hover:text-ink-foreground"
        >
          <Plus className="size-3.5" />
        </Link>
      </div>

      <div className="scrollbar-thin -mx-1 mt-2 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1">
        {summary.projectList.length === 0 ? (
          <p className="px-2 py-3 text-[12.5px] leading-relaxed text-subtle">
            Group field media by programme to compare progress and build reports.
          </p>
        ) : (
          summary.projectList.map((p) => {
            const active = activeProject === p.slug;
            return (
              <Link
                key={p.id}
                href={`/media?project=${p.slug}`}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors duration-200",
                  active ? "bg-tint/[0.07]" : "hover:bg-tint/[0.04]",
                )}
              >
                <ProjectAvatar name={p.name} cover={p.cover} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium leading-tight">{p.name}</div>
                  <div className="mt-0.5 text-[11.5px] text-subtle">
                    {p.count} asset{p.count === 1 ? "" : "s"}
                  </div>
                </div>
                <span className="arrow-chip size-7 text-muted">
                  <ArrowUpRight className="size-3.5" />
                </span>
              </Link>
            );
          })
        )}
      </div>

      <Button asChild variant="primary" size="lg" className="mt-3 w-full">
        <Link href="/reports">
          <FilePlus2 />
          Generate report
        </Link>
      </Button>
    </aside>
  );
}

function ProjectAvatar({ name, cover }: { name: string; cover: WorkspaceSummary["projectList"][number]["cover"] }) {
  const usable = cover && (cover.resourceType === "image" || cover.secureUrl.includes("/upload/"));
  if (usable) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={thumbUrl(cover, 96, 96)} alt="" className="size-9 shrink-0 rounded-full bg-media object-cover" loading="lazy" />
    );
  }
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return <div className="grid size-9 shrink-0 place-items-center rounded-full bg-lime text-[11.5px] font-semibold text-lime-foreground">{initials}</div>;
}

function SideLink({ item, active }: { item: NavItem; active: boolean }) {
  const { label, icon: Icon, href, onClick, kbd } = item;
  const className = cn(
    "relative flex h-11 w-full items-center gap-3 rounded-full px-4 text-[13.5px] font-medium transition-colors duration-200",
    active ? "text-ink-foreground" : "text-muted hover:bg-tint/[0.05] hover:text-foreground",
  );
  const body = (
    <>
      {active && (
        <motion.span
          layoutId="sidebar-active"
          transition={{ type: "spring", stiffness: 450, damping: 38 }}
          className="absolute inset-0 rounded-full bg-ink"
        />
      )}
      <Icon className="relative size-[18px] shrink-0" />
      <span className="relative flex-1 truncate text-left">{label}</span>
      {kbd && <kbd className="relative font-mono text-[11px] text-subtle">{kbd}</kbd>}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  );
}
