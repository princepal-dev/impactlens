import { Brain, Cloud, Database, Palette, Settings2 } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ProjectManager } from "@/components/ProjectManager";
import { SampleImporter } from "@/components/SampleImporter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { aiEngineLabel, PROVIDER_NAMES, serviceStatus } from "@/lib/config";
import { projectSummaries } from "@/lib/store";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Service = { icon: typeof Cloud; title: string; role: string; detail: string; primary?: boolean };

export default async function SettingsPage() {
  const s = serviceStatus();
  const projects = await projectSummaries();
  const services = [
    s.storage.connected && {
      icon: Cloud,
      title: "Cloudinary",
      role: "Media storage",
      primary: true,
      detail: `Originals, f_auto/q_auto delivery, g_auto thumbnails and AI analysis frames · ${s.storage.cloudName}/${s.storage.folder}`,
    },
    ...s.ai.providers.map((p, i) => ({
      icon: Brain,
      title: PROVIDER_NAMES[p],
      role: i === 0 ? "Primary AI" : "Fallback AI",
      primary: i === 0,
      detail:
        i === 0
          ? `Vision metadata, query interpretation, before/after comparison and report narrative · ${aiEngineLabel(p)}`
          : `Automatic fallback when ${PROVIDER_NAMES[s.ai.providers[0]]} is unavailable · ${aiEngineLabel(p)}`,
    })),
    { icon: Database, title: "Evidence index", role: "Database", detail: "Projects, media records, AI metadata, reports and activity" },
  ].filter(Boolean) as Service[];
  const online = s.storage.connected && s.ai.connected;

  return (
    <div className="page-in">
      <PageHero
        icon={Settings2}
        eyebrow="Workspace settings"
        title="Tune your workspace."
        subtitle="Manage projects, see the services powering your evidence pipeline, and choose how ImpactLens looks."
        aside={
          online && (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
              </span>
              <div>
                <div className="text-[13px] font-medium text-white">All systems operational</div>
                <div className="text-[12px] text-white/50">{services.length} services connected</div>
              </div>
            </div>
          )
        }
      />

      <div className="space-y-6">
        <ProjectManager projects={projects} />

        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="eyebrow">Pipeline</div>
              <h2 className="mt-1 text-[15px] font-semibold tracking-tight">Connected services</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {services.map(({ icon: Icon, title, role, detail, primary }) => (
              <Panel key={title} className="glow-card relative overflow-hidden p-5">
                {primary && <div aria-hidden className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-accent/10 blur-3xl" />}
                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-xl border",
                        primary ? "border-accent/30 bg-gradient-to-b from-accent/25 to-accent/5 text-accent" : "border-line-strong bg-tint/[0.03] text-muted",
                      )}
                    >
                      <Icon className="size-[18px]" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[14.5px] font-semibold tracking-tight">{title}</div>
                      <div className="text-[12px] text-subtle">{role}</div>
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-positive/25 bg-positive/10 px-2.5 py-1 text-[11.5px] font-medium text-positive">
                    <span className="size-1.5 rounded-full bg-positive shadow-[0_0_6px_var(--positive)]" /> Connected
                  </span>
                </div>
                <p className="relative mt-4 line-clamp-2 text-[12.5px] leading-relaxed text-muted" title={detail}>{detail}</p>
              </Panel>
            ))}
          </div>
        </section>

        <Panel>
          <PanelHeader eyebrow="Preferences" title={<span className="flex items-center gap-2"><Palette className="size-4 text-accent" /> Appearance</span>} />
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[13.5px] font-medium">Theme</div>
              <div className="text-[12px] text-subtle">Choose light or dark, or follow your system setting. Saved on this device.</div>
            </div>
            <ThemeToggle showLabels className="w-full sm:w-auto" />
          </div>
        </Panel>

        <SampleImporter />
      </div>
    </div>
  );
}
