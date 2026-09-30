"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { derivedAssets } from "@/lib/media-url";
import type { MediaAsset } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  const rows: [string, string][] = [
    ["cloudinaryPublicId", asset.cloudinaryPublicId],
    ["secureUrl", asset.secureUrl],
    ["resourceType", asset.resourceType],
    ["format", asset.format || "—"],
    ["dimensions", asset.width ? `${asset.width} × ${asset.height}` : "—"],
    ["createdAt", asset.createdAt],
    ["storage", "Cloudinary"],
  ];
  return (
    <div className="space-y-5">
      <dl className="divide-y divide-line rounded-md border border-line font-mono text-[11.5px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center gap-3 px-3 py-2">
            <dt className="w-36 shrink-0 text-subtle">{k}</dt>
            <dd className="min-w-0 flex-1 truncate text-soft" title={v}>{v}</dd>
            {(k === "secureUrl" || k === "cloudinaryPublicId") && <CopyButton value={v} />}
          </div>
        ))}
      </dl>
      <div>
        <div className="label-mono mb-2">Derived transformations</div>
        <ul className="space-y-1.5">
          {derivedAssets(asset).map((d) => (
            <li key={d.label} className="flex items-center gap-3 rounded-md border border-line px-3 py-2">
              <span className={cn("size-1.5 shrink-0 rounded-full", d.transformation === "none" ? "bg-positive" : "bg-accent")} />
              <span className="w-36 shrink-0 text-[12.5px]">{d.label}</span>
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
