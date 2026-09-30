import { Brain, Cloud, Database } from "lucide-react";
import { SampleImporter } from "@/components/SampleImporter";
import { TopBar } from "@/components/TopBar";
import { Panel } from "@/components/ui/panel";
import { setupStatus } from "@/lib/config";
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
        <span className={cn("flex shrink-0 items-center gap-1.5 rounded-[4px] border px-2 py-1 font-mono text-[11px]", ok ? "border-positive/30 text-positive" : "border-warning/30 text-warning")}>
          <span className={cn("size-1.5 rounded-full", ok ? "bg-positive" : "bg-warning")} /> {status}
        </span>
      </div>
    </Panel>
  );
}

const ENV_TEMPLATE = `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-api-secret
GEMINI_API_KEY=your-gemini-key`;

export default function SettingsPage() {
  const s = setupStatus();
  return (
    <div className="page-in max-w-4xl">
      <TopBar eyebrow="Settings" title="Integrations" subtitle="ImpactLens stores every original in Cloudinary, analyzes it with a vision model and keeps the evidence index in SQLite." />
      <div className="space-y-4">
        <Row
          icon={Cloud}
          title="Cloudinary — media storage & transformations"
          ok={!!s.cloudinary.mode}
          status={s.cloudinary.mode === "signed" ? `Signed · ${s.cloudinary.cloudName}` : s.cloudinary.mode === "unsigned" ? `Unsigned preset · ${s.cloudinary.cloudName}` : "Not connected"}
          detail="Uploads, original asset references, f_auto/q_auto optimization, g_auto thumbnails, video poster frames and AI analysis frames. Signed credentials also enable EXIF capture dates and importing assets by URL."
          env={["NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "CLOUDINARY_FOLDER"]}
        />
        <Row
          icon={Brain}
          title="AI vision & language"
          ok={!!s.ai.provider}
          status={s.ai.provider ? s.ai.label : "Not connected"}
          detail="Structured JSON metadata from each photo or video frame, natural-language query interpretation, before/after comparison and report narrative. Get a free key at aistudio.google.com/apikey."
          env={["GEMINI_API_KEY", "GEMINI_MODEL", "OPENAI_API_KEY"]}
        />
        <Row
          icon={Database}
          title="Evidence database"
          ok
          status={`SQLite · ${s.database.path}`}
          detail="Projects, media records, AI metadata, reports and activity. Created automatically on first run."
          env={["DATABASE_PATH"]}
        />

        {!s.ready && (
          <Panel className="p-5">
            <div className="text-[14px] font-medium">Connect your accounts</div>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[13px] text-muted">
              <li>
                Copy your cloud name, API key and API secret from the Cloudinary console (Settings → API Keys).
              </li>
              <li>Create a Gemini API key in Google AI Studio.</li>
              <li>
                Put them in <code className="font-mono text-foreground">.env.local</code> at the project root and restart{" "}
                <code className="font-mono text-foreground">npm run dev</code>.
              </li>
            </ol>
            <pre className="mt-4 overflow-x-auto rounded-md border border-line bg-black/40 p-3 font-mono text-[12px] text-muted">{ENV_TEMPLATE}</pre>
          </Panel>
        )}

        <SampleImporter ready={s.ready} />
      </div>
    </div>
  );
}
