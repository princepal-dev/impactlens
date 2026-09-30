import { Brain, Cloud, Database } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ProjectManager } from "@/components/ProjectManager";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { aiEngineLabel, PROVIDER_NAMES, serviceStatus } from "@/lib/config";
import { projectSummaries } from "@/lib/store";

export const dynamic = "force-dynamic";

type Service = { icon: typeof Cloud; title: string; role: string; detail: string };

export default async function SettingsPage() {
  const s = serviceStatus();
  const projects = await projectSummaries();
  const services = [
    s.storage.connected && {
      icon: Cloud,
      title: "Cloudinary",
      role: "Media storage",
      detail: `Originals, f_auto/q_auto delivery, g_auto thumbnails and AI analysis frames · ${s.storage.cloudName}/${s.storage.folder}`,
    },
    ...s.ai.providers.map((p, i) => ({
      icon: Brain,
      title: PROVIDER_NAMES[p],
      role: i === 0 ? "Primary AI" : "Fallback AI",
      detail:
        i === 0
          ? `Vision metadata, query interpretation, before/after comparison and report narrative · ${aiEngineLabel(p)}`
          : `Used automatically when ${PROVIDER_NAMES[s.ai.providers[0]]} is unavailable · ${aiEngineLabel(p)}`,
    })),
    { icon: Database, title: "Evidence index", role: "Database", detail: "Projects, media records, AI metadata, reports and activity" },
  ].filter(Boolean) as Service[];

  return (
    <div className="page-in">
      <PageHeader title="Settings" subtitle="Projects, connected services and appearance." />

      <div className="space-y-6">
        <div id="projects" className="scroll-mt-24">
          <ProjectManager projects={projects} />
        </div>

        <Panel>
          <PanelHeader title="Connected services" />
          <ul className="divide-y divide-line">
            {services.map(({ icon: Icon, title, role, detail }) => (
              <li key={title} className="flex items-center gap-4 px-5 py-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-tint/[0.05] text-soft">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[13.5px] font-medium">{title}</span>
                    <span className="text-[12px] text-subtle">{role}</span>
                  </div>
                  <div className="truncate text-[12.5px] text-muted" title={detail}>{detail}</div>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-[12px] text-muted">
                  <span className="size-1.5 rounded-full bg-positive" /> Connected
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader title="Appearance" />
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[13.5px] font-medium">Theme</div>
              <div className="text-[12.5px] text-muted">Light, dark, or follow your system setting. Saved on this device.</div>
            </div>
            <ThemeToggle showLabels className="w-full sm:w-auto" />
          </div>
        </Panel>
      </div>
    </div>
  );
}
