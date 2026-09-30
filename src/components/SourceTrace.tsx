"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { derivedAssets } from "@/lib/media-url";
import type { MediaAsset } from "@/lib/types";
import { cn, fmtDate } from "@/lib/utils";

function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        const abs = value.startsWith("/") ? `${window.location.origin}${value}` : value;
        navigator.clipboard?.writeText(abs);
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
      className="shrink-0 rounded p-1 text-subtle transition-colors hover:bg-tint/5 hover:text-foreground"
      aria-label="Copy"
    >
      {done ? <Check className="size-3.5 text-accent" /> : <Copy className="size-3.5" />}
    </button>
  );
}

export function SourceTrace({ asset }: { asset: MediaAsset }) {
  const rows: [string, string, boolean?][] = [
    ["Public ID", asset.cloudinaryPublicId, true],
    ["Secure URL", asset.secureUrl, true],
    ["Resource type", asset.resourceType],
    ["Format", asset.format ? asset.format.toUpperCase() : "—"],
    ["Dimensions", asset.width ? `${asset.width} × ${asset.height} px` : "—"],
    ["Uploaded", fmtDate(asset.createdAt)],
    ["Storage", "Cloudinary"],
  ];
  return (
    <div className="space-y-5">
      <dl className="divide-y divide-line rounded-xl border border-line text-[12.5px]">
        {rows.map(([k, v, copyable]) => (
          <div key={k} className="flex items-center gap-3 px-3 py-2">
            <dt className="w-32 shrink-0 text-subtle">{k}</dt>
            <dd className={cn("min-w-0 flex-1 truncate text-soft", copyable && "font-mono text-[11.5px]")} title={v}>{v}</dd>
            {copyable && <CopyButton value={v} />}
          </div>
        ))}
      </dl>
      <div>
        <div className="label-mono mb-2">Derived transformations</div>
        <ul className="space-y-1.5">
          {derivedAssets(asset).map((d) => (
            <li key={d.label} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2">
              <span className={cn("size-1.5 shrink-0 rounded-full", d.transformation === "none" ? "bg-positive" : "bg-accent")} />
              <span className="w-32 shrink-0 text-[12.5px]">{d.label}</span>
              <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-subtle">{d.transformation}</code>
              <a href={d.url} target="_blank" rel="noreferrer" className="shrink-0 text-subtle transition-colors hover:text-accent" aria-label={`Open ${d.label}`}>
                <ExternalLink className="size-3.5" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
