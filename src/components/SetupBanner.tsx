import { KeyRound } from "lucide-react";
import Link from "next/link";

export function SetupBanner({ missing }: { missing: string[] }) {
  return (
    <div className="no-print mb-8 flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <KeyRound className="mt-0.5 size-4 shrink-0 text-warning" />
        <div>
          <div className="text-[13.5px] font-medium">Connect Cloudinary and Gemini to start indexing evidence</div>
          <p className="mt-1 text-[12.5px] text-muted">
            Add the missing keys to <code className="font-mono text-foreground">.env.local</code> and restart the server:{" "}
            {missing.map((m, i) => (
              <span key={m}>
                <code className="font-mono text-[11.5px] text-warning">{m}</code>
                {i < missing.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        </div>
      </div>
      <Link href="/settings" className="shrink-0 text-[12.5px] text-warning underline-offset-4 hover:underline">
        Setup guide →
      </Link>
    </div>
  );
}
