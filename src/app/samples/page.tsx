import { CheckCircle2, FolderKanban, Images, Layers } from "lucide-react";
import { HeaderStat, PageHeader } from "@/components/PageHeader";
import { SampleImporter } from "@/components/SampleImporter";
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
      <SampleImporter />
    </div>
  );
}
