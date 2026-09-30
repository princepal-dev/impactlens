import { Brain, Cloud, Database } from "lucide-react";
import { ProjectManager } from "@/components/ProjectManager";
import { SampleImporter } from "@/components/SampleImporter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TopBar } from "@/components/TopBar";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { serviceStatus } from "@/lib/config";
import { projectSummaries } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const s = serviceStatus();
  const projects = await projectSummaries();
  const services = [
    s.storage.connected && {
      icon: Cloud,
      title: "Cloudinary",
      detail: `Originals, f_auto/q_auto delivery, g_auto thumbnails and AI analysis frames · ${s.storage.cloudName}/${s.storage.folder}`,
    },
    s.ai.connected && {
      icon: Brain,
      title: s.ai.provider === "openai" ? "OpenAI" : "Google Gemini",
      detail: `Vision metadata, query interpretation, before/after comparison and report narrative · ${s.ai.label}`,
    },
    { icon: Database, title: "Evidence index", detail: "Projects, media records, AI metadata, reports and activity" },
  ].filter(Boolean) as { icon: typeof Cloud; title: string; detail: string }[];

  return (
    <div className="page-in max-w-4xl">
      <TopBar eyebrow="Settings" title="Workspace" subtitle="Manage projects, connected services, appearance and workspace data." />
      <div className="space-y-6">
        <ProjectManager projects={projects} />

        <Panel>
          <PanelHeader eyebrow="Pipeline" title="Connected services" />
          <ul className="divide-y divide-line">
            {services.map(({ icon: Icon, title, detail }) => (
              <li key={title} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-tint/[0.03]">
                    <Icon className="size-3.5 text-muted" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-medium">{title}</div>
                    <div className="truncate text-[12px] text-subtle">{detail}</div>
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] text-positive">
                  <span className="size-1.5 rounded-full bg-positive" /> Connected
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Preferences" title="Appearance" />
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
