import { ArrowUpRight, CheckCircle2, FolderKanban, Images, Layers } from "lucide-react";
import Link from "next/link";
import { HeaderStat, PageHeader } from "@/components/PageHeader";
import { SampleImporter } from "@/components/SampleImporter";
import { SampleReel } from "@/components/SampleReel";
import type { MediaAsset } from "@/lib/types";
import { SAMPLE_PROJECTS, SAMPLES } from "@/lib/samples";
import { getAsset } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function SamplesPage() {
  const status = await Promise.all(SAMPLES.map((s) => getAsset(s.file)));
  const indexed = status.filter((a) => a?.status === "indexed").length;
  const collections = new Set(SAMPLES.map((s) => s.collection)).size;

  return (
    <div className="page-in">
      <PageHeader
        title="Sample library"
        subtitle="Load ready-made field photo collections to explore search, comparison and reports before uploading your own."
        stats={
          <>
            <HeaderStat icon={Images} label="Sample photos" value={SAMPLES.length} hint="Across every collection" />
            <HeaderStat icon={CheckCircle2} label="Loaded" value={indexed} hint={`${SAMPLES.length - indexed} still to load`} href="/media" />
            <HeaderStat icon={Layers} label="Collections" value={collections} hint="Unsplash and field photos" />
            <HeaderStat icon={FolderKanban} label="Projects" value={SAMPLE_PROJECTS.length} hint="Created automatically" href="/settings#projects" />
          </>
        }
      />
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-[17px] font-semibold tracking-tight">Sample evidence</h2>
          <Link href="/media" className="group flex items-center gap-2 text-[13px] font-medium text-muted transition-colors hover:text-foreground">
            Media library
            <span className="arrow-chip size-7">
              <ArrowUpRight className="size-3.5" />
            </span>
          </Link>
        </div>
        <SampleReel assets={status.filter((a): a is MediaAsset => a !== null)} />
      </section>
      <SampleImporter />
    </div>
  );
}
