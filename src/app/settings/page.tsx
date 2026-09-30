import { Brain, Cloud, Database, FlaskConical } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { Panel } from "@/components/ui/panel";
import { integrationStatus } from "@/lib/config";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function Row({ icon: Icon, title, status, ok, detail, env }: { icon: typeof Cloud; title: string; status: string; ok: boolean; detail: string; env: string[] }) {
  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-md border border-line bg-white/[0.03]"><Icon className="size-4 text-muted" /></div>
          <div>
            <div className="text-[14px] font-medium">{title}</div>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted">{detail}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {env.map((e) => <code key={e} className="rounded-[3px] border border-line px-1.5 py-0.5 font-mono text-[10.5px] text-subtle">{e}</code>)}
            </div>
          </div>
        </div>
        <span className={cn("flex shrink-0 items-center gap-1.5 rounded-[4px] border px-2 py-1 font-mono text-[11px]", ok ? "border-positive/30 text-positive" : "border-accent/30 text-accent")}>
          <span className={cn("size-1.5 rounded-full", ok ? "bg-positive" : "bg-accent")} /> {status}
        </span>
      </div>
    </Panel>
  );
}

export default function SettingsPage() {
  const s = integrationStatus();
  return (
    <div className="page-in max-w-4xl">
      <TopBar eyebrow="Settings" title="Integrations" subtitle="ImpactLens runs end-to-end without credentials. Add keys to switch each layer from demo fallback to the live pipeline." />
      <div className="space-y-4">
        <Row
          icon={Cloud}
          title="Cloudinary — media intelligence layer"
          ok={s.cloudinary.mode !== "local"}
          status={s.cloudinary.mode === "signed" ? `Signed · ${s.cloudinary.cloudName}` : s.cloudinary.mode === "unsigned" ? `Unsigned preset · ${s.cloudinary.cloudName}` : "Local demo storage"}
          detail="Uploads, original asset references, f_auto/q_auto optimization, g_auto thumbnails, video poster frames and AI analysis frames."
          env={["NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"]}
        />
        <Row
          icon={Brain}
          title="AI vision & language"
          ok={s.ai.provider !== "demo"}
          status={s.ai.label}
          detail="Structured JSON metadata from field media, natural-language query interpretation, before/after comparison and report narrative. Falls back to a deterministic engine."
          env={["GEMINI_API_KEY", "GEMINI_MODEL", "OPENAI_API_KEY", "OPENAI_MODEL"]}
        />
        <Row
          icon={Database}
          title="Evidence database"
          ok={s.data.backend === "supabase"}
          status={s.data.backend === "supabase" ? "Supabase / Postgres" : "Local JSON store"}
          detail="Uploaded media records, AI metadata, reports and activity. Seeded demo evidence is always available."
          env={["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]}
        />
        <Row
          icon={FlaskConical}
          title="Demo mode"
          ok={!s.demoMode}
          status={s.demoMode ? "DEMO_MODE=true" : "Auto (per integration)"}
          detail="When enabled, all AI and storage calls use deterministic local fallbacks so a live demo can never fail because of an API key."
          env={["DEMO_MODE"]}
        />
      </div>
    </div>
  );
}
