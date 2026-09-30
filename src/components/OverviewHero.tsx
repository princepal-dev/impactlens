import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { BackgroundBeams } from "./aceternity/background-beams";
import { Spotlight } from "./aceternity/spotlight";
import { AskVoiceButton, AskVoiceOrb } from "./AskVoice";
import { NewProjectDialog } from "./NewProjectDialog";
import { Button } from "./ui/button";

export function OverviewHero({ assets, sites, reportHref }: { assets: number; sites: number; reportHref?: string }) {
  return (
    <section className="no-print relative mb-8 overflow-hidden rounded-2xl border border-line-strong bg-[#06110f] text-white">
      <Spotlight className="-left-10 -top-40 text-teal-300 md:-top-20 md:left-40" />
      <BackgroundBeams className="opacity-80" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_10%,rgba(45,212,191,0.16),transparent_55%)]" />
      <div className="relative z-10 flex flex-col gap-10 px-6 py-9 md:flex-row md:items-center md:justify-between md:px-10 md:py-11">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] text-white/75 backdrop-blur">
            <span className="size-1.5 rounded-full bg-teal-300 shadow-[0_0_8px_#5eead4]" />
            {assets.toLocaleString("en-IN")} evidence asset{assets === 1 ? "" : "s"} · {sites} field site{sites === 1 ? "" : "s"}
          </div>
          <h1 className="mt-5 bg-gradient-to-b from-white to-white/65 bg-clip-text text-[32px] font-semibold leading-[1.1] tracking-tight text-transparent md:text-[42px]">
            Your field evidence, instantly answerable.
          </h1>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-white/65">
            Upload photos and video from the field. ImpactLens indexes every frame with AI so you can search, compare and report — or simply ask out loud.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            <Button variant="primary" asChild>
              <Link href="/media?upload=1"><Plus /> Upload Media</Link>
            </Button>
            <AskVoiceButton />
            {reportHref ? (
              <Button variant="secondary" asChild>
                <Link href={reportHref}><FileText /> Generate Report</Link>
              </Button>
            ) : (
              <NewProjectDialog />
            )}
          </div>
        </div>
        <div className="mx-auto shrink-0 md:mx-0 md:mr-6">
          <AskVoiceOrb />
        </div>
      </div>
    </section>
  );
}
