"use client";

import { Loader2, type LucideIcon } from "lucide-react";
import { useLinkStatus } from "next/link";
import { cn } from "@/lib/utils";

/** Link icon that turns into a spinner while its route is loading. Must render inside a `<Link>`. */
export function NavIcon({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  const { pending } = useLinkStatus();
  return pending ? <Loader2 className={cn(className, "animate-spin")} aria-label="Loading" /> : <Icon className={className} />;
}
